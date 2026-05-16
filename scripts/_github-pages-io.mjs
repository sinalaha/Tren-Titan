import { cpSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Windows often blocks folder `rename` on watched trees (IDE, Defender).
 * Copy+rm is heavier but survives more environments; CI still works.
 */
export function relocate(from, to) {
  if (!existsSync(from)) return false;
  if (existsSync(to)) {
    throw new Error(`Target already exists, refusing to overwrite: ${to}`);
  }
  mkdirSync(dirname(to), { recursive: true });
  try {
    if (statSync(from).isDirectory()) {
      cpSync(from, to, { recursive: true });
      rmSync(from, { recursive: true, force: true });
    } else {
      renameSync(from, to);
    }
  } catch (e) {
    throw new Error(`relocate(${from}, ${to}): ${e instanceof Error ? e.message : String(e)}`);
  }
  return true;
}
