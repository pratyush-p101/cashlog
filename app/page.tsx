import Link from "next/link";

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Home() {
  return (
    <main className="landing">
      <h1>
        Track expenses by <span>texting them.</span>
      </h1>
      <p className="tag">
        Message “zomato 110” to a Telegram bot. It categorises and saves it.
        See everything on your private dashboard — no app, no login.
      </p>

      {BOT ? (
        <a className="cta" href={`https://t.me/${BOT}`}>
          Open the bot on Telegram
        </a>
      ) : (
        <span className="cta">Get the bot link from your host</span>
      )}
      <Link className="cta ghost" href="/demo">
        See a demo dashboard
      </Link>

      <div className="how">
        <div className="card">
          <div className="step">
            <span className="n">1</span>
            <span>
              <b>Start the bot</b> on Telegram — it replies with your private
              dashboard link.
            </span>
          </div>
          <div className="step">
            <span className="n">2</span>
            <span>
              <b>Text expenses</b> as they happen: “wifi 600”, “pants 5000”,
              “uber 240”.
            </span>
          </div>
          <div className="step">
            <span className="n">3</span>
            <span>
              <b>Open your link</b> anytime for month-wise and category-wise
              summaries.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
