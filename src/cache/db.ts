import Database from "better-sqlite3";

let dbInstance: Database.Database | null = null;

export function getDbPath(): string {
  if (process.env.NODE_ENV === "test") {
    return ":memory:";
  }
  return process.env.CP_MCP_DB_PATH || "cache.db";
}

export function initDb(dbPath?: string): Database.Database {
  const targetPath = dbPath || getDbPath();
  const db = new Database(targetPath);

  // WAL mode for concurrency, except in-memory DBs where it has no effect/is not supported
  if (targetPath !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }

  // Run migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key         TEXT PRIMARY KEY,
      body        TEXT NOT NULL,
      etag        TEXT,
      fetched_at  INTEGER NOT NULL,
      ttl_s       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      site TEXT NOT NULL,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      contest_id TEXT,
      difficulty INTEGER,
      difficulty_source TEXT,
      difficulty_confidence TEXT,
      tags TEXT,
      solved_count INTEGER,
      points REAL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_problems_diff ON problems(difficulty);
    CREATE INDEX IF NOT EXISTS idx_problems_site ON problems(site);

    CREATE TABLE IF NOT EXISTS user_solved (
      site TEXT,
      handle TEXT,
      problem_id TEXT,
      first_ac_at INTEGER,
      attempts INTEGER,
      PRIMARY KEY (site, handle, problem_id)
    );

    CREATE TABLE IF NOT EXISTS user_sync (
      site TEXT,
      handle TEXT,
      last_synced_epoch INTEGER,
      last_run_at INTEGER,
      PRIMARY KEY (site, handle)
    );
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
