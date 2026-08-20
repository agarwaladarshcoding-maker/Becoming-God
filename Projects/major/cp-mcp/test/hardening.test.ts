import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { politeFetch, resetQueues, BREAKER_FAIL_THRESHOLD, BREAKER_COOLDOWN_MS } from "../src/upstream/http.js";

describe("Hardening - Circuit Breaker", () => {
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

  it("should trip circuit breaker after multiple persistent failures", async () => {
    // Return 500 always
    mockFetch.mockResolvedValue({
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      clone() { return this; }
    });

    const runCall = async () => {
      const p = politeFetch("https://codeforces.com/api/user.info");
      p.catch(() => {});
      // Advance past retries (attempt 1 + 3 retries = 4 attempts)
      await vi.advanceTimersByTimeAsync(30000);
      try {
        await p;
      } catch (e) {}
    };

    // First complete failure
    await runCall();
    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 + 3 retries

    // Second complete failure
    await runCall();
    expect(mockFetch).toHaveBeenCalledTimes(8); // + 4

    // Third complete failure -> trips the breaker
    await runCall();
    expect(mockFetch).toHaveBeenCalledTimes(12); // + 4

    // Fourth call should fail IMMEDIATELY because circuit is OPEN, no fetch should be made
    const p4 = politeFetch("https://codeforces.com/api/user.info");
    await expect(p4).rejects.toThrow("Circuit breaker OPEN for codeforces.com");
    expect(mockFetch).toHaveBeenCalledTimes(12); // Still 12
  });

  it("should allow HALF_OPEN state after cooldown and recover", async () => {
    // Return 500 to trip it
    let statusToReturn = 500;
    mockFetch.mockImplementation(async () => {
      return {
        status: statusToReturn,
        headers: new Headers({ "content-type": "application/json" }),
        clone() { return this; }
      };
    });

    const runCall = async () => {
      const p = politeFetch("https://codeforces.com/api/user.info");
      p.catch(() => {});
      await vi.advanceTimersByTimeAsync(30000);
      try { await p; } catch (e) {}
    };

    await runCall();
    await runCall();
    await runCall();
    
    // Now it's OPEN
    await expect(politeFetch("https://codeforces.com/api/user.info")).rejects.toThrow("Circuit breaker OPEN");

    // Wait for cooldown
    await vi.advanceTimersByTimeAsync(BREAKER_COOLDOWN_MS + 100);

    // Call again -> HALF_OPEN, so it SHOULD call fetch once
    // If it fails again, it trips immediately (no retries if we're simulating a single completely failed call, 
    // wait, our http client retries even in half_open, let's see. It will retry if retryable. Let's return 200 now).
    statusToReturn = 200;
    
    const pSuccess = politeFetch("https://codeforces.com/api/user.info");
    await vi.advanceTimersByTimeAsync(10000); // Advance past queue interval
    await expect(pSuccess).resolves.toBeDefined();

    // Now it should be CLOSED, so subsequent calls work
    const pClosed = politeFetch("https://codeforces.com/api/user.info");
    await vi.advanceTimersByTimeAsync(10000);
    await expect(pClosed).resolves.toBeDefined();
  });
});
