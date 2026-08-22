import { z } from "zod";
import { cfCall } from "../upstream/codeforces.js";
import { cfUserToProfile } from "../domain/normalize.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { RawCfUser } from "../domain/types.js";
import { resolveHandle } from "../domain/config.js";

export const getUserCodeforcesSchema = z.object({
  handle: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid Codeforces handle format")
    .optional(),
});

type GetUserCodeforcesArgs = z.infer<typeof getUserCodeforcesSchema>;

/**
 * Handler for the cp_get_user_codeforces tool.
 * Fetches user info from Codeforces user.info and returns normalised profile.
 */
export async function handleGetUserCodeforces(args: GetUserCodeforcesArgs) {
  const handle = resolveHandle("codeforces", args.handle);

  try {
    const rawUsers = await cfCall<RawCfUser[]>("user.info", {
      handles: handle,
    });
    if (!rawUsers || rawUsers.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `handle not found on Codeforces - handles are case-insensitive but must match exactly; check spelling.`,
          },
        ],
        isError: true,
      };
    }

    const profile = cfUserToProfile(rawUsers[0]);
    const footer = buildFreshnessFooter({
      source: "live",
      upstreamCalls: 1,
      partial: false,
    });

    const text = [
      `Codeforces Profile: ${profile.handle}`,
      `* Rating: ${profile.rating ?? "Unrated"}${
        profile.maxRating ? ` (max: ${profile.maxRating})` : ""
      }`,
      `* Rank: ${profile.rank ?? "Unrated"}`,
      `* Last Active: ${profile.lastActiveAt ?? "Unknown"}`,
      `* Profile URL: ${profile.profileUrl}`,
      "",
      footer,
    ].join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text,
        },
      ],
      structuredContent: {
        ...profile,
        source: "live",
        upstreamCalls: 1,
        partial: false,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isNotFound = errMsg.toLowerCase().includes("not found");
    const text = isNotFound
      ? `handle not found on Codeforces - handles are case-insensitive but must match exactly; check spelling.`
      : `Failed to fetch user profile: ${errMsg}`;

    return {
      content: [
        {
          type: "text" as const,
          text,
        },
      ],
      isError: true,
    };
  }
}
