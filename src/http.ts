import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "./server.js";
import { getDb } from "./cache/db.js";

const app = new Hono();

// Per-IP rate limit: 60 tool calls per 5-minute window
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX_CALLS = 60;
const ipCallCounts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipCallCounts.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipCallCounts.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_MAX_CALLS - 1 };
  }
  if (entry.count >= RATE_MAX_CALLS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_MAX_CALLS - entry.count };
}

// Global upstream budget: track calls across all in-flight MCP requests
let globalUpstreamCalls = 0;
const GLOBAL_UPSTREAM_BUDGET = 500; // per minute across all IPs
let globalWindowStart = Date.now();

function checkGlobalBudget(): boolean {
  const now = Date.now();
  if (now - globalWindowStart > 60_000) {
    globalUpstreamCalls = 0;
    globalWindowStart = now;
  }
  if (globalUpstreamCalls >= GLOBAL_UPSTREAM_BUDGET) return false;
  globalUpstreamCalls++;
  return true;
}

// Allowed origins — extend for production hosts as needed
const ALLOWED_ORIGINS = new Set([
  "https://claude.ai",
  "https://www.notion.so",
  "https://cursor.sh",
]);

function isOriginAllowed(origin: string | null, host: string | null): boolean {
  if (!origin) return true; // stdio/non-browser clients have no Origin
  try {
    const url = new URL(origin);
    // Allow same-host (Inspector running locally)
    if (host && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      return true;
    }
    return ALLOWED_ORIGINS.has(`${url.protocol}//${url.hostname}`);
  } catch {
    return false;
  }
}

// Health check with snapshot age tracking
app.get("/health", c => {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const cf = db.prepare("SELECT MAX(updated_at) as last FROM problems WHERE site = 'codeforces'").get() as { last: number | null };
  const ac = db.prepare("SELECT MAX(updated_at) as last FROM problems WHERE site = 'atcoder'").get() as { last: number | null };

  return c.json({
    ok: true,
    status: "healthy",
    cf_snapshot_age_s: cf.last ? now - cf.last : null,
    ac_snapshot_age_s: ac.last ? now - ac.last : null,
  });
});

app.all("/mcp", async c => {
  const req = c.req.raw;

  // HTTPS-only: reject plaintext in production (trust X-Forwarded-Proto from reverse proxy)
  const proto = req.headers.get("x-forwarded-proto");
  if (proto && proto !== "https") {
    return c.json({ error: "HTTPS required" }, 426);
  }

  // Origin validation
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!isOriginAllowed(origin, host)) {
    return c.json({ error: "Origin not allowed" }, 403);
  }

  // Per-IP rate limiting
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return c.json({ error: "Rate limit exceeded — 60 calls per 5 minutes" }, 429);
  }

  // Global upstream budget guard
  if (!checkGlobalBudget()) {
    return c.json({ error: "Server upstream budget exhausted — try again in a minute" }, 503);
  }

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = buildServer();
  await server.connect(transport);
  const response = await transport.handleRequest(req);
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-RateLimit-Remaining", String(remaining));
  newHeaders.set("X-RateLimit-Limit", String(RATE_MAX_CALLS));
  return new Response(response.body, { status: response.status, headers: newHeaders });
});

export default app;
