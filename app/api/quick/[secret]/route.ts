import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { parseExpenses } from "@/lib/parse";
import { CATEGORY_EMOJI } from "@/lib/categories";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Quick-add endpoint used by the dashboard's add box and by phone shortcuts
 * (iPhone Back Tap → Shortcuts, Android home-screen shortcuts).
 *
 *   POST /api/quick/<secret>
 *   body: {"text": "zomato 110"}   — JSON, form-encoded, or raw text
 *
 * The dashboard secret doubles as the key, matching the app's no-login design.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(secret)) {
    return NextResponse.json(
      { ok: false, message: "Invalid link." },
      { status: 404 }
    );
  }

  // Accept JSON, form posts, or a raw text body — shortcut apps vary.
  let text = "";
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = String(body?.text ?? "");
    } else if (
      contentType.includes("form-data") ||
      contentType.includes("x-www-form-urlencoded")
    ) {
      const form = await req.formData();
      text = String(form.get("text") ?? "");
    } else {
      text = await req.text();
    }
  } catch {
    text = "";
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json(
      { ok: false, message: "Type an expense, like “zomato 110”." },
      { status: 400 }
    );
  }

  try {
    const db = sql();
    const users = (await db`
      SELECT id FROM users WHERE secret = ${secret}
    `) as { id: number }[];
    if (users.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Unknown link. Send /dashboard to the bot." },
        { status: 404 }
      );
    }

    const { saved, skipped } = await parseExpenses(text);
    if (saved.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Couldn't find an amount. Try “zomato 110”.",
        },
        { status: 422 }
      );
    }

    for (const p of saved) {
      console.log(
        `quick-add "${p.description}" -> ${p.category} (via ${p.via})`
      );
      await db`
        INSERT INTO expenses (user_id, amount, description, category)
        VALUES (${users[0].id}, ${p.amount}, ${p.description}, ${p.category})
      `;
    }

    const total = saved.reduce((s, p) => s + p.amount, 0);
    const message =
      saved.length === 1
        ? `✅ ${formatINR(saved[0].amount)} · ${
            CATEGORY_EMOJI[saved[0].category]
          } ${saved[0].category}`
        : `✅ Saved ${saved.length} expenses · ${formatINR(total)} total`;

    return NextResponse.json({
      ok: true,
      message,
      skipped,
      saved: saved.map((p) => ({
        amount: p.amount,
        description: p.description,
        category: p.category,
      })),
    });
  } catch (err) {
    console.error("quick-add error:", err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
