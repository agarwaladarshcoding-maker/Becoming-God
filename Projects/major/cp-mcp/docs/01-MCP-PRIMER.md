# 01 — MCP Primer (how it works, and how it differs from an API)

## 1. Mental model

MCP (Model Context Protocol) is **not** a data format or a new API style. It is a thin
**JSON-RPC 2.0** message layer that lets an LLM application *discover* and *call* your
code at runtime.

Think: a standard port. You build the plug once; every host with the port can use it.

### Roles

| Role | What it is | Example |
|---|---|---|
| **Host** | The app the human talks to | Claude Desktop, Notion, Gemini CLI, Cursor |
| **Client** | One connection instance inside the host, one per server | The host's MCP client for `cp-mcp` |
| **Server** | Your process, exposing capabilities | `cp-mcp` |

Message direction is fixed: clients send **requests** and **notifications**; servers send
**responses** and **notifications**. Servers do not initiate JSON-RPC requests to clients
(sampling/elicitation are special server→client requests routed via the client's own
capability grant — treat them as advanced).

## 2. The four things a server can expose

| Primitive | Controlled by | Analogy | Use in cp-mcp |
|---|---|---|---|
| **Tools** | The model chooses | POST endpoint / function call | Everything in v1 |
| **Resources** | The app or user attaches | A file / GET endpoint | Cached problemset snapshot, solved-set |
| **Prompts** | The user picks | A slash command | "Pick today's ladder", "Audit log" |
| **Completions** | Client asks for argument autocomplete | Typeahead | Tag / handle suggestions (nice-to-have) |

Client-side primitives your server *may* request (advanced): **sampling** (ask the client's
model to generate something), **elicitation** (ask the human for a missing input), **roots**
(filesystem scopes), **logging**.

> v1 rule: tools only. Resources at M6, prompts at M6.

## 3. Connection lifecycle

```
client                                   server
  │  initialize (protocolVersion, capabilities, clientInfo)
  │──────────────────────────────────────────────►
  ◄────── result (protocolVersion, capabilities, serverInfo, instructions?)
  │  notifications/initialized
  │──────────────────────────────────────────────►
  │  tools/list
  │──────────────────────────────────────────────►
  ◄────── [{name,title,description,inputSchema,outputSchema?,annotations}]
  │  tools/call {name, arguments}
  │──────────────────────────────────────────────►
  ◄────── {content:[{type:"text",text}], structuredContent?, isError?}
```

Also available: `notifications/tools/list_changed`, progress notifications, log messages,
and `notifications/cancelled`.

### The `instructions` field
The `initialize` result can carry server-level `instructions`. Use it. Put the
rate-limit reality and the "prefer the site-specific search tools over N single lookups" guidance
there so every host injects it into the model's context.

## 4. Two error classes (people get this wrong)

| Class | When | How to return | Model sees |
|---|---|---|---|
| **Protocol error** | Unknown tool, malformed params, schema violation | JSON-RPC `error` object | A failure it usually cannot fix |
| **Tool error** | CF said FAILED, handle not found, upstream timeout | Normal result with `isError: true` + explanatory text | Text it can read and retry from |

Rule for cp-mcp: **anything caused by the outside world is a tool error with a readable
message**, e.g. `"Codeforces rate limit hit; cached data from 14:03 UTC returned instead."`

## 5. Transports

### stdio (local)
- Server runs as a child process; newline-delimited JSON-RPC over stdin/stdout.
- **Never write logs to stdout** — it corrupts the protocol stream. Use stderr.
- No auth, no hosting. This is how Claude Desktop / Cursor / CLIs will run you.

### Streamable HTTP (remote) — the modern one
- **One** HTTP endpoint (e.g. `https://cp-mcp.example.dev/mcp`) handling POST (and GET for
  a server-initiated stream).
- Each message is an HTTP POST; the reply is either a plain JSON object or a
  request-scoped **SSE** stream when you need to stream or send notifications.
- Enables **stateless** server deployments (great for Workers/Lambda).
- Session pinning, when used, rides on an `Mcp-Session-Id` header established at `initialize`.
- Newer spec revisions add routing headers (`Mcp-Method`, `Mcp-Name`) so gateways can
  rate-limit without parsing bodies, and `ttlMs`/`cacheScope` on list/read results so
  clients know how long `tools/list` stays fresh.

### Deprecated: HTTP+SSE (2024-11-05)
- Two endpoints (GET `/sse` for server→client, POST for client→server). Replaced by
  Streamable HTTP. Only add a fallback if you must support old clients.

