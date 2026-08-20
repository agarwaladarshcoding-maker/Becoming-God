import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
const server = new McpServer({ name: "test", version: "1" });

server.prompt("test_prompt", "A description", { handle: z.string().describe("Codeforces handle") }, (args) => {
  return {
    messages: [
      { role: "user", content: { type: "text", text: args.handle } }
    ]
  };
});
