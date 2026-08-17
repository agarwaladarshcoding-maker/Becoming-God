import { describe, it, expect, vi } from "vitest";
import { buildServer } from "../src/server.js";

describe("cp-mcp server", () => {
  it("should build and register the ping tool", async () => {
    const server = buildServer();
    const registeredTools = (server as any)._registeredTools;

    expect(registeredTools).toBeDefined();
    expect(registeredTools.ping).toBeDefined();
    expect(registeredTools.ping.description).toBe(
      "Ping the server to check health and connectivity."
    );

    // Execute the ping handler
    const handler = registeredTools.ping.handler;
    const response = await handler({}, {} as any);

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toContain("pong");
    expect(response.content[0].text).toContain("source: local");
    expect(response.structuredContent).toEqual({
      status: "pong",
      source: "local",
      upstreamCalls: 0,
      partial: false,
    });
  });

  it("should build and register cp_get_user_codeforces tool", async () => {
    const server = buildServer();
    const registeredTools = (server as any)._registeredTools;

    expect(registeredTools).toBeDefined();
    expect(registeredTools.cp_get_user_codeforces).toBeDefined();
    expect(registeredTools.cp_get_user_codeforces.description).toContain(
      "Get a Codeforces user profile"
    );

    // Mock fetch for the handler execution
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({
          status: "OK",
          result: [
            {
              handle: "tourist",
              rating: 3900,
              maxRating: 3979,
              rank: "legendary grandmaster",
              lastOnlineTimeSeconds: 1723824000,
            },
          ],
        }),
      clone() {
        return this;
      },
    });
    vi.stubGlobal("fetch", mockFetch);

    const handler = registeredTools.cp_get_user_codeforces.handler;
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await handler({ handle: "tourist" }, {} as any);
      expect(response).toBeDefined();
      expect(response.content[0].text).toContain("Codeforces Profile: tourist");
      expect(response.structuredContent.handle).toBe("tourist");

      // Verify that structured stderr logs are generated
      expect(consoleErrorSpy).toHaveBeenCalled();
      const toolCallLog = consoleErrorSpy.mock.calls
        .map((c) => {
          try {
            return JSON.parse(c[0]);
          } catch {
            return {};
          }
        })
        .find((o) => o.tool === "cp_get_user_codeforces");

      expect(toolCallLog).toBeDefined();
      expect(toolCallLog.tool).toBe("cp_get_user_codeforces");
      expect(toolCallLog.cache).toBe("miss");
      expect(toolCallLog.upstream_calls).toBe(1);
      expect(toolCallLog.ok).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      consoleErrorSpy.mockRestore();
    }
  });
});
