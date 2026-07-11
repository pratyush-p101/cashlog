import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing">
      <h1>
        Dashboard <span>not found.</span>
      </h1>
      <p className="tag">
        That link doesn&apos;t match any user. Send /dashboard to the Telegram
        bot to get your correct private link.
      </p>
      <Link className="cta ghost" href="/">
        Go home
      </Link>
    </main>
  );
}
