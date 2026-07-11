import Dashboard, { type ExpenseRow } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

// A no-database demo dashboard so visitors (and you, locally) can see what
// a user's page looks like before connecting Telegram.
function sample(): ExpenseRow[] {
  const now = new Date();
  const daysAgo = (n: number, h = 13) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(h, 24, 0, 0);
    return d;
  };
  const data: [number, string, string, Date][] = [
    [110, "zomato", "Food", daysAgo(0, 13)],
    [45, "chai", "Food", daysAgo(0, 10)],
    [600, "wifi", "Bills & Utilities", daysAgo(1)],
    [240, "uber", "Travel", daysAgo(1, 19)],
    [850, "blinkit", "Groceries", daysAgo(2)],
    [5000, "pants", "Shopping", daysAgo(3)],
    [199, "spotify", "Entertainment", daysAgo(4)],
    [320, "medicines", "Health", daysAgo(5)],
    [1200, "electricity bill", "Bills & Utilities", daysAgo(6)],
    [430, "swiggy", "Food", daysAgo(7)],
    [15000, "rent", "Rent", daysAgo(8)],
    [90, "auto", "Travel", daysAgo(9)],
    [1450, "bigbasket", "Groceries", daysAgo(10)],
    [260, "movie", "Entertainment", daysAgo(12)],
    [150, "haircut", "Personal Care", daysAgo(13)],
    // previous months, for the month-wise bars
    [15000, "rent", "Rent", daysAgo(38)],
    [5400, "groceries", "Groceries", daysAgo(41)],
    [2300, "amazon", "Shopping", daysAgo(45)],
    [1800, "dinner outing", "Food", daysAgo(49)],
    [15000, "rent", "Rent", daysAgo(68)],
    [4100, "groceries", "Groceries", daysAgo(72)],
    [900, "petrol", "Travel", daysAgo(75)],
    [15000, "rent", "Rent", daysAgo(99)],
    [6200, "diwali shopping", "Shopping", daysAgo(102)],
    [3300, "groceries", "Groceries", daysAgo(104)],
    [15000, "rent", "Rent", daysAgo(129)],
    [2100, "groceries", "Groceries", daysAgo(133)],
  ];
  return data.map(([amount, description, category, spent_at], i) => ({
    id: i + 1,
    amount,
    description,
    category,
    spent_at,
  }));
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  const { m, d } = await searchParams;
  return (
    <Dashboard
      name="Demo user"
      expenses={sample()}
      selectedMonth={m}
      selectedDay={d}
      basePath="/demo"
    />
  );
}
