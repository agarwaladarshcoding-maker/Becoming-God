export type Site = "codeforces" | "atcoder";

export interface Problem {
  site: Site;
  id: string;                 // "cf:1900C" | "ac:abc300_c" (globally unique)
  siteId: string;             // "1900C" | "abc300_c"
  name: string;
  url: string;
  contestId: string;          // "1900" | "abc300"
  contestName?: string;
  index?: string;             // "C"
  difficulty?: number;        // normalized to the CF rating scale
  difficultySource: "official" | "estimated" | "unknown";
  difficultyConfidence?: "high" | "low"; // low if is_experimental
  tags: string[];             // CF tags; [] for AtCoder in v1
  solvedCount?: number;
  points?: number;
}

export interface Submission {
  site: Site;
  problemId: string;          // matches Problem.id
  submissionId: string;
  at: string;                 // ISO-8601 UTC
  verdict: "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "OTHER";
  rawVerdict: string;
  language: string;
  participation?: "contest" | "practice" | "virtual" | "other";
  timeMs?: number;
}

export interface UserProfile {
  site: Site;
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  solvedCount?: number;
  lastActiveAt?: string;
  profileUrl: string;
}

export interface VerificationResult {
  problemId: string;
  problemName: string;
  url: string;
  status: "solved" | "attempted" | "untouched";
  firstAcAt?: string;
  attempts: number;
  distinctVerdicts: string[];
  language?: string;
  withinWindow: boolean;      // AC happened inside the requested `since` window
}

export interface RawCfUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  lastOnlineTimeSeconds?: number;
}
