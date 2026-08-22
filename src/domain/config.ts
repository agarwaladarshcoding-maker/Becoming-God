/**
 * Resolves the handle to use for a site-scoped tool call.
 *
 * Precedence: an explicit argument always wins; otherwise fall back to the
 * matching env var so the MCP client config can supply a default handle and
 * every tool call can omit it. Throws (never returns a placeholder) when
 * neither is set, so the caller's existing tool-error path can surface an
 * actionable message instead of a Zod "Required" error.
 *
 * process.env is read here, not cached at module load, because tests and
 * MCP clients set these vars after this module is imported.
 */
export function resolveHandle(
  site: "codeforces" | "atcoder",
  explicit?: string
): string {
  const trimmedExplicit = explicit?.trim();
  if (trimmedExplicit) {
    return trimmedExplicit;
  }

  const envVar = site === "codeforces" ? "CP_MCP_CF_HANDLE" : "CP_MCP_AC_HANDLE";
  const fromEnv = process.env[envVar]?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const siteLabel = site === "codeforces" ? "Codeforces" : "AtCoder";
  throw new Error(
    `No ${siteLabel} handle provided. Pass the "handle" argument, or set ${envVar} in your MCP client config.`
  );
}
