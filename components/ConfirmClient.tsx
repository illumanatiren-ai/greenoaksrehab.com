"use client";
import Link from "next/link";
import { useState } from "react";

// Confirmation needs a deliberate click (POST), so email scanners that merely open the link
// cannot subscribe anyone.
export default function ConfirmClient({ token }: { token: string }) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; text?: string }>({ kind: "idle" });

  async function confirm() {
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setState({ kind: "ok" });
      else setState({ kind: "err", text: data.message || "This link is invalid or has expired." });
    } catch {
      setState({ kind: "err", text: "Network error. Please try again." });
    }
  }

  if (state.kind === "ok") {
    return (
      <div className="msg ok" role="status">
        <strong>You're subscribed.</strong> Thank you! A welcome email is on its way. Every email we send includes an unsubscribe link.
        <p><Link href="/">Back to home</Link></p>
      </div>
    );
  }
  return (
    <div>
      <p>Click the button to confirm that you want to receive emails from us at the address you signed up with.</p>
      <button className="btn" onClick={confirm} disabled={state.kind === "busy" || !token}>
        {state.kind === "busy" ? "Confirming…" : "Confirm my subscription"}
      </button>
      <div role="status" aria-live="polite">{state.kind === "err" && <div className="msg err">{state.text}</div>}</div>
    </div>
  );
}
