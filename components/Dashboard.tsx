import Link from "next/link";
import { CATEGORY_EMOJI, type Category } from "@/lib/categories";
import {
  dayKey,
  dayLabelFromKey,
  formatINR,
  lastMonthKeys,
  monthKey,
  monthLabel,
} from "@/lib/format";

export interface ExpenseRow {
  id: number;
  amount: number;
  description: string;
  category: string;
  spent_at: Date;
}

function emoji(category: string): string {
  return CATEGORY_EMOJI[category as Category] ?? "📦";
}

export default function Dashboard({
  name,
  expenses,
  selectedMonth,
  selectedDay,
  basePath,
}: {
  name: string;
  expenses: ExpenseRow[];
  selectedMonth?: string;
  selectedDay?: string;
  basePath: string;
}) {
  const monthKeys = lastMonthKeys(6);
  // A selected day ("?d=2026-07-08") wins and pins its own month.
  const day =
    selectedDay && /^\d{4}-\d{2}-\d{2}$/.test(selectedDay)
      ? selectedDay
      : undefined;
  const selected = day
    ? day.slice(0, 7)
    : selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)
      ? selectedMonth
      : monthKeys[monthKeys.length - 1];

  // Month-wise totals across the last 6 months.
  const monthTotals = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const e of expenses) {
    const k = monthKey(e.spent_at);
    if (monthTotals.has(k)) monthTotals.set(k, monthTotals.get(k)! + e.amount);
  }
  const maxMonth = Math.max(1, ...monthTotals.values());

  // Selected month's expenses, newest first.
  const inMonth = expenses
    .filter((e) => monthKey(e.spent_at) === selected)
    .sort((a, b) => b.spent_at.getTime() - a.spent_at.getTime());
  const monthTotal = inMonth.reduce((s, e) => s + e.amount, 0);

  // When a day is selected, categories and transactions scope to that day.
  const inDay = day ? inMonth.filter((e) => dayKey(e.spent_at) === day) : null;
  const scoped = inDay ?? inMonth;
  const scopedTotal = inDay
    ? inDay.reduce((s, e) => s + e.amount, 0)
    : monthTotal;
  const scopeLabel = day ? dayLabelFromKey(day) : monthLabel(selected);

  // Category breakdown for the selected month or day.
  const byCategory = new Map<string, number>();
  for (const e of scoped) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...byCategory.values());

  // Transactions grouped by day (capped to keep the page light).
  const shown = scoped.slice(0, 100);
  const days: { key: string; total: number; items: ExpenseRow[] }[] = [];
  for (const e of shown) {
    const k = dayKey(e.spent_at);
    const last = days[days.length - 1];
    if (last && last.key === k) {
      last.items.push(e);
      last.total += e.amount;
    } else {
      days.push({ key: k, total: e.amount, items: [e] });
    }
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div className="wordmark">
          Cash<span>Log</span>
        </div>
        <div className="who">{name}</div>
      </div>

      <section className="card">
        <div className="hero-label">Spent in {monthLabel(selected)}</div>
        <div className="hero-amount">{formatINR(monthTotal)}</div>
        <div className="hero-sub">
          {inMonth.length === 0
            ? "No expenses logged"
            : `${inMonth.length} ${inMonth.length === 1 ? "entry" : "entries"} · avg ${formatINR(Math.round(monthTotal / inMonth.length))} each`}
        </div>
        {day && (
          <div className="day-banner">
            <span>
              {scopeLabel}: <b>{formatINR(scopedTotal)}</b> · {scoped.length}{" "}
              {scoped.length === 1 ? "entry" : "entries"}
            </span>
            <Link href={`${basePath}?m=${selected}`} className="day-clear">
              Show full month
            </Link>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Month-wise summary</h2>
        <div className="months">
          {monthKeys.map((k) => {
            const total = monthTotals.get(k)!;
            const h = Math.round((total / maxMonth) * 100);
            return (
              <Link
                key={k}
                href={`${basePath}?m=${k}`}
                className={`month-col${k === selected ? " selected" : ""}`}
                aria-current={k === selected ? "true" : undefined}
              >
                <span className="m-val">
                  {total > 0 ? formatINR(Math.round(total)) : "–"}
                </span>
                <span className="m-track">
                  <span className="m-bar" style={{ height: `${h}%` }} />
                </span>
                <span className="m-name">{monthLabel(k).split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Category-wise summary · {scopeLabel}</h2>
        {categories.length === 0 ? (
          <div className="empty">
            Nothing here yet for this {day ? "day" : "month"}.
          </div>
        ) : (
          categories.map(([cat, amt]) => (
            <div className="cat-row" key={cat}>
              <span className="cat-emoji">{emoji(cat)}</span>
              <span className="cat-name">{cat}</span>
              <span className="cat-amt">{formatINR(amt)}</span>
              <span className="cat-meta">
                <span className="cat-track">
                  <span
                    className="cat-fill"
                    style={{ width: `${Math.max(2, (amt / maxCat) * 100)}%` }}
                  />
                </span>
                <span className="cat-pct">
                  {Math.round((amt / scopedTotal) * 100)}%
                </span>
              </span>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Transactions · {scopeLabel}</h2>
        {days.length === 0 ? (
          <div className="empty">
            Message your bot something like <b>“zomato 110”</b> to get started.
          </div>
        ) : (
          days.map((group) => (
            <div key={group.key}>
              <Link
                className={`day-head${day === group.key ? " active" : ""}`}
                href={
                  day === group.key
                    ? `${basePath}?m=${selected}`
                    : `${basePath}?d=${group.key}`
                }
                title={
                  day === group.key
                    ? "Back to the full month"
                    : "View only this day"
                }
              >
                <span>{dayLabelFromKey(group.key)}</span>
                <span className="day-total">{formatINR(group.total)}</span>
              </Link>
              {group.items.map((e) => (
                <div className="txn" key={e.id}>
                  <span className="txn-emoji">{emoji(e.category)}</span>
                  <span className="txn-main">
                    <span className="txn-desc">{e.description}</span>
                    <span className="txn-cat"> · {e.category}</span>
                  </span>
                  <span className="txn-amt">{formatINR(e.amount)}</span>
                </div>
              ))}
            </div>
          ))
        )}
        {scoped.length > shown.length && (
          <div className="foot">Showing latest {shown.length} entries</div>
        )}
      </section>

      <div className="foot">
        CashLog · add expenses by messaging your Telegram bot
      </div>
    </main>
  );
}
