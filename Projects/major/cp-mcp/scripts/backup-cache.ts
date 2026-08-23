// Online backup + WAL checkpoint for the cache database.
//
// This file is the one piece of irreplaceable state in the project. The
// problem catalogues can be re-downloaded in minutes; the submission history
// behind "machine-verified solve status" is the product. It has been lost
// once already, by deleting an uncheckpointed WAL — which is exactly why this
// script only ever COPIES, and why nothing here removes cache.db, cache.db-wal
// or cache.db-shm under any circumstances.
//
// Uses better-sqlite3's db.backup(), which is SQLite's online backup API: it
// produces a consistent snapshot of a database that other processes may be
// writing to. A plain `cp` of cache.db would not — it would miss whatever is
// still sitting in the WAL.

import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getDbPath } from "../src/cache/db.js";

const KEEP = 7;

export function backupDir(): string {
  return path.join(os.homedir(), ".cp-mcp", "backups");
}

export function backupName(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `cache-${String(now.getFullYear())}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}.db`;
}

/**
 * Delete all but the newest `keep` backups. Operates ONLY on files matching
 * the generated backup name pattern inside the backups directory — never on
 * the live database, and never on anything it did not create.
 */
export function pruneBackups(dir: string, keep: number): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs
    .readdirSync(dir)
    .filter((f) => /^cache-\d{8}-\d{4}\.db$/.test(f))
    .sort()
    .reverse();
  const doomed = entries.slice(keep);
  for (const f of doomed) fs.rmSync(path.join(dir, f));
  return doomed;
}

export async function run(): Promise<void> {
  const source = getDbPath();
  if (source === ":memory:") {
    throw new Error("refusing to back up an in-memory database (NODE_ENV=test?)");
  }
  if (!fs.existsSync(source)) {
    throw new Error(`no cache database at ${source} — nothing to back up`);
  }

  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, backupName(new Date()));

  const db = new Database(source);
  try {
    await db.backup(target);

    // TRUNCATE (not PASSIVE) so the WAL is actually emptied and shrunk on
    // disk. An 11 MB WAL that nothing ever checkpoints is durable enough for
    // SQLite but needlessly fragile for a file this valuable: every byte
    // still in the WAL is a byte that a careless `rm cache.db-wal` destroys.
    // Ordered AFTER the backup so the snapshot is taken from a state that
    // definitely includes everything.
    const result = db.pragma("wal_checkpoint(TRUNCATE)");
    console.error(`checkpoint: ${JSON.stringify(result)}`);
  } finally {
    db.close();
  }

  const size = fs.statSync(target).size;
  const verify = new Database(target, { readonly: true });
  const counts = {
    submissions: (verify.prepare("SELECT count(*) c FROM submissions").get() as { c: number }).c,
    problems: (verify.prepare("SELECT count(*) c FROM problems").get() as { c: number }).c,
  };
  verify.close();

  const pruned = pruneBackups(dir, KEEP);

  console.error(`backup:  ${target} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  console.error(`content: ${String(counts.submissions)} submissions, ${String(counts.problems)} problems`);
  if (pruned.length > 0) console.error(`pruned:  ${pruned.join(", ")}`);
  console.error(`source:  ${source} (untouched)`);
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  run().catch((err: unknown) => {
    console.error(`backup failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
