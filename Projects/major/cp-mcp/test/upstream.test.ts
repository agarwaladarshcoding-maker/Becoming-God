import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { politeFetch, resetQueues } from "../src/upstream/http.js";
import { cfCall } from "../src/upstream/codeforces.js";
import { handleGetUserCodeforces } from "../src/tools/getUserCodeforces.js";

describe("Upstream HTTP & Codeforces API client", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    resetQueues();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should block requests to non-allowlisted hosts (SSRF guard)", async () => {
    await expect(politeFetch("https://google.com/")).rejects.toThrow(
      "SSRF Guard: Host not allowlisted"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should enforce Codeforces rate-limit (throttle queuing)", async () => {
    // Mock successful response
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ status: "OK", result: [] }),
      clone() {
        return this;
      },
    });

    const p1 = politeFetch("https://codeforces.com/api/user.info?handles=tourist");
    const p2 = politeFetch("https://codeforces.com/api/user.info?handles=Feodorv");

    // First request should resolve immediately or on next ticks
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second request is queued because CF interval is 2100ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past the 2100ms interval
    await vi.cleanTestFilters; // just a placeholder/cleanup if needed
    await vi.advanceTimersByTimeAsync(1200); // 1 + 1000 + 1200 = 2201ms
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await p1;
    await p2;
  });

  it("should retry on Codeforces call limit exceeded body response", async () => {
    let attempt = 0;
    mockFetch.mockImplementation(async () => {
      attempt++;
      if (attempt < 3) {
        // Return 200 but FAILED with call limit exceeded
        return {
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () =>
            JSON.stringify({ status: "FAILED", comment: "Call limit exceeded. Please try again later." }),
          clone() {
            return this;
          },
        };
      }
      return {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ status: "OK", result: ["mock-res"] }),
        clone() {
          return this;
        },
      };
    });

    const fetchPromise = cfCall("user.info", { handles: "tourist" });

    // The fetch starts, fails first time, schedules retry (e.g. 2000ms + jitter)
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past first backoff (~2000-3000ms)
    await vi.advanceTimersByTimeAsync(3500);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Second attempt

    // Advance past second backoff (~6000-7000ms)
    await vi.advanceTimersByTimeAsync(7500);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Third attempt (success)

    const res = await fetchPromise;
    expect(res).toEqual(["mock-res"]);
  });

  it("should fail gracefully after max retries for persistent call limit exceeded", async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({ status: "FAILED", comment: "Call limit exceeded. Please try again later." }),
      clone() {
        return this;
      },
    });

    const fetchPromise = cfCall("user.info", { handles: "tourist" });
    fetchPromise.catch(() => {});

    // Attempt 1
    await vi.advanceTimersByTimeAsync(1);
    // Retry 1: Attempt 2 (backoff 2000ms)
    await vi.advanceTimersByTimeAsync(3500);
    // Retry 2: Attempt 3 (backoff 6000ms)
    await vi.advanceTimersByTimeAsync(7500);
    // Retry 3: Attempt 4 (backoff 15000ms)
    await vi.advanceTimersByTimeAsync(16500);

    // After 4 attempts (initial + 3 retries), it should throw
    await expect(fetchPromise).rejects.toThrow("Codeforces call limit exceeded");
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});

describe("getUserCodeforces Tool Handler", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    resetQueues();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should successfully fetch and format Codeforces user profile", async () => {
    const touristProfile = {
      handle: "tourist",
      rating: 3900,
      maxRating: 3979,
      rank: "legendary grandmaster",
      lastOnlineTimeSeconds: 1723824000,
    };

    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ status: "OK", result: [touristProfile] }),
      clone() {
        return this;
      },
    });

    const result = await handleGetUserCodeforces({ handle: "tourist" });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Codeforces Profile: tourist");
    expect(result.content[0].text).toContain("Rating: 3900");
    expect(result.content[0].text).toContain("Rank: legendary grandmaster");
    expect(result.content[0].text).toContain("source: live");

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.handle).toBe("tourist");
    expect(result.structuredContent?.rating).toBe(3900);
    expect(result.structuredContent?.maxRating).toBe(3979);
    expect(result.structuredContent?.rank).toBe("legendary grandmaster");
  });

  it("should return a clean error if handle is not found", async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ status: "FAILED", comment: "handles: User not found" }),
      clone() {
        return this;
      },
    });

    const result = await handleGetUserCodeforces({ handle: "non_existent_user_123" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("handle not found on Codeforces");
  });
});