### Spec versioning
The spec is **date-versioned**: `2024-11-05` → `2025-03-26` → `2025-06-18` → `2025-11-25`
→ `2026-07-28`. Don't hand-roll version logic; let the SDK negotiate, and pin the SDK.

### Decision for cp-mcp
Write tool logic transport-agnostic. Two thin entrypoints:
`bin/stdio.ts` and `src/http.ts`. Same registry, two mouths.

## 6. Authorization

### Why cp-mcp can stay genuinely open
Both upstreams are **public and read-only**: the Codeforces API serves public data without
a key, and the AtCoder Problems datasets are open JSON. So the server needs **no user
credentials** — which is exactly what makes a public, shareable server viable.

Protect yourself with **rate limiting + caching**, not OAuth.

### If you ever add private/write features
- Remote MCP servers are expected to use **OAuth 2.1 + PKCE (S256)**, HTTPS everywhere.
- Your server acts as an OAuth **resource server**: it must **validate the token audience**
  and reject tokens not issued for it.
- **Never pass the client's token upstream.** If you call an upstream API, you are a
  separate OAuth client to it with its own token.
- Enforcement happens at the **HTTP boundary with a real `401`** plus protected-resource
  metadata so the client can discover the auth server — not as a tool-level error string.
- Client registration: prefer static/preregistered client IDs or client-ID metadata
  documents; Dynamic Client Registration (RFC 7591) exists mainly for backwards compat.

### Local-server security musts
- Bind to `127.0.0.1`, validate the `Origin` header (DNS-rebinding protection).
- Never let a tool argument become a URL you fetch (SSRF). Allowlist hosts.

## 7. MCP vs a plain REST API — point by point

| Dimension | REST API | MCP server |
|---|---|---|
| **Consumer** | A programmer reading docs at build time | A model discovering capability at run time |
| **Discovery** | OpenAPI/docs, out of band | `tools/list` in-band, self-describing with JSON Schema |
| **Granularity** | Resource-shaped (`GET /user.status`) | Task-shaped (`cp_verify_solved_codeforces(...)`) |
| **Output concern** | Bandwidth | **Context tokens** — must trim, cap, summarize |
| **State** | Stateless request/response | Session: capability negotiation, progress, cancellation, notifications |
| **Change propagation** | Version bump + client redeploy | `tools/list_changed` notification |
| **Integration math** | N clients × M APIs | N clients + M servers |
| **Trust boundary** | Your code chose the call | **A model** chose the call ⇒ strict schemas, annotations, validation |
| **Auth model** | API keys, per-service | OAuth 2.1 resource-server model, audience-bound tokens |
| **Transport** | HTTP only | stdio, Streamable HTTP, custom |
| **Relationship** | — | MCP **wraps** REST. Underneath you still `fetch()` the same endpoints |

### Consequences you must internalize
1. A REST endpoint can return 5MB and not care. A tool cannot. **Pagination and field
   projection are mandatory features, not polish.**
2. Descriptions are *prompt engineering*. `description` is read by the model, so write it
   as instructions: when to use, when not to, what the units are.
3. Fewer, richer tools beat many thin ones — both for accuracy of tool choice and for
   round-trip cost.
4. `annotations` (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`)
   change how hosts gate confirmation. Set them honestly.

## 8. Anatomy of a tool definition (target shape)

```ts
{
  name: "cp_search_problems_codeforces",
  title: "Search Codeforces problems",
  description:
    "Find unsolved practice problems on Codeforces inside a difficulty " +
    "band, optionally filtered by tags and excluding problems a handle has already " +
    "solved. Use this for building ladders. Difficulty is on the official Codeforces rating " +
    "scale (800-3500). Returns at most `limit` rows.",
  inputSchema: { /* JSON Schema, generated from Zod */ },
  outputSchema: { /* optional, enables structuredContent validation */ },
  annotations: { readOnlyHint: true, openWorldHint: true, idempotentHint: true }
}
```

## 9. Glossary

- **JSON-RPC 2.0** — the envelope: `{jsonrpc, id?, method, params}`.
- **Capability negotiation** — the `initialize` handshake declaring what each side supports.
- **Streamable HTTP** — single-endpoint HTTP transport with optional SSE upgrade.
- **Structured content** — machine-readable result alongside the text content.
- **Resource link** — a result item pointing at a resource instead of inlining it.
- **Elicitation** — server asks the client to ask the human for input.
- **Sampling** — server asks the client's model to generate text.
