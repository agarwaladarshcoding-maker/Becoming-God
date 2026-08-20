import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { buildServer } from "../server.js";

const app = express();
app.use(cors());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Buffer for early POST requests without sessionId
let pendingPost: { req: express.Request, res: express.Response, body: any } | null = null;

// Store transports by session ID
const transports: Record<string, SSEServerTransport> = {};

app.get("/sse", async (req, res) => {
  console.log("Received GET request to /sse");
  
  // The client will connect here to establish the SSE stream
  const transport = new SSEServerTransport("/message", res);
  transports[transport.sessionId] = transport;
  
  res.on("close", () => {
    console.log(`Connection closed for session ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });
  
  const server = buildServer();
  await server.connect(transport);
  
  if (pendingPost) {
    console.log("Processing pending POST request for new session");
    const { req: preq, res: pres, body } = pendingPost;
    pendingPost = null;
    await transport.handlePostMessage(preq, pres, body);
  }
});

app.post(["/message", "/sse"], express.json(), async (req, res) => {
  console.log(`Received POST request to ${req.path}?sessionId=${req.query.sessionId}`);
  const sessionId = req.query.sessionId as string;
  
  if (!sessionId) {
    console.log("No sessionId provided, buffering POST request...");
    pendingPost = { req, res, body: req.body };
    return;
  }
  
  const transport = transports[sessionId];
  
  if (!transport) {
    res.status(404).send("No transport found for sessionId");
    return;
  }
  
  await transport.handlePostMessage(req, res, req.body);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}/sse`);
});
