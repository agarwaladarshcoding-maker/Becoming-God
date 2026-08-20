import { describe, it, expect } from "vitest";
import { formatMarkdownTable } from "../src/format/table.js";

describe("Hardening - Token Size Regression", () => {
  it("should format a very large table compactly", () => {
    // Generate 100 rows
    const headers = ["ID", "Name", "Rating", "Tags", "URL"];
    const rows = Array.from({ length: 100 }).map((_, i) => [
      `cf:100${i}A`,
      `Problem ${i}`,
      "1500",
      "dp, math",
      `https://codeforces.com/problemset/problem/100${i}/A`
    ]);

    const md = formatMarkdownTable(headers, rows);
    
    // Check that there are 100 rows + header (2) = 102 lines
    const lines = md.trim().split("\n");
    expect(lines.length).toBe(102);

    // Ensure the total character size is within reasonable bounds (e.g., < 20KB for 100 problems)
    expect(md.length).toBeLessThan(20000); 
  });
  
  it("should handle extremely long cell contents by truncation if necessary or at least not explode", () => {
    // Actually our table formatter doesn't truncate, it just joins. 
    // We want to make sure it doesn't add infinite padding.
    const headers = ["A", "B"];
    const longString = "x".repeat(1000);
    const rows = [[longString, "short"]];
    const md = formatMarkdownTable(headers, rows);
    
    // Total length should be around 1000 (header padded) + 1000 (separator padded) + 1000 (content)
    expect(md.length).toBeLessThan(3500);
  });
});
