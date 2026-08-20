"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var server = new mcp_js_1.McpServer({ name: "test", version: "1" });
server.prompt("test", { description: "test" }, function () { return ({ messages: [] }); });
