"use client";

import { useEffect, useState } from "react";

/**
 * Turns a pasted dashboard link into the user's personal quick-add URL and
 * lets them copy it, so nobody has to retype a 12-character secret by hand.
 */
export default function ShortcutSetup({
  shortcutUrl,
}: {
  shortcutUrl?: string;
}) {
  const [origin, setOrigin] = useState("https://cashlog.online");
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const input = raw.trim();
  const fromLink = input.match(/\/u\/([A-Za-z0-9_-]{8,32})/);
  const bare = /^[A-Za-z0-9_-]{8,32}$/.test(input) ? input : null;
  const secret = fromLink ? fromLink[1] : bare;
  const url = `${origin}/api/quick/${secret ?? "YOUR_SECRET"}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="m-card sc-card">
      <div className="sc-step-head">
        <span className="s-num">1</span>
        <h3>Get your personal link</h3>
      </div>
      <p className="sc-p">
        Send <b>/dashboard</b> to the bot on Telegram, then paste the link it
        gives you here. Nothing is sent anywhere — this runs in your browser.
      </p>

      <input
        className="sc-input"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste your dashboard link…"
        aria-label="Your dashboard link"
        spellCheck={false}
      />

      <div className={`sc-out ${secret ? "ready" : ""}`}>
        <code>{url}</code>
        <button className="sc-copy" onClick={copy} disabled={!secret}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {!secret && input.length > 0 && (
        <p className="sc-warn">
          That doesn&apos;t look like a dashboard link. It should look like
          cashlog.online/u/xxxxxxxxxxx
        </p>
      )}

      {shortcutUrl && (
        <div className="sc-oneTap">
          <p className="sc-p">
            <b>On an iPhone?</b> Tap below to add the ready-made shortcut, then
            open it once and paste the link above into its{" "}
            <b>Get Contents of URL</b> step, replacing <code>YOUR_SECRET</code>.
          </p>
          <a className="m-btn filled" href={shortcutUrl}>
            Add the shortcut to my iPhone
          </a>
        </div>
      )}
    </div>
  );
}
