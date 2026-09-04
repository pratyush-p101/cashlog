import Link from "next/link";

const BOT =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "cashlog_tracker_bot";
const BOT_URL = `https://t.me/${BOT}`;

const FEATURES = [
  {
    icon: "💬",
    title: "Type it like you'd say it",
    body: "“zomato 110”, “wifi 600”, even “buy book for 100rs”. No forms, no dropdowns, no amount field.",
  },
  {
    icon: "🤖",
    title: "Categorises itself",
    body: "Food, Travel, Rent, Groceries, Bills and more — sorted automatically using AI, so you never pick a category.",
  },
  {
    icon: "📝",
    title: "Many at once",
    body: "Back from a day out? Send every expense in one message, one per line, and each is saved separately.",
  },
  {
    icon: "📅",
    title: "Month-wise summary",
    body: "Your last 6 months side by side. Tap any month to see exactly where that month's money went.",
  },
  {
    icon: "🏷️",
    title: "Category-wise breakdown",
    body: "See what share went to food, rent or travel — then tap a category to list just those expenses.",
  },
  {
    icon: "🔍",
    title: "Day-level detail",
    body: "Tap any day to see that day's total and split. Perfect for “where did Saturday go?”",
  },
  {
    icon: "📈",
    title: "Numbers that matter",
    body: "Daily average, biggest spend, top category, and whether you're up or down versus last month.",
  },
  {
    icon: "⚡",
    title: "Add from your home screen",
    body: "Set up an iPhone Back Tap or Android shortcut and log an expense in three seconds, without opening any app.",
  },
];

export default function Home() {
  return (
    <main className="lp">
      <div className="lp-wrap">
        <nav className="lp-nav">
          <div className="lp-brand">
            Cash<span>Log</span>
          </div>
          <Link href="/demo">View demo →</Link>
        </nav>

        <header className="lp-hero">
          <span className="lp-pill">Free · No login · No app to install</span>
          <h1>
            Track expenses by <em>texting them.</em>
          </h1>
          <p className="lp-lead">
            Message what you spent to a Telegram bot — “zomato 110” — and it's
            saved and categorised instantly. Open your own private link anytime
            to see where your money actually goes.
          </p>
          <div className="lp-actions">
            <a className="m-btn filled" href={BOT_URL}>
              Start on Telegram
            </a>
            <Link className="m-btn tonal" href="/demo">
              See a live dashboard
            </Link>
          </div>
          <p className="lp-fine">
            Built for Indian households · Works on any phone with Telegram
          </p>
        </header>

        <section className="lp-section">
          <div className="lp-h2">How it works</div>
          <div className="lp-sub">Three steps, then you're done forever</div>
          <div className="lp-steps">
            <div className="m-card lp-step">
              <div className="s-num">1</div>
              <h3>Start the bot</h3>
              <p>
                Tap start on Telegram. You instantly get a private dashboard
                link — no signup, no password, no email.
              </p>
            </div>
            <div className="m-card lp-step">
              <div className="s-num">2</div>
              <h3>Text your expenses</h3>
              <p>
                Whenever you spend, send a quick message. Takes about three
                seconds, right where you're already chatting.
              </p>
            </div>
            <div className="m-card lp-step">
              <div className="s-num">3</div>
              <h3>Open your dashboard</h3>
              <p>
                Month-wise totals, category breakdowns and daily detail — all
                building themselves in the background.
              </p>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-h2">In the chat</div>
          <div className="lp-sub">This is the whole experience</div>
          <div className="lp-chat">
            <div className="bubble me">zomato 110</div>
            <div className="bubble bot">✅ Saved ₹110 · 🍔 Food</div>
            <div className="bubble me">buy book for 100rs</div>
            <div className="bubble bot">✅ Saved ₹100 · 📚 Education</div>
            <div className="bubble me">
              {"chai 20\nauto 60\ngroceries 450"}
            </div>
            <div className="bubble bot">
              {
                "✅ Saved 3 expenses · ₹530 total\n\n🍔 chai · ₹20\n🚕 auto · ₹60\n🛒 groceries · ₹450"
              }
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-h2">What you can do</div>
          <div className="lp-sub">Everything, without leaving Telegram</div>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <div className="m-card lp-feature" key={f.title}>
                <div className="f-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-h2">Commands</div>
          <div className="lp-sub">Four things worth remembering</div>
          <div className="m-card lp-cmds">
            <div className="lp-cmd">
              <code>/dashboard</code>
              <span>Get your private dashboard link again</span>
            </div>
            <div className="lp-cmd">
              <code>/delete</code>
              <span>Removed the wrong thing? Deletes your last entry</span>
            </div>
            <div className="lp-cmd">
              <code>/clear</code>
              <span>
                Wipe everything and start fresh — asks you to confirm first
              </span>
            </div>
            <div className="lp-cmd">
              <code>/help</code>
              <span>See examples and the command list anytime</span>
            </div>
          </div>
        </section>

        <section className="lp-final">
          <h2>Start tracking in 30 seconds</h2>
          <p>
            No account to create, nothing to download. Send one message and your
            dashboard is live.
          </p>
          <a className="m-btn filled" href={BOT_URL}>
            Open CashLog on Telegram
          </a>
        </section>

        <p className="lp-foot">
          Your dashboard link is private — only people you share it with can see
          it.
        </p>
      </div>
    </main>
  );
}
