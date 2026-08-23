import { describe, it, expect, beforeEach, afterEach } from "vitest";
import app from "../src/http.js";

const ORIGINAL_TOKEN = process.env.CP_MCP_AUTH_TOKEN;

describe("http auth gate", () => {
  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.CP_MCP_AUTH_TOKEN;
    } else {
      process.env.CP_MCP_AUTH_TOKEN = ORIGINAL_TOKEN;
    }
  });

  beforeEach(() => {
    delete process.env.CP_MCP_AUTH_TOKEN;
  });

  it("token unset: /mcp behaves as it does today (not a 401)", async () => {
    const res = await app.fetch(new Request("http://localhost/mcp", { method: "POST" }));
    expect(res.status).not.toBe(401);
  });

  it("token set, bare /mcp, no header -> 401", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(new Request("http://localhost/mcp", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("token set, /mcp/<correct token> -> not a 401", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(
      new Request("http://localhost/mcp/correct-token", { method: "POST" })
    );
    expect(res.status).not.toBe(401);
  });

  it("token set, /mcp with Authorization: Bearer <correct token> -> not a 401", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: { authorization: "Bearer correct-token" },
      })
    );
    expect(res.status).not.toBe(401);
  });

  it("token set, /mcp/<wrong token> -> 401", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(
      new Request("http://localhost/mcp/wrong-token", { method: "POST" })
    );
    expect(res.status).toBe(401);
  });

  it("token set, Authorization: Bearer <wrong token> -> 401", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: { authorization: "Bearer wrong-token" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("token set, wrong token of a different length -> 401, no thrown exception", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    // Deliberately much shorter/longer than "correct-token" to hit the
    // timingSafeEqual length-mismatch trap.
    const res = await app.fetch(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: { authorization: "Bearer x" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("/health returns 200 with the token set, no credentials supplied", async () => {
    process.env.CP_MCP_AUTH_TOKEN = "correct-token";
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
  });

  it("/health returns 200 with the token unset, no credentials supplied", async () => {
    delete process.env.CP_MCP_AUTH_TOKEN;
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
  });
});
