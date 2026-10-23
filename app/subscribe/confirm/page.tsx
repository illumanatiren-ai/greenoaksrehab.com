import type { Metadata } from "next";
import ConfirmClient from "@/components/ConfirmClient";

export const metadata: Metadata = { title: "Confirm your subscription", robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <section>
      <div className="narrow">
        <h1>Confirm your subscription</h1>
        <ConfirmClient token={token || ""} />
      </div>
    </section>
  );
}
