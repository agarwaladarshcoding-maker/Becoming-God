import { describe, it, expect } from "vitest";
import {
  atcoderDifficultyToCfScale,
  normalizeAtcoderDifficulty,
} from "../src/domain/difficulty.js";
import { parseAtcoderProblem } from "../src/domain/normalize.js";

describe("Milestone 3 - AtCoder Difficulty Domain Logic", () => {
  it("should map AtCoder difficulty estimates to CF-equivalent scale", () => {
    expect(atcoderDifficultyToCfScale(-1000)).toBe(800);
    expect(atcoderDifficultyToCfScale(200)).toBe(900);
    expect(atcoderDifficultyToCfScale(400)).toBe(800);
    expect(atcoderDifficultyToCfScale(1200)).toBe(1600);
    expect(atcoderDifficultyToCfScale(4000)).toBe(3500);
  });

  it("should normalize AtCoder model metadata and confidence", () => {
    expect(
      normalizeAtcoderDifficulty({ difficulty: 1200, is_experimental: false })
    ).toEqual({
      difficulty: 1600,
      difficultySource: "estimated",
      difficultyConfidence: "high",
    });

    expect(
      normalizeAtcoderDifficulty({ difficulty: 200, is_experimental: true })
    ).toEqual({
      difficulty: 900,
      difficultySource: "estimated",
      difficultyConfidence: "low",
    });

    expect(normalizeAtcoderDifficulty()).toEqual({
      difficultySource: "unknown",
    });
  });

  it("should parse AtCoder problem identifiers and task URLs", () => {
    expect(parseAtcoderProblem("abc300_c")).toEqual({
      contestId: "abc300",
      problemId: "abc300_c",
    });

    expect(parseAtcoderProblem("ac:ABC300_C")).toEqual({
      contestId: "abc300",
      problemId: "abc300_c",
    });

    expect(
      parseAtcoderProblem("https://atcoder.jp/contests/abc300/tasks/abc300_c")
    ).toEqual({
      contestId: "abc300",
      problemId: "abc300_c",
    });
  });

  it("should reject malformed AtCoder problem identifiers", () => {
    expect(() => parseAtcoderProblem("abc300")).toThrow(
      "Invalid AtCoder problem ID format"
    );
    expect(() =>
      parseAtcoderProblem("https://example.com/contests/abc300/tasks/abc300_c")
    ).toThrow("Invalid AtCoder URL");
  });
});
