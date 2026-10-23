"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// One visit = unsubscribed. The POST fires automatically when the page opens (no extra clicks,
// no login). The mail-client "Unsubscribe" button uses the List-Unsubscribe-Post header instead.
export default function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<"busy" | "ok" | "err">("busy");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { method: "POST" })
      .then((r) => setState(r.ok ? "ok" : "err"))
      .catch(() => setState("err"));
  }, [token]);

  if (state === "busy") return <p role="status">Unsubscribing you…</p>;
  if (state === "ok") {
    return (
      <div className="msg ok" role="status">
        <strong>You have been unsubscribed.</strong> We will not send you any more marketing emails. (You may still get messages about
        an order you placed.) Changed your mind? You can sign up again any time from the form at the bottom of our <Link href="/">home page</Link>.
      </div>
    );
  }
  return (
    <div className="msg err" role="alert">
      This unsubscribe link is invalid or something went wrong. Please try the link in your email again, or <Link href="/contact">contact us</Link> and we will remove you right away.
    </div>
  );
}
