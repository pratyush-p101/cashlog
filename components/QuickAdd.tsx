"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuickAdd({ secret }: { secret: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/quick/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      setNote({ ok: Boolean(data?.ok), msg: String(data?.message ?? "") });
      if (data?.ok) {
        setText("");
        router.refresh(); // pull the new expense into the dashboard
      }
    } catch {
      setNote({ ok: false, msg: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="quick" onSubmit={submit}>
      <input
        className="quick-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add an expense — e.g. zomato 110"
        aria-label="Add an expense"
        enterKeyHint="done"
        disabled={busy}
      />
      <button className="quick-btn" type="submit" disabled={busy || !text.trim()}>
        {busy ? "Saving…" : "Add"}
      </button>
      {note && (
        <div className={`quick-note ${note.ok ? "ok" : "err"}`} role="status">
          {note.msg}
        </div>
      )}
    </form>
  );
}
