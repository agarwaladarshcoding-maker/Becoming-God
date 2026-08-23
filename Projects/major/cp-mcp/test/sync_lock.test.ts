import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import Database from "better-sqlite3";
import { initDb } from "../src/cache/db.js";
import { acquireLock, refreshLock, releaseLock } from "../src/cache/lock.js";

// An in-memory DB can't demonstrate cross-connection behaviour — the whole
// point of the lease. Use two independent connections over one shared file
// on disk instead, the way three real cp-mcp processes would.
let dbPath: string;
let dbA: Database.Database;
let dbB: Database.Database;

function freshConnections() {
  dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "cp-mcp-lock-test-")),
    "cache.db"
  );
  dbA = initDb(dbPath);
  dbB = initDb(dbPath);
}

function cleanup() {
  dbA?.close();
  dbB?.close();
  if (dbPath) {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
}

afterEach(() => {
  cleanup();
});

describe("sync_lock cross-process lease", () => {
  it("acquireLock on a free key succeeds and returns a holder token", () => {
    freshConnections();
    const holder = acquireLock(dbA, "sync:codeforces:tourist", 90);
    expect(holder).not.toBeNull();
    expect(typeof holder).toBe("string");
  });

  it("a second acquireLock on the same key from a different connection fails", () => {
    freshConnections();
    const holderA = acquireLock(dbA, "sync:codeforces:tourist", 90);
    expect(holderA).not.toBeNull();

    const holderB = acquireLock(dbB, "sync:codeforces:tourist", 90);
    expect(holderB).toBeNull();
  });

  it("an expired lease is reclaimable by another connection", () => {
    freshConnections();
    // 0s TTL: expires_at is now, so it is already "in the past" by the time
    // the next acquire runs its `expires_at < now` check.
    const holderA = acquireLock(dbA, "sync:codeforces:tourist", -1);
    expect(holderA).not.toBeNull();

    const holderB = acquireLock(dbB, "sync:codeforces:tourist", 90);
    expect(holderB).not.toBeNull();
    expect(holderB).not.toBe(holderA);
  });

  it("releaseLock with the correct holder frees the key for the next acquirer", () => {
    freshConnections();
    const holderA = acquireLock(dbA, "sync:codeforces:tourist", 90);
    expect(holderA).not.toBeNull();

    releaseLock(dbA, "sync:codeforces:tourist", holderA as string);

    const holderB = acquireLock(dbB, "sync:codeforces:tourist", 90);
    expect(holderB).not.toBeNull();
  });

  it("releaseLock with a stale/wrong holder does not free the key", () => {
    freshConnections();
    const holderA = acquireLock(dbA, "sync:codeforces:tourist", 90);
    expect(holderA).not.toBeNull();

    releaseLock(dbB, "sync:codeforces:tourist", "not-the-real-holder");

    // Still held by A: a fresh attempt from B still fails.
    const holderB = acquireLock(dbB, "sync:codeforces:tourist", 90);
    expect(holderB).toBeNull();
  });

  it("refreshLock returns true for the holder and false for a non-holder", () => {
    freshConnections();
    const holderA = acquireLock(dbA, "sync:codeforces:tourist", 90);
    expect(holderA).not.toBeNull();

    expect(refreshLock(dbA, "sync:codeforces:tourist", holderA as string, 90)).toBe(true);
    expect(refreshLock(dbB, "sync:codeforces:tourist", "not-the-real-holder", 90)).toBe(false);
  });
});
