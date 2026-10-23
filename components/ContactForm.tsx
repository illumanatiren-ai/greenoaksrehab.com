"use client";
import { useState } from "react";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; text?: string }>({ kind: "idle" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState({ kind: "ok", text: "Thank you — your message was sent. We will reply as soon as we can." });
        setF({ name: "", email: "", phone: "", message: "", website: "" });
      } else setState({ kind: "err", text: data.message || "Could not send your message." });
    } catch {
      setState({ kind: "err", text: "Network error. Please try again or call us." });
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="c-name">Your name</label>
      <input id="c-name" type="text" autoComplete="name" required value={f.name} onChange={set("name")} />
      <label htmlFor="c-email">Email</label>
      <input id="c-email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} />
      <label htmlFor="c-phone">Phone (optional)</label>
      <input id="c-phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
      <div className="hp" aria-hidden="true">
        <label htmlFor="c-web">Website</label>
        <input id="c-web" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
      </div>
      <label htmlFor="c-msg">How can we help?</label>
      <textarea id="c-msg" required value={f.message} onChange={set("message")} />
      <p className="muted" style={{ fontSize: ".88rem" }}>
        Please do not include detailed medical information in this form. Submitting it does not subscribe you to our newsletter.
      </p>
      <button className="btn" type="submit" disabled={state.kind === "busy"}>
        {state.kind === "busy" ? "Sending…" : "Send message"}
      </button>
      <div role="status" aria-live="polite">
        {state.kind === "ok" && <div className="msg ok">{state.text}</div>}
        {state.kind === "err" && <div className="msg err">{state.text}</div>}
      </div>
    </form>
  );
}
