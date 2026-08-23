import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveBindHost } from "../src/http.js";

const ORIGINAL_HOST = process.env.CP_MCP_HTTP_HOST;

describe("http bind host resolution", () => {
  beforeEach(() => {
    delete process.env.CP_MCP_HTTP_HOST;
  });

  afterEach(() => {
    if (ORIGINAL_HOST === undefined) {
      delete process.env.CP_MCP_HTTP_HOST;
    } else {
      process.env.CP_MCP_HTTP_HOST = ORIGINAL_HOST;
    }
  });

  it("unset env -> defaults to loopback", () => {
    expect(resolveBindHost()).toBe("127.0.0.1");
  });

  it("CP_MCP_HTTP_HOST=0.0.0.0 -> explicit opt-in honored", () => {
    process.env.CP_MCP_HTTP_HOST = "0.0.0.0";
    expect(resolveBindHost()).toBe("0.0.0.0");
  });

  it("empty string -> falls back to loopback, not a bind to \"\"", () => {
    process.env.CP_MCP_HTTP_HOST = "";
    expect(resolveBindHost()).toBe("127.0.0.1");
  });

  it("whitespace-only -> falls back to loopback", () => {
    process.env.CP_MCP_HTTP_HOST = "   ";
    expect(resolveBindHost()).toBe("127.0.0.1");
  });
});
