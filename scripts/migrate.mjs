// Applies schema.sql to DATABASE_URL. Safe to re-run (every statement is idempotent).
// Usage: npm run db:migrate   (reads .env.local if present)
import { readFileSync } from "node:fs";
import { neon, neonConfig } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
if (process.env.NEON_LOCAL_HTTP_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_LOCAL_HTTP_ENDPOINT;

const sql = neon(url);
const file = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const statements = file
  .replace(/^\s*--.*$/gm, "")
  .split(/;[ \t]*(?:\r?\n|$)/) // one statement per ";" at end of line (schema.sql has no ";" inside statements)
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("ok:", stmt.split("\n")[0].slice(0, 70));
}
console.log(`Applied ${statements.length} statements.`);
