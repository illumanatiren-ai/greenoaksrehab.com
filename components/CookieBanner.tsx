"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "go_cookie_notice_v1";

// The site itself sets only essential storage (cart contents, this choice). No analytics or ad
// trackers are loaded. PayPal sets its own cookies only on the checkout page. If you later add
// analytics/marketing scripts, load them ONLY when choice === "all".
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  function choose(v: "essential" | "all") {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    setShow(false);
  }
  if (!show) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Cookie notice">
      <p>
        We use only the cookies and browser storage needed to run the site (such as your shopping cart). PayPal may set its own cookies when you check out.
        See our <Link href="/cookies">Cookie Policy</Link>.
      </p>
      <div className="row">
        <button className="btn small" onClick={() => choose("essential")}>Accept essential only</button>
        <button className="btn small ghost" onClick={() => choose("all")}>Accept all</button>
      </div>
    </div>
  );
}
