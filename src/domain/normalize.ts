import { UserProfile, RawCfUser } from "./types.js";

/**
 * Normalizes a raw Codeforces user object from the API into a domain UserProfile.
 */
export function cfUserToProfile(cfUser: RawCfUser): UserProfile {
  if (!cfUser || typeof cfUser !== "object" || !cfUser.handle) {
    throw new Error("Invalid raw Codeforces user object");
  }

  return {
    site: "codeforces",
    handle: cfUser.handle,
    rating: cfUser.rating !== undefined ? Number(cfUser.rating) : undefined,
    maxRating: cfUser.maxRating !== undefined ? Number(cfUser.maxRating) : undefined,
    rank: cfUser.rank !== undefined ? String(cfUser.rank) : undefined,
    lastActiveAt: cfUser.lastOnlineTimeSeconds
      ? new Date(cfUser.lastOnlineTimeSeconds * 1000).toISOString()
      : undefined,
    profileUrl: `https://codeforces.com/profile/${cfUser.handle}`,
  };
}
