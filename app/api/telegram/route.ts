import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { parseExpense } from "@/lib/parse";
import { sendMessage } from "@/lib/telegram";
import { CATEGORY_EMOJI } from "@/lib/categories";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface DbUser {
  id: number;
  secret: string;
}

function appUrl(): string {
  return (process.env.APP_URL || "").replace(/\/$/, "");
}

function dashboardUrl(secret: string): string {
  return `${appUrl()}/u/${secret}`;
}

async function ensureUser(telegramId: number, name: string): Promise<DbUser> {
  const db = sql();
  const secret = randomBytes(9).toString("base64url"); // 12-char URL-safe id
  const rows = (await db`
    INSERT INTO users (telegram_id, secret, name)
    VALUES (${telegramId}, ${secret}, ${name})
    ON CONFLICT (telegram_id)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id, secret
  `) as DbUser[];
  return rows[0];
}

const HELP = [
  "Just message an expense and I'll save it. Examples:",
  "",
  "<code>zomato 110</code>",
  "<code>pants 5000</code>",
  "<code>wifi - 600</code>",
  "",
  "Commands:",
  "/dashboard — your private dashboard link",
  "/undo — delete the last entry",
  "/help — this message",
].join("\n");

export async function POST(req: NextRequest) {
  // Reject calls that don't carry the secret we registered with Telegram.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    expected &&
    req.headers.get("x-telegram-bot-api-secret-token") !== expected
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const msg = update?.message;
  const text: string | undefined = msg?.text;
  const chatId: number | undefined = msg?.chat?.id;
  const from = msg?.from;

  // Ignore non-text updates (stickers, joins, edits…). Always return 200 so
  // Telegram doesn't retry them forever.
  if (!text || !chatId || !from || from.is_bot) {
    return NextResponse.json({ ok: true });
  }

  const name = [from.first_name, from.last_name].filter(Boolean).join(" ");

  try {
    const user = await ensureUser(from.id, name);
    const db = sql();
    const command = text.trim().split(/\s|@/)[0].toLowerCase();

    if (command === "/start") {
      await sendMessage(
        chatId,
        `Hi ${from.first_name || "there"} 👋 I'm <b>CashLog</b>.\n\n` +
          `${HELP}\n\n` +
          `📊 Your private dashboard:\n${dashboardUrl(user.secret)}\n\n` +
          `Keep that link to yourself — anyone with it can see your expenses.`
      );
    } else if (command === "/dashboard" || command === "/link") {
      await sendMessage(chatId, `📊 ${dashboardUrl(user.secret)}`);
    } else if (command === "/help") {
      await sendMessage(chatId, HELP);
    } else if (command === "/undo") {
      const deleted = (await db`
        DELETE FROM expenses
        WHERE id = (
          SELECT id FROM expenses
          WHERE user_id = ${user.id}
          ORDER BY spent_at DESC, id DESC
          LIMIT 1
        )
        RETURNING description, amount
      `) as { description: string; amount: string }[];
      if (deleted.length > 0) {
        await sendMessage(
          chatId,
          `🗑 Deleted: ${deleted[0].description} · ${formatINR(
            Number(deleted[0].amount)
          )}`
        );
      } else {
        await sendMessage(chatId, "Nothing to undo — no expenses yet.");
      }
    } else {
      const parsed = await parseExpense(text);
      if (!parsed) {
        await sendMessage(
          chatId,
          `I couldn't find an amount in that. Try like:\n<code>zomato 110</code>`
        );
      } else {
        await db`
          INSERT INTO expenses (user_id, amount, description, category)
          VALUES (${user.id}, ${parsed.amount}, ${parsed.description}, ${parsed.category})
        `;
        await sendMessage(
          chatId,
          `✅ Saved ${formatINR(parsed.amount)} · ${
            CATEGORY_EMOJI[parsed.category]
          } ${parsed.category}\n📊 ${dashboardUrl(user.secret)}`
        );
      }
    }
  } catch (err) {
    console.error("webhook error:", err);
    // Still 200: a 5xx makes Telegram redeliver the same update repeatedly.
  }

  return NextResponse.json({ ok: true });
}
