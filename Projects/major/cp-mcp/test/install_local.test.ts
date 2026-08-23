import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  updateConfig,
  entryMatches,
  mergeEntry,
  claudeCodeAddArgs,
  claudeCodeEntryCurrent,
  registerWithClaudeCode,
  readUserScopedEntry,
  type McpServerEntry,
  type CommandRunner,
  type RunResult,
} from "../scripts/install-local.js";

function tmpConfigPath(fixture?: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cp-mcp-install-test-"));
  const configPath = path.join(dir, "config.json");
  if (fixture !== undefined) {
    fs.writeFileSync(configPath, JSON.stringify(fixture, null, 2), "utf8");
  }
  return configPath;
}

const ENTRY: McpServerEntry = {
  command: "/usr/local/bin/node",
  args: ["/repo with spaces/dist/bin/stdio.js"],
  env: { CP_MCP_CF_HANDLE: "AdarshAg" },
};

const OK: RunResult = { status: 0, stdout: "", stderr: "" };

/** Records every argv it is handed, so tests assert on what WOULD be run. */
function recordingRunner(result: RunResult = OK): {
  runner: CommandRunner;
  calls: Array<{ file: string; args: string[] }>;
} {
  const calls: Array<{ file: string; args: string[] }> = [];
  const runner: CommandRunner = (file, args) => {
    calls.push({ file, args });
    return result;
  };
  return { runner, calls };
}

describe("install-local config merge", () => {
  it("preserves unrelated top-level keys (e.g. a large preferences blob)", () => {
    const preferences = { theme: "dark", windows: [{ x: 1, y: 2 }], notes: "x".repeat(500) };
    const configPath = tmpConfigPath({ preferences, otherKey: 42 });

    const result = updateConfig(configPath, ENTRY);
    expect(result.action).toBe("written");

    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
    expect(written["preferences"]).toEqual(preferences);
    expect(written["otherKey"]).toBe(42);
    expect(written["mcpServers"]).toEqual({ "cp-mcp": ENTRY });
  });

  it("preserves another server already present under mcpServers", () => {
    const otherServer = { command: "/bin/other", args: ["--flag"], env: {} };
    const configPath = tmpConfigPath({ mcpServers: { "some-other-server": otherServer } });

    updateConfig(configPath, ENTRY);

    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(written.mcpServers["some-other-server"]).toEqual(otherServer);
    expect(written.mcpServers["cp-mcp"]).toEqual(ENTRY);
  });

  it("re-running with an identical entry reports unchanged and writes no new backup", () => {
    const configPath = tmpConfigPath({ mcpServers: { "cp-mcp": ENTRY } });
    const dir = path.dirname(configPath);

    const result = updateConfig(configPath, ENTRY);
    expect(result.action).toBe("unchanged");
    expect(result.backupPath).toBeNull();

    const backups = fs.readdirSync(dir).filter((f) => f.includes(".bak-"));
    expect(backups).toHaveLength(0);
  });

  it("a malformed config aborts and leaves the original file byte-identical", () => {
    const configPath = tmpConfigPath();
    const malformed = "{ this is not valid json ";
    fs.writeFileSync(configPath, malformed, "utf8");

    expect(() => updateConfig(configPath, ENTRY)).toThrow();

    const after = fs.readFileSync(configPath, "utf8");
    expect(after).toBe(malformed);

    const dir = path.dirname(configPath);
    const backups = fs.readdirSync(dir).filter((f) => f.includes(".bak-"));
    expect(backups).toHaveLength(0);
  });

  it("creates a fresh config with just mcpServers when the file does not exist", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cp-mcp-install-test-"));
    const configPath = path.join(dir, "does-not-exist.json");

    const result = updateConfig(configPath, ENTRY);
    expect(result.action).toBe("created");

    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
    expect(written).toEqual({ mcpServers: { "cp-mcp": ENTRY } });
  });

  it("entryMatches / mergeEntry: a different entry is not considered a match", () => {
    const obj = mergeEntry({}, ENTRY);
    expect(entryMatches(obj, ENTRY)).toBe(true);
    const changed: McpServerEntry = { ...ENTRY, command: "/different/node" };
    expect(entryMatches(obj, changed)).toBe(false);
  });
});

