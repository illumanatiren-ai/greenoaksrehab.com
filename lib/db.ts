import { neon, neonConfig } from "@neondatabase/serverless";

let client: unknown = null;

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    // Local development against a plain Postgres through an HTTP proxy (never set on Vercel).
    if (process.env.NEON_LOCAL_HTTP_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_LOCAL_HTTP_ENDPOINT;
    client = neon(process.env.DATABASE_URL);
  }
  return client as (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;
}

/** Tagged-template query helper: await q<Row>`select * from t where id = ${id}` */
export async function q<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return (await getClient()(strings, ...values)) as T[];
}
