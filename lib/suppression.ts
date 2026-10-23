import { q } from "./db";

export type SuppressionReason = "bounce" | "complaint" | "unsubscribe" | "manual";

export async function getSuppression(email: string): Promise<SuppressionReason | null> {
  const rows = await q<{ reason: SuppressionReason }>`select reason from suppression where email = ${email.toLowerCase()}`;
  return rows[0]?.reason ?? null;
}

/**
 * Hard blocks (bounce / complaint / manual) stop ALL email, including receipts.
 * An 'unsubscribe' entry only stops marketing email.
 */
export async function isBlocked(email: string, transactional: boolean): Promise<boolean> {
  const reason = await getSuppression(email);
  if (!reason) return false;
  if (reason === "unsubscribe") return !transactional;
  return true;
}

export async function addSuppression(email: string, reason: SuppressionReason, detail?: string) {
  const e = email.toLowerCase();
  // A bounce/complaint outranks an earlier plain unsubscribe; never downgrade.
  await q`
    insert into suppression (email, reason, detail) values (${e}, ${reason}, ${detail ?? null})
    on conflict (email) do update set reason = excluded.reason, detail = excluded.detail
    where suppression.reason = 'unsubscribe' and excluded.reason <> 'unsubscribe'`;
  const status = reason === "unsubscribe" ? "unsubscribed" : "suppressed";
  await q`
    update subscribers
       set status = ${status},
           unsubscribed_at = case when ${reason} = 'unsubscribe' then now() else unsubscribed_at end,
           confirm_token = null,
           updated_at = now()
     where email = ${e}`;
}

export async function logEmailEvent(eventType: string, email: string | null, detail: string | null, raw: unknown) {
  await q`insert into email_events (event_type, email, detail, raw) values (${eventType}, ${email}, ${detail}, ${JSON.stringify(raw)}::jsonb)`;
}