describe("install-local Claude Code registration", () => {
  it("registers at user scope, with paths as separate argv elements", () => {
    const args = claudeCodeAddArgs(ENTRY);

    expect(args.slice(0, 5)).toEqual(["mcp", "add", "--scope", "user", "cp-mcp"]);
    expect(args).toContain("-e");
    expect(args).toContain("CP_MCP_CF_HANDLE=AdarshAg");

    // Everything after `--` is the wrapped command. The stdio path contains a
    // space; it must survive as ONE element, never shell-split.
    const sep = args.indexOf("--");
    expect(sep).toBeGreaterThan(0);
    expect(args.slice(sep + 1)).toEqual([ENTRY.command, ...ENTRY.args]);
  });

  it("an already-registered identical entry is unchanged, with no add call", () => {
    const configPath = tmpConfigPath({ mcpServers: { "cp-mcp": ENTRY } });
    const { runner, calls } = recordingRunner();

    const res = registerWithClaudeCode(ENTRY, configPath, "/usr/bin/claude", runner);

    expect(res.action).toBe("unchanged");
    expect(calls).toHaveLength(0);
  });

  it("a stale entry is removed at user scope before being re-added", () => {
    const stale: McpServerEntry = { ...ENTRY, command: "/old/node" };
    const configPath = tmpConfigPath({ mcpServers: { "cp-mcp": stale } });
    const { runner, calls } = recordingRunner();

    const res = registerWithClaudeCode(ENTRY, configPath, "/usr/bin/claude", runner);

    expect(res.action).toBe("registered");
    expect(calls).toHaveLength(2);
    // Scoped remove: an unscoped one would delete the project-scoped cp-mcp
    // that this repo's own .mcp.json provides.
    expect(calls[0].args).toEqual(["mcp", "remove", "--scope", "user", "cp-mcp"]);
    expect(calls[1].args).toEqual(claudeCodeAddArgs(ENTRY));
  });

  it("a missing claude binary skips without writing the config or throwing", () => {
    const before = { mcpServers: { "some-other": { command: "/x" } }, preferences: { a: 1 } };
    const configPath = tmpConfigPath(before);
    const raw = fs.readFileSync(configPath, "utf8");

    const res = registerWithClaudeCode(ENTRY, configPath, null);

    expect(res.action).toBe("skipped");
    expect(res.detail).toContain("--scope user");
    // The whole point: no fallback hand-edit of a live config.
    expect(fs.readFileSync(configPath, "utf8")).toBe(raw);
  });

  it("a failing claude invocation throws rather than reporting success", () => {
    const configPath = tmpConfigPath({});
    const { runner } = recordingRunner({ status: 1, stdout: "", stderr: "boom" });

    expect(() => registerWithClaudeCode(ENTRY, configPath, "/usr/bin/claude", runner)).toThrow(
      /boom/
    );
  });

  it("readUserScopedEntry tolerates a missing or malformed file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cp-mcp-install-test-"));
    expect(readUserScopedEntry(path.join(dir, "nope.json"))).toBeUndefined();

    const bad = path.join(dir, "bad.json");
    fs.writeFileSync(bad, "{ not json", "utf8");
    expect(readUserScopedEntry(bad)).toBeUndefined();
  });

  it("claudeCodeEntryCurrent compares command and args, ignoring env representation", () => {
    expect(claudeCodeEntryCurrent({ command: ENTRY.command, args: ENTRY.args }, ENTRY)).toBe(true);
    expect(claudeCodeEntryCurrent({ command: "/other", args: ENTRY.args }, ENTRY)).toBe(false);
    expect(claudeCodeEntryCurrent({ command: ENTRY.command, args: [] }, ENTRY)).toBe(false);
    expect(claudeCodeEntryCurrent(undefined, ENTRY)).toBe(false);
  });
});
