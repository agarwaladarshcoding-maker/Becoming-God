import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDb, initDb, closeDb } from "../src/cache/db.js";
import { handleSearchProblemsAtcoder } from "../src/tools/searchProblemsAtcoder.js";
import { resetQueues } from "../src/upstream/http.js";

interface SeedRow {
  site_id: string;
  name: string;
  contest_id: string;
  difficulty: number | null;
  difficulty_source: "estimated" | "unknown";
  solved_count: number;
}

function seedProblems(rows: SeedRow[]) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(`
    INSERT INTO problems (
      id, site, site_id, name, url, contest_id,
      difficulty, difficulty_source, difficulty_confidence,
      tags, solved_count, points, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      `ac:${r.site_id}`,
      "atcoder",
      r.site_id,
      r.name,
      `https://atcoder.jp/contests/${r.contest_id}/tasks/${r.site_id}`,
      r.contest_id,
      r.difficulty,
      r.difficulty_source,
      r.difficulty_source === "estimated" ? "high" : null,
      "[]",
      r.solved_count,
      null,
      now
    );
  }
}

describe("cp_search_problems_atcoder - unrated problems", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    initDb(":memory:");
    // Catalogue sync always fails in this test (no live upstream calls allowed);
    // handleSearchProblemsAtcoder falls back to whatever is already seeded in the DB.
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: async () => "",
      json: async () => ({}),
      clone() {
        return this;
      },
    });
    vi.stubGlobal("fetch", mockFetch);
    resetQueues();

    seedProblems([
      { site_id: "abc900_a", name: "Rated Low", contest_id: "abc900", difficulty: 800, difficulty_source: "estimated", solved_count: 100 },
      { site_id: "abc900_b", name: "Rated Mid", contest_id: "abc900", difficulty: 900, difficulty_source: "estimated", solved_count: 200 },
      { site_id: "abc900_c", name: "Rated High", contest_id: "abc900", difficulty: 1500, difficulty_source: "estimated", solved_count: 50 },
      { site_id: "dp_a", name: "Frog 1", contest_id: "dp", difficulty: null, difficulty_source: "unknown", solved_count: 91360 },
      { site_id: "dp_b", name: "Frog 2", contest_id: "dp", difficulty: null, difficulty_source: "unknown", solved_count: 40000 },
      { site_id: "typical90_a", name: "Traveling Takahashi", contest_id: "typical90", difficulty: null, difficulty_source: "unknown", solved_count: 5000 },
    ]);
  });

  afterEach(() => {
    closeDb();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("excludes unrated rows by default and names the excluded count in the footer", async () => {
    const result = await handleSearchProblemsAtcoder({
      min_difficulty: 800,
      max_difficulty: 1000,
      min_solver_count: 0,
      limit: 10,
      include_unrated: false,
    });

    expect(result.isError).toBeUndefined();
    const ids = result.structuredContent?.problems.map((p: { siteId: string }) => p.siteId);
    expect(ids).toEqual(expect.arrayContaining(["abc900_a", "abc900_b"]));
    expect(ids).not.toContain("dp_a");
    expect(ids).not.toContain("dp_b");
    expect(ids).not.toContain("typical90_a");

    expect(result.structuredContent?.unratedAvailable).toBe(3);
    expect(result.structuredContent?.unratedShown).toBe(0);
    expect(result.structuredContent?.includeUnrated).toBe(false);
    expect(result.content[0].text).toContain(
      "3 problems excluded — no difficulty estimate (pass include_unrated to see them)"
    );
  });

  it("returns unrated rows when include_unrated is true, with rated rows leading", async () => {
    const result = await handleSearchProblemsAtcoder({
      min_difficulty: 800,
      max_difficulty: 1000,
      min_solver_count: 0,
      limit: 10,
      include_unrated: true,
    });

    expect(result.isError).toBeUndefined();
    const problems = result.structuredContent?.problems as Array<{ siteId: string; difficulty?: number }>;
    const ids = problems.map(p => p.siteId);

    expect(ids).toContain("dp_a");
    expect(ids).toContain("dp_b");
    expect(ids).toContain("typical90_a");

    const lastRatedIndex = Math.max(ids.indexOf("abc900_a"), ids.indexOf("abc900_b"));
    const firstUnratedIndex = Math.min(ids.indexOf("dp_a"), ids.indexOf("dp_b"), ids.indexOf("typical90_a"));
    expect(lastRatedIndex).toBeLessThan(firstUnratedIndex);

    expect(result.structuredContent?.unratedAvailable).toBe(3);
    expect(result.structuredContent?.unratedShown).toBe(3);
    expect(result.structuredContent?.includeUnrated).toBe(true);
    expect(result.content[0].text).not.toContain("problems excluded");
    expect(result.content[0].text).toContain("showing 3 of 3 problems with no difficulty estimate (?)");

    // dp_a has the most solvers among unrated rows, so it must lead the unrated group.
    expect(ids[firstUnratedIndex]).toBe("dp_a");
  });

  it("renders an unrated problem's Difficulty cell as `?`, never 0", async () => {
    const result = await handleSearchProblemsAtcoder({
      min_difficulty: 800,
      max_difficulty: 1000,
      min_solver_count: 0,
      limit: 10,
      include_unrated: true,
    });

    expect(result.content[0].text).toMatch(/dp_a[^\n]*\|\s*\?\s*\|/);
    expect(result.content[0].text).not.toMatch(/dp_a[^\n]*\|\s*0\s*\|/);
  });

  it("omits the excluded-count footer line when nothing is excluded", async () => {
    // Fresh DB with only rated rows.
    closeDb();
    initDb(":memory:");
    seedProblems([
      { site_id: "abc901_a", name: "All Rated A", contest_id: "abc901", difficulty: 800, difficulty_source: "estimated", solved_count: 100 },
      { site_id: "abc901_b", name: "All Rated B", contest_id: "abc901", difficulty: 900, difficulty_source: "estimated", solved_count: 200 },
    ]);

    const result = await handleSearchProblemsAtcoder({
      min_difficulty: 800,
      max_difficulty: 1000,
      min_solver_count: 0,
      limit: 10,
      include_unrated: false,
    });

    expect(result.structuredContent?.unratedAvailable).toBe(0);
    expect(result.content[0].text).not.toContain("problems excluded");
  });

  it("reserves a minority share for unrated rows even when rated rows fill the band", async () => {
    // Fresh DB: 8 rated rows in-band (more than `limit`), plus 2 unrated rows.
    closeDb();
    initDb(":memory:");
    const ratedRows: SeedRow[] = Array.from({ length: 8 }, (_, i) => ({
      site_id: `abc950_${i}`,
      name: `Rated ${i}`,
      contest_id: "abc950",
      difficulty: 800 + i * 20,
      difficulty_source: "estimated" as const,
      solved_count: 1000 + i,
    }));
    seedProblems([
      ...ratedRows,
      { site_id: "dp_a", name: "Frog 1", contest_id: "dp", difficulty: null, difficulty_source: "unknown", solved_count: 91360 },
      { site_id: "dp_b", name: "Frog 2", contest_id: "dp", difficulty: null, difficulty_source: "unknown", solved_count: 40000 },
    ]);

    const result = await handleSearchProblemsAtcoder({
      min_difficulty: 800,
      max_difficulty: 1000,
      min_solver_count: 0,
      limit: 5,
      include_unrated: true,
    });

    expect(result.isError).toBeUndefined();
    const problems = result.structuredContent?.problems as Array<{ siteId: string; difficultySource: string }>;
    expect(problems.length).toBe(5);

    const unratedIndices = problems
      .map((p, i) => (p.difficultySource === "unknown" ? i : -1))
      .filter(i => i >= 0);
    expect(unratedIndices.length).toBeGreaterThanOrEqual(1);

    const ratedIndices = problems
      .map((p, i) => (p.difficultySource !== "unknown" ? i : -1))
      .filter(i => i >= 0);
    expect(Math.max(...ratedIndices)).toBeLessThan(Math.min(...unratedIndices));

    // dp_a has the most solvers among unrated rows, so it leads the reserved slots.
    expect(problems[unratedIndices[0]].siteId).toBe("dp_a");
    expect(result.structuredContent?.unratedAvailable).toBe(2);
    expect(result.structuredContent?.unratedShown).toBe(unratedIndices.length);
  });
});
