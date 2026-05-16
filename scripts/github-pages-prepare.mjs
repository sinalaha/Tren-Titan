/**
 * Stashes App Router chunks that Next.js cannot static-export (middleware, API routes,
 * server-heavy pages using auth()/Prisma). Invoked before `NEXT_STATIC_EXPORT=1 next build`.
 * Restore locally with `node scripts/github-pages-restore.mjs` if needed (CI ignores).
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { relocate } from "./_github-pages-io.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const stash = join(root, ".github-pages-stash");

const moves = [
  ["src/middleware.ts", "middleware.ts"],
  ["src/app/api", "app-api"],
  ["src/app/dashboard", "app-dashboard"],
  ["src/app/settings", "app-settings"],
  ["src/app/admin", "app-admin"],
  ["src/app/onboarding", "app-onboarding"],
  ["src/app/(dashboard)", "app-(dashboard)-group"]
];

mkdirSync(stash, { recursive: true });

for (const [relSrc, stashName] of moves) {
  const from = join(root, ...relSrc.replace(/\\/g, "/").split("/"));
  if (!existsSync(from)) continue;
  const to = join(stash, stashName);
  if (existsSync(to)) {
    throw new Error(
      `[github-pages-prepare] Stash target already exists: ${stashName}. Run restore or delete ${stash} first.`
    );
  }
  relocate(from, to);
  console.warn(`[github-pages-prepare] stashed ${relSrc} -> ${stashName}`);
}
