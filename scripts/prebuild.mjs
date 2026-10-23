// Runs before `next build`. A PRODUCTION build on Vercel is blocked until scripts/check-launch.mjs
// passes, so placeholder company details, sandbox PayPal or missing email settings can never go live.
// Preview/local builds are never blocked. Emergency override: SKIP_LAUNCH_CHECK=1.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production" && process.env.SKIP_LAUNCH_CHECK !== "1") {
  const r = spawnSync(process.execPath, [new URL("./check-launch.mjs", import.meta.url).pathname], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("\nProduction build blocked. Fix the items above in Vercel > Settings > Environment Variables (Production).");
    process.exit(1);
  }
}
