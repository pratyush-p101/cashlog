import { CATEGORIES, CATEGORY_KEYWORDS, type Category } from "./categories";

export interface ParsedExpense {
  amount: number;
  description: string;
  category: Category;
  via: "keyword" | "gemini" | "fallback";
}

// Matches "110", "1,10,000", "110.50", "5k", optionally prefixed ₹ / rs / inr.
const AMOUNT_RE = /(?:₹|rs\.?|inr)?\s*(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(k)?(?![\w.])/gi;

/**
 * Pulls the amount out of a message like "zomato 110" / "prants 5000 rs" /
 * "wifi - 600". Uses the last number in the message; whatever text remains
 * becomes the description.
 */
export function extractAmount(
  text: string
): { amount: number; description: string } | null {
  let match: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  AMOUNT_RE.lastIndex = 0;
  while ((m = AMOUNT_RE.exec(text)) !== null) match = m;
  if (!match) return null;

  let amount = parseFloat(match[1].replace(/,/g, ""));
  if (match[2]) amount *= 1000;
  if (!isFinite(amount) || amount <= 0) return null;

  const description = (
    text.slice(0, match.index) + text.slice(match.index + match[0].length)
  )
    .replace(/(?:₹|\brs\.?|\binr\b)/gi, "")
    .replace(/[-–—:,]+\s*$/g, "")
    .replace(/^\s*[-–—:,]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { amount, description: description || "Expense" };
}

function keywordCategory(text: string): Category | null {
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const words = new Set(tokens);
  // "coffees" should match the keyword "coffee"
  for (const t of tokens) if (t.endsWith("s")) words.add(t.slice(0, -1));
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => words.has(k))) return category as Category;
  }
  return null;
}

async function geminiCategory(description: string): Promise<Category | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("gemini: skipped — GEMINI_API_KEY not set");
    return null;
  }
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `Classify this Indian household expense into exactly one category.\n` +
                    `Expense: "${description}"\n` +
                    `Categories: ${CATEGORIES.join(", ")}\n` +
                    `Reply with only the category name, nothing else.`,
                },
              ],
            },
          ],
          // Generous cap: thinking models spend output tokens on internal
          // reasoning before the (tiny) answer.
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) {
      console.error("gemini: HTTP", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    // Join every text part — thinking models may split the reply into parts.
    const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
    const answer: string = parts
      .map((p) => p.text ?? "")
      .join(" ")
      .trim();
    const lower = answer.toLowerCase();
    const hit =
      CATEGORIES.find((c) => c.toLowerCase() === lower) ??
      CATEGORIES.find((c) => lower.includes(c.toLowerCase()));
    if (!hit) console.error("gemini: unusable answer:", JSON.stringify(answer));
    return hit ?? null;
  } catch (err) {
    console.error("gemini: request failed:", err);
    return null; // rate limit / timeout — fall through to "Other"
  }
}

export async function parseExpense(text: string): Promise<ParsedExpense | null> {
  const extracted = extractAmount(text);
  if (!extracted) return null;

  const fromKeywords = keywordCategory(text);
  if (fromKeywords) {
    return { ...extracted, category: fromKeywords, via: "keyword" };
  }

  const fromGemini = await geminiCategory(extracted.description);
  if (fromGemini) {
    return { ...extracted, category: fromGemini, via: "gemini" };
  }

  return { ...extracted, category: "Other", via: "fallback" };
}
