import type { Metadata } from "next";
import UnsubscribeClient from "@/components/UnsubscribeClient";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <section>
      <div className="narrow">
        <h1>Unsubscribe</h1>
        {t ? <UnsubscribeClient token={t} /> : <div className="msg err">This unsubscribe link is incomplete. Please use the link in your email.</div>}
      </div>
    </section>
  );
}
