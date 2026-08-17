import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDb, initDb, closeDb } from "../src/cache/db.js";
import { getDbKv, setDbKv, getCachedOrFetch } from "../src/cache/kv.js";
import {
  filterProblems,
  rankProblems,
  seededShuffle,
} from "../src/domain/search.js";
import { computeCfRatingStats } from "../src/domain/analytics.js";
import { handleSearchProblemsCodeforces } from "../src/tools/searchProblemsCodeforces.js";
import { handleRatingHistoryCodeforces } from "../src/tools/ratingHistoryCodeforces.js";
import { handleGetProblemCodeforces } from "../src/tools/getProblemCodeforces.js";
import { resetQueues } from "../src/upstream/http.js";

describe("Milestone 2 - Caching and Database", () => {
  beforeEach(() => {
    // Force clean in-memory database for testing
    process.env.NODE_ENV = "test";
    initDb(":memory:");
  });

  afterEach(() => {
    closeDb();
  });

  it("should perform basic KV get and set operations with TTL", () => {
    const key = "test-key";
    const val = { value: "hello world" };

    // Miss
    expect(getDbKv(key)).toBeNull();

    // Set with 2s TTL
    setDbKv(key, val, 2);

    // Hit
    const hit = getDbKv<{ value: string }>(key);
    expect(hit).not.toBeNull();
    expect(hit?.status).toBe("hit");
    expect(hit?.data).toEqual(val);
  });

  it("should handle expired TTL and transition to stale/SWR status", async () => {
    const key = "test-stale-key";
    const val = { foo: "bar" };

    // Set with 0s TTL (immediately stale, but within SWR window of 86400s)
    setDbKv(key, val, 0);

    const hit = getDbKv<{ foo: string }>(key, 100);
    expect(hit).not.toBeNull();
    expect(hit?.status).toBe("stale");
    expect(hit?.data).toEqual(val);
  });

  it("should run SWR caching flow via getCachedOrFetch", async () => {
    const key = "swr-key";
    let fetchCount = 0;
    const fetchFn = async (etag?: string) => {
      fetchCount++;
      return { data: { count: fetchCount }, etag: `tag-${fetchCount}` };
    };

    // First fetch: Miss. Resolves live.
    const res1 = await getCachedOrFetch(key, 0, fetchFn, 60); // 0s TTL so it goes stale immediately
    expect(res1.source).toBe("live");
    expect(res1.data).toEqual({ count: 1 });
    expect(fetchCount).toBe(1);

    // Second fetch: Stale. Returns stale data, triggers background refresh.
    const res2 = await getCachedOrFetch(key, 0, fetchFn, 60);
    expect(res2.source).toBe("stale");
    expect(res2.data).toEqual({ count: 1 }); // Still returns count = 1

    // Wait a brief tick for the SWR promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Third fetch: Stale again (since TTL is 0), but background refresh should have succeeded
    // updating cache to count = 2
    const res3 = await getCachedOrFetch(key, 0, fetchFn, 60);
    expect(res3.data).toEqual({ count: 2 });
  });
});

describe("Milestone 2 - Practice Ladder Domain Logic", () => {
  const mockProblems = [
    {
      site: "codeforces" as const,
      id: "cf:1A",
      siteId: "1A",
      name: "Theatre Square",
      url: "https://codeforces.com/contest/1/problem/A",
      contestId: "1",
      difficulty: 1000,
      difficultySource: "official" as const,
      tags: ["math"],
      solvedCount: 150000,
    },
    {
      site: "codeforces" as const,
      id: "cf:1900C",
      siteId: "1900C",
      name: "Anji's Binary Tree",
      url: "https://codeforces.com/contest/1900/problem/C",
      contestId: "1900",
      difficulty: 1300,
      difficultySource: "official" as const,
      tags: ["trees", "graphs", "dfs and similar"],
      solvedCount: 12000,
    },
    {
      site: "codeforces" as const,
      id: "cf:1900D",
      siteId: "1900D",
      name: "Unique Lcm",
      url: "https://codeforces.com/contest/1900/problem/D",
      contestId: "1900",
      difficulty: 1600,
      difficultySource: "official" as const,
      tags: ["math", "number theory"],
      solvedCount: 5000,
    },
  ];

  it("should filter problems by solved count and tags", () => {
    // Minimum solved filter
    const f1 = filterProblems(mockProblems, { minSolvedCount: 10000 });
    expect(f1.length).toBe(2); // 1A (150K) and 1900C (12K)

    // Tag matching 'any'
    const f2 = filterProblems(mockProblems, {
      tags: ["math", "trees"],
      tagMode: "any",
    });
    expect(f2.length).toBe(3); // All have either math or trees/graphs

    // Tag matching 'all'
    const f3 = filterProblems(mockProblems, {
      tags: ["math", "number theory"],
      tagMode: "all",
    });
    expect(f3.length).toBe(1);
    expect(f3[0].id).toBe("cf:1900D");

    // Excluded solved problems
    const solved = new Set(["cf:1A"]);
    const f4 = filterProblems(mockProblems, { excludeSolvedIds: solved });
    expect(f4.length).toBe(2);
    expect(f4.find((p) => p.id === "cf:1A")).toBeUndefined();
  });

  it("should rank problems by proximity to band center and solver counts", () => {
    // Band 1000 to 1600. Center is 1300.
    // 1900C is at 1300 (dist 0)
    // 1A (1000) and 1900D (1600) both are at distance 300.
    // Between 1A and 1900D, 1A has 150000 solvers vs 1900D with 5000. So 1A should rank higher.
    const ranked = rankProblems(mockProblems, 1000, 1600);
    expect(ranked.map((p) => p.id)).toEqual(["cf:1900C", "cf:1A", "cf:1900D"]);
  });

  it("should shuffle items deterministically using seeded shuffle", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const s1 = seededShuffle(arr, 42);
    const s2 = seededShuffle(arr, 42);
    const s3 = seededShuffle(arr, 999);

    // Deterministic with same seed
    expect(s1).toEqual(s2);
    // Varies with different seed
    expect(s1).not.toEqual(s3);
    // Length preserved
    expect(s1.length).toBe(10);
  });
});

