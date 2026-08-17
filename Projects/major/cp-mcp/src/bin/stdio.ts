import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "../server.js";

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();

  // All logs must go to stderr, as stdout is reserved for JSON-RPC.
  console.error("Starting CP-MCP server on stdio transport...");

  await server.connect(transport);
  console.error("CP-MCP server connected and listening.");
}

main().catch((error) => {
  console.error("Fatal error running CP-MCP server:", error);
  process.exit(1);
});
