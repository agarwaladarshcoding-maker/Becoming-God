import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";

/**
 * A cross-process lease over `sync_lock`, keyed by an arbitrary string (e.g.
 * `sync:codeforces:tourist`). Guards the per-process Codeforces/AtCoder
 * throttle: with three local processes (Claude Code, Claude Desktop, the
 * launchd daemon) sharing one cache.db, only the lease holder is allowed to
 * hit upstream for a given handle at a time. Everyone else falls back to
 * cached data instead of racing the rate limit.
 */

/**
 * Claims `key` for `ttlSeconds`. Returns a unique holder token on success,
 * or `null` if another (non-expired) holder already has it.
 *
 * Must be a single atomic statement: two processes doing read-then-write
 * both see "free" and both think they won. The `WHERE expires_at < :now`
 * clause is what lets a stale lease (crashed process, never released) be
 * reclaimed instead of wedging the sync forever.
 */
export function acquireLock(
  db: Database.Database,
  key: string,
  ttlSeconds: number
): string | null {
  // PID alone is not unique across a crash: macOS reuses PIDs, and a reused
  // PID could then be mistaken for the original (dead) holder.
  const holder = `${process.pid}:${randomBytes(8).toString("hex")}`;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttlSeconds;

  const result = db
    .prepare(
      `INSERT INTO sync_lock (key, holder, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET holder = excluded.holder, expires_at = excluded.expires_at
       WHERE sync_lock.expires_at < ?`
    )
    .run(key, holder, expiresAt, now);

  return result.changes === 0 ? null : holder;
}

/**
 * Extends `key`'s lease by `ttlSeconds` from now, but only if `holder` still
 * owns it. A long backfill runs many pages; without periodic refresh the
 * lease would expire mid-sync and let a second process join in.
 */
export function refreshLock(
  db: Database.Database,
  key: string,
  holder: string,
  ttlSeconds: number
): boolean {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const result = db
    .prepare("UPDATE sync_lock SET expires_at = ? WHERE key = ? AND holder = ?")
    .run(expiresAt, key, holder);
  return result.changes > 0;
}

/**
 * Frees `key`, but only if `holder` still owns it. The holder guard matters:
 * without it, a process whose lease already expired and was taken over by
 * someone else would delete the *new* holder's lease on its way out.
 */
export function releaseLock(db: Database.Database, key: string, holder: string): void {
  db.prepare("DELETE FROM sync_lock WHERE key = ? AND holder = ?").run(key, holder);
}
