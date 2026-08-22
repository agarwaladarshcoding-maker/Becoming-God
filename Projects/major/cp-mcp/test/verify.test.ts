import { describe, it, expect } from "vitest";
import { verifySubmissionChain } from "../src/domain/verify.js";
import { Submission } from "../src/domain/types.js";

const PROBLEM_ID = "cf:1900C";
const PROBLEM_NAME = "Test Problem";
const URL = "https://codeforces.com/problemset/problem/1900/C";
const SINCE_EPOCH = 1700000000; // 2023-11-14T22:13:20Z

function makeSub(overrides: Partial<Submission>): Submission {
  return {
    site: "codeforces",
    problemId: PROBLEM_ID,
    submissionId: "1",
    at: "2024-01-01T00:00:00.000Z",
    verdict: "WA",
    rawVerdict: "WRONG_ANSWER",
    language: "GNU C++20",
    ...overrides
  };
}

describe("verifySubmissionChain", () => {
  it("marks a CF OK + TESTS submission as solved", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "OTHER", rawVerdict: "OK", testset: "TESTS", at: "2024-02-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.status).toBe("solved");
  });

  it("does NOT mark a CF OK + non-TESTS testset as solved", () => {
    // verdict deliberately not "AC" so the first clause of the OR cannot pass on its own.
    const subs = [
      makeSub({ submissionId: "1", verdict: "OTHER", rawVerdict: "OK", testset: "PRETESTS", at: "2024-02-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.status).toBe("attempted");
  });

  it("marks an AtCoder AC verdict as solved", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-02-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.status).toBe("solved");
  });

  it("marks a WA-only chain as attempted, with correct attempts and verdicts", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "WA", rawVerdict: "WRONG_ANSWER", at: "2024-01-01T00:00:00.000Z" }),
      makeSub({ submissionId: "2", verdict: "WA", rawVerdict: "WRONG_ANSWER", at: "2024-01-02T00:00:00.000Z" }),
      makeSub({ submissionId: "3", verdict: "TLE", rawVerdict: "TIME_LIMIT_EXCEEDED", at: "2024-01-03T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.status).toBe("attempted");
    expect(result.attempts).toBe(3);
    expect(result.distinctVerdicts.sort()).toEqual(["TLE", "WA"]);
  });

  it("returns untouched for an empty submission list when history is complete", () => {
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, [], SINCE_EPOCH, true);
    expect(result.status).toBe("untouched");
    expect(result.attempts).toBe(0);
    expect(result.firstAcAt).toBeUndefined();
    expect(result.distinctVerdicts).toEqual([]);
    expect(result.withinWindow).toBe(false);
  });

  it("returns unknown for an empty submission list when history is incomplete", () => {
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, [], SINCE_EPOCH, false);
    expect(result.status).toBe("unknown");
    expect(result.attempts).toBe(0);
    expect(result.firstAcAt).toBeUndefined();
    expect(result.distinctVerdicts).toEqual([]);
    expect(result.withinWindow).toBe(false);
  });

  it("defaults historyComplete to true when omitted (existing call sites keep compiling)", () => {
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, [], SINCE_EPOCH);
    expect(result.status).toBe("untouched");
  });

  it("keeps a solved chain solved even when history is incomplete", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-02-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, false);
    expect(result.status).toBe("solved");
  });

  it("picks the earliest AC as firstAcAt when several exist, out of order", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-03-01T00:00:00.000Z" }),
      makeSub({ submissionId: "2", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-01-01T00:00:00.000Z" }),
      makeSub({ submissionId: "3", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-02-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.firstAcAt).toBe("2024-01-01T00:00:00.000Z");
  });

  it("sets withinWindow true only when an AC lands at or after sinceEpoch", () => {
    // sinceEpoch corresponds to 2023-11-14T22:13:20.000Z
    const subs = [
      makeSub({ submissionId: "1", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2023-11-14T22:13:20.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.withinWindow).toBe(true);
  });

  it("sets withinWindow false when the AC predates sinceEpoch", () => {
    const subs = [
      makeSub({ submissionId: "1", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2023-01-01T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.withinWindow).toBe(false);
  });

  it("filters out submissions belonging to other problem ids", () => {
    const subs = [
      makeSub({ submissionId: "1", problemId: "cf:9999Z", verdict: "AC", rawVerdict: "AC", testset: undefined, at: "2024-01-01T00:00:00.000Z" }),
      makeSub({ submissionId: "2", problemId: PROBLEM_ID, verdict: "WA", rawVerdict: "WRONG_ANSWER", at: "2024-01-02T00:00:00.000Z" })
    ];
    const result = verifySubmissionChain(PROBLEM_ID, PROBLEM_NAME, URL, subs, SINCE_EPOCH, true);
    expect(result.status).toBe("attempted");
    expect(result.attempts).toBe(1);
    expect(result.distinctVerdicts).toEqual(["WA"]);
  });
});
