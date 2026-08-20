"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var zod_1 = require("zod");
var server = new mcp_js_1.McpServer({ name: "test", version: "1" });
server.prompt("test_prompt", "A description", { handle: zod_1.z.string().describe("Codeforces handle") }, function (args) {
    return {
        messages: [
            { role: "user", content: { type: "text", text: args.handle } }
        ]
    };
});
