import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import Dashboard, { type ExpenseRow } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function UserDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ secret: string }>;
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  const { secret } = await params;
  const { m, d } = await searchParams;

  if (!/^[A-Za-z0-9_-]{8,32}$/.test(secret)) notFound();

  const db = sql();
  const users = (await db`
    SELECT id, name FROM users WHERE secret = ${secret}
  `) as { id: number; name: string | null }[];
  if (users.length === 0) notFound();
  const user = users[0];

  const rows = (await db`
    SELECT id, amount, description, category, spent_at
    FROM expenses
    WHERE user_id = ${user.id}
      AND spent_at >= now() - interval '6 months'
    ORDER BY spent_at DESC
    LIMIT 5000
  `) as { id: number; amount: string; description: string; category: string; spent_at: string | Date }[];

  const expenses: ExpenseRow[] = rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    description: r.description,
    category: r.category,
    spent_at: new Date(r.spent_at),
  }));

  return (
    <Dashboard
      name={user.name || "My expenses"}
      expenses={expenses}
      selectedMonth={m}
      selectedDay={d}
      basePath={`/u/${secret}`}
    />
  );
}
