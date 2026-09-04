import Link from "next/link";

export default function NotFound() {
  return (
    <main className="lp">
      <div className="lp-wrap">
        <header className="lp-hero">
          <h1>
            Dashboard <em>not found.</em>
          </h1>
          <p className="lp-lead">
            That link doesn&apos;t match any user. Send /dashboard to the
            CashLog bot on Telegram to get your correct private link.
          </p>
          <div className="lp-actions">
            <Link className="m-btn tonal" href="/">
              Go home
            </Link>
          </div>
        </header>
      </div>
    </main>
  );
}
