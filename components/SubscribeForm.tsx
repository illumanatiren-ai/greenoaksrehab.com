"use client";
import { useState } from "react";

export default function SubscribeForm({ consent, source = "website", idPrefix = "sub" }: { consent: string; source?: string; idPrefix?: string }) {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; text?: string }>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: agree, website, source }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState({ kind: "ok", text: data.message });
        setEmail("");
        setAgree(false);
      } else setState({ kind: "err", text: data.message || "Could not subscribe." });
    } catch {
      setState({ kind: "err", text: "Network error. Please try again." });
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`${idPrefix}-email`}>Email address</label>
      <input id={`${idPrefix}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <div className="hp" aria-hidden="true">
        <label htmlFor={`${idPrefix}-web`}>Website</label>
        <input id={`${idPrefix}-web`} type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <label className="check" htmlFor={`${idPrefix}-consent`}>
        <input id={`${idPrefix}-consent`} type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
        <span>{consent}</span>
      </label>
      <button className="btn" type="submit" disabled={state.kind === "busy"}>
        {state.kind === "busy" ? "Sending…" : "Subscribe"}
      </button>
      <div role="status" aria-live="polite">
        {state.kind === "ok" && <div className="msg ok">{state.text}</div>}
        {state.kind === "err" && <div className="msg err">{state.text}</div>}
      </div>
    </form>
  );
}
