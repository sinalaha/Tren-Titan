/**
 * Reverses github-pages-prepare.mjs — run from repo root after a local static build.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { relocate } from "./_github-pages-io.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const stash = join(root, ".github-pages-stash");

const moves = [
  ["middleware.ts", "src/middleware.ts"],
  ["app-api", "src/app/api"],
  ["app-dashboard", "src/app/dashboard"],
  ["app-settings", "src/app/settings"],
  ["app-admin", "src/app/admin"],
  ["app-onboarding", "src/app/onboarding"],
  ["app-(dashboard)-group", "src/app/(dashboard)"]
];

if (!existsSync(stash)) {
  console.warn("[github-pages-restore] No stash folder; nothing to do.");
  process.exit(0);
}

function ensureParent(absPath) {
  mkdirSync(dirname(absPath), { recursive: true });
}

for (const [stashName, relDest] of moves) {
  const from = join(stash, stashName);
  if (!existsSync(from)) continue;
  const to = join(root, ...relDest.replace(/\\/g, "/").split("/"));
  if (existsSync(to)) {
    throw new Error(`[github-pages-restore] Refusing to overwrite existing: ${relDest}`);
  }
  ensureParent(to);
  relocate(from, to);
  console.warn(`[github-pages-restore] restored ${stashName} -> ${relDest}`);
}

rmSync(stash, { recursive: true, force: true });
console.warn("[github-pages-restore] removed stash directory.");
