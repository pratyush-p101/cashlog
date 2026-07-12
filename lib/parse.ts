import { CATEGORIES, CATEGORY_KEYWORDS, type Category } from "./categories";

export interface ParsedExpense {
  amount: number;
  description: string;
  category: Category;
  via: "keyword" | "gemini" | "fallback";
}

// Matches "110", "1,10,000", "110.50", "5k", "100rs", "500/-", with ₹/rs/inr
// allowed as prefix or suffix.
const AMOUNT_RE =
  /(?:₹|\brs\.?|\binr\b)?\s*(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(k\b)?\s*(?:₹|rs\.?\b|inr\b|rupees?\b|rupaye\b|\/-)?(?![\w.])/gi;

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
    .replace(/(?:₹|\brs\.?|\binr\b|\brupees?\b|\brupaye\b)/gi, "")
    .replace(/[-–—:,]+\s*$/g, "")
    .replace(/^\s*[-–—:,]+/g, "")
    // drop dangling connectors: "buy book for 100rs" -> "buy book"
    .replace(/\s+(?:for|of|at|on|in|worth|ka|ke|ki|ko|liye|liya|me|mein)\s*$/i, "")
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

/** One call to Gemini; returns the text answer or null (never throws). */
async function geminiText(
  prompt: string,
  asJson: boolean
): Promise<string | null> {
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
          contents: [{ parts: [{ text: prompt }] }],
          // Generous cap: thinking models spend output tokens on internal
          // reasoning before the (tiny) answer.
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
            ...(asJson ? { responseMimeType: "application/json" } : {}),
          },
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
    const answer = parts
      .map((p) => p.text ?? "")
      .join(" ")
      .trim();
    return answer || null;
  } catch (err) {
    console.error("gemini: request failed:", err);
    return null; // rate limit / timeout — caller falls back
  }
}

async function geminiCategory(description: string): Promise<Category | null> {
  const answer = await geminiText(
    `Classify this Indian household expense into exactly one category.\n` +
      `Expense: "${description}"\n` +
      `Categories: ${CATEGORIES.join(", ")}\n` +
      `Reply with only the category name, nothing else.`,
    false
  );
  if (!answer) return null;
  const lower = answer.toLowerCase();
  const hit =
    CATEGORIES.find((c) => c.toLowerCase() === lower) ??
    CATEGORIES.find((c) => lower.includes(c.toLowerCase()));
  if (!hit) console.error("gemini: unusable answer:", JSON.stringify(answer));
  return hit ?? null;
}

/**
 * Full natural-language fallback: when the regex finds no amount at all
 * ("spent hundred bucks on a book"), ask Gemini to pull out everything.
 */
async function geminiExtract(text: string): Promise<ParsedExpense | null> {
  const answer = await geminiText(
    `Extract the expense from this message (Indian household, amounts in INR).\n` +
      `Message: "${text}"\n` +
      `Reply with only JSON: {"amount": <number in rupees>, ` +
      `"description": "<2-4 words, no amount>", ` +
      `"category": "<one of: ${CATEGORIES.join(", ")}>"}\n` +
      `If the message contains no money amount at all, reply {"amount": 0}.`,
    true
  );
  if (!answer) return null;
  try {
    const cleaned = answer.replace(/^```(?:json)?/i, "").replace(/```$/, "");
    const parsed = JSON.parse(cleaned);
    const amount = Number(parsed?.amount);
    if (!isFinite(amount) || amount <= 0) return null;
    const category =
      CATEGORIES.find(
        (c) => c.toLowerCase() === String(parsed?.category ?? "").toLowerCase()
      ) ?? "Other";
    const description =
      String(parsed?.description ?? "").trim().slice(0, 100) || "Expense";
    return { amount, description, category, via: "gemini" };
  } catch {
    console.error("gemini: extract returned non-JSON:", answer.slice(0, 200));
    return null;
  }
}

/**
 * Bulk extraction: one Gemini call for several segments at once, so a
 * 10-line message costs one request, not ten.
 */
async function geminiBulk(segments: string[]): Promise<(ParsedExpense | null)[]> {
  const none = segments.map(() => null);
  const answer = await geminiText(
    `Extract the expense from each numbered line (Indian household, amounts in INR).\n` +
      segments.map((s, i) => `${i + 1}. ${s}`).join("\n") +
      `\nReply with only a JSON array with exactly ${segments.length} objects, ` +
      `one per line in the same order: ` +
      `[{"amount": <number in rupees>, "description": "<2-4 words, no amount>", ` +
      `"category": "<one of: ${CATEGORIES.join(", ")}>"}]. ` +
      `Use {"amount": 0} for a line that contains no money amount.`,
    true
  );
  if (!answer) return none;
  try {
    const cleaned = answer.replace(/^```(?:json)?/i, "").replace(/```$/, "");
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return none;
    return segments.map((_, i) => {
      const item = arr[i];
      const amount = Number(item?.amount);
      if (!isFinite(amount) || amount <= 0) return null;
      const category =
        CATEGORIES.find(
          (c) => c.toLowerCase() === String(item?.category ?? "").toLowerCase()
        ) ?? "Other";
      const description =
        String(item?.description ?? "").trim().slice(0, 100) || "Expense";
      return { amount, description, category, via: "gemini" as const };
    });
  } catch {
    console.error("gemini: bulk returned non-JSON:", answer.slice(0, 200));
    return none;
  }
}

/**
 * Parses a message that may contain several expenses — split on newlines,
 * semicolons, or commas (commas inside amounts like "1,500" are kept).
 * Returns the expenses found plus how many segments couldn't be read.
 */
export async function parseExpenses(
  text: string
): Promise<{ saved: ParsedExpense[]; skipped: number }> {
  const segments = text
    .split(/[\n;]+|,(?!\d)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const one = await parseExpense(text);
    return { saved: one ? [one] : [], skipped: one ? 0 : 1 };
  }

  const out: (ParsedExpense | null)[] = segments.map(() => null);
  const pending: number[] = [];

  segments.forEach((seg, i) => {
    const extracted = extractAmount(seg);
    const kw = extracted ? keywordCategory(seg) : null;
    if (extracted && kw) {
      out[i] = { ...extracted, category: kw, via: "keyword" };
    } else {
      pending.push(i); // no amount, or no keyword — let Gemini look at it
    }
  });

  if (pending.length > 0) {
    const bulk = await geminiBulk(pending.map((i) => segments[i]));
    pending.forEach((segIdx, j) => {
      if (bulk[j]) {
        out[segIdx] = bulk[j];
      } else {
        // Gemini unavailable/failed: keep segments where the regex at least
        // found an amount, categorised as Other.
        const extracted = extractAmount(segments[segIdx]);
        if (extracted) out[segIdx] = { ...extracted, category: "Other", via: "fallback" };
      }
    });
  }

  const saved = out.filter((p): p is ParsedExpense => p !== null);
  return { saved, skipped: segments.length - saved.length };
}

export async function parseExpense(text: string): Promise<ParsedExpense | null> {
  const extracted = extractAmount(text);

  // Regex found no amount — let Gemini read the whole message.
  if (!extracted) return geminiExtract(text);

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