describe("Milestone 2 - Tool Handlers & Formatter Integration", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    initDb(":memory:");
    vi.stubGlobal("fetch", mockFetch);
    resetQueues();
  });

  afterEach(() => {
    closeDb();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should run cp_search_problems_codeforces flow with mock API responses", async () => {
    // Mock CF problems list api response
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({
          status: "OK",
          result: {
            problems: [
              {
                contestId: 1900,
                index: "C",
                name: "Anji's Binary Tree",
                type: "PROGRAMMING",
                rating: 1300,
                tags: ["trees", "graphs"],
              },
              {
                contestId: 1,
                index: "A",
                name: "Theatre Square",
                type: "PROGRAMMING",
                rating: 1000,
                tags: ["math"],
              },
            ],
            problemStatistics: [
              { contestId: 1900, index: "C", solvedCount: 15000 },
              { contestId: 1, index: "A", solvedCount: 180000 },
            ],
          },
        }),
      clone() {
        return this;
      },
    });

    const result = await handleSearchProblemsCodeforces({
      min_difficulty: 800,
      max_difficulty: 1400,
      tags: ["trees"],
      min_solved_count: 100,
      limit: 5,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Found 1 Codeforces problem");
    expect(result.content[0].text).toContain("Anji's Binary Tree");
    expect(result.structuredContent?.problems.length).toBe(1);
  });

  it("should correctly handle cp_rating_history_codeforces", async () => {
    const mockRatingChanges = [
      {
        contestId: 1,
        contestName: "Codeforces Beta Round 1",
        handle: "tourist",
        rank: 15,
        ratingUpdateTimeSeconds: 1266580000,
        oldRating: 1500,
        newRating: 1520,
      },
      {
        contestId: 2,
        contestName: "Codeforces Beta Round 2",
        handle: "tourist",
        rank: 2,
        ratingUpdateTimeSeconds: 1267580000,
        oldRating: 1520,
        newRating: 1720,
      },
      {
        contestId: 3,
        contestName: "Codeforces Beta Round 3",
        handle: "tourist",
        rank: 50,
        ratingUpdateTimeSeconds: 1268580000,
        oldRating: 1720,
        newRating: 1710,
      },
      {
        contestId: 4,
        contestName: "Codeforces Beta Round 4",
        handle: "tourist",
        rank: 10,
        ratingUpdateTimeSeconds: 1269580000,
        oldRating: 1710,
        newRating: 1715,
      },
    ];

    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({ status: "OK", result: mockRatingChanges }),
      clone() {
        return this;
      },
    });

    // 1. Full history
    const result = await handleRatingHistoryCodeforces({
      handle: "tourist",
      limit: 10,
      summary_only: false,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain(
      "Codeforces Rating History for tourist"
    );
    expect(result.content[0].text).toContain("Codeforces Beta Round 2");
    expect(result.structuredContent?.history.length).toBe(4);
    expect(result.structuredContent?.stats?.peakRating).toBe(1720);

    // 2. Summary only
    const resultSummary = await handleRatingHistoryCodeforces({
      handle: "tourist",
      limit: 10,
      summary_only: true,
    });

    expect(resultSummary.content[0].text).toContain(
      "Codeforces Rating Summary for tourist"
    );
    expect(resultSummary.content[0].text).not.toContain(
      "Codeforces Beta Round 4"
    );
    expect(resultSummary.content[0].text).toContain("Peak Rating: 1720");
  });
});
