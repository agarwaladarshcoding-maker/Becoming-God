import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { backupName, pruneBackups } from "../scripts/backup-cache.js";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cp-mcp-backup-test-"));
}

describe("backup-cache", () => {
  it("names backups so a lexical sort is a chronological sort", () => {
    const early = backupName(new Date(2026, 0, 5, 4, 7));
    const later = backupName(new Date(2026, 10, 20, 23, 59));
    expect(early).toBe("cache-20260105-0407.db");
    expect(later).toBe("cache-20261120-2359.db");
    // pruneBackups relies on this: it sorts by name to find the newest.
    expect([later, early].sort()).toEqual([early, later]);
  });

  it("keeps the newest N and deletes only older backups", () => {
    const dir = tmpDir();
    const names = [
      "cache-20260101-0000.db",
      "cache-20260102-0000.db",
      "cache-20260103-0000.db",
      "cache-20260104-0000.db",
    ];
    for (const n of names) fs.writeFileSync(path.join(dir, n), "x");

    const pruned = pruneBackups(dir, 2);

    expect(pruned.sort()).toEqual(["cache-20260101-0000.db", "cache-20260102-0000.db"]);
    expect(fs.readdirSync(dir).sort()).toEqual([
      "cache-20260103-0000.db",
      "cache-20260104-0000.db",
    ]);
  });

  it("never touches files it did not create", () => {
    const dir = tmpDir();
    // The live database has been destroyed once by careless deletion. Prune
    // must only ever match its own generated name pattern.
    const bystanders = ["cache.db", "cache.db-wal", "legacy-repo-root-cache.db", "notes.txt"];
    for (const n of bystanders) fs.writeFileSync(path.join(dir, n), "x");
    fs.writeFileSync(path.join(dir, "cache-20260101-0000.db"), "x");

    pruneBackups(dir, 0);

    for (const n of bystanders) {
      expect(fs.existsSync(path.join(dir, n))).toBe(true);
    }
    expect(fs.existsSync(path.join(dir, "cache-20260101-0000.db"))).toBe(false);
  });

  it("a missing backup directory is not an error", () => {
    expect(pruneBackups(path.join(tmpDir(), "nope"), 7)).toEqual([]);
  });
});
