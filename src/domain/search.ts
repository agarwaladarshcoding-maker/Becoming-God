import { Problem } from "./types.js";

/**
 * Creates a deterministic Mulberry32 pseudo-random number generator.
 */
export function createPrng(seed: number): () => number {
  let h = seed | 0;
  return function () {
    h = (h + 0x6d2b79f5) | 0;
    let imul = Math.imul(h ^ (h >>> 15), 1 | h);
    imul = (imul + Math.imul(imul ^ (imul >>> 7), 61 | imul)) ^ imul;
    return ((imul ^ (imul >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array deterministically using a seeded Mulberry32 PRNG.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const rand = createPrng(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Ranks candidate problems by:
 * 1. Proximity of difficulty to the band center ascending.
 * 2. Solved count descending (highly solved problems first).
 * 3. Lexicographical ID ascending (stable tie-breaker).
 */
export function rankProblems(
  problems: Problem[],
  minDifficulty: number,
  maxDifficulty: number
): Problem[] {
  const center = (minDifficulty + maxDifficulty) / 2;
  return [...problems].sort((a, b) => {
    const diffA = a.difficulty ?? 0;
    const diffB = b.difficulty ?? 0;
    const distA = Math.abs(diffA - center);
    const distB = Math.abs(diffB - center);

    if (distA !== distB) {
      return distA - distB;
    }

    const solvedA = a.solvedCount ?? 0;
    const solvedB = b.solvedCount ?? 0;
    if (solvedA !== solvedB) {
      return solvedB - solvedA;
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Filters a list of problems based on solved count, solved exclusions, and tags.
 */
export function filterProblems(
  problems: Problem[],
  options: {
    tags?: string[];
    tagMode?: "any" | "all";
    excludeSolvedIds?: Set<string>;
    minSolvedCount?: number;
  }
): Problem[] {
  const {
    tags,
    tagMode = "any",
    excludeSolvedIds,
    minSolvedCount = 0,
  } = options;

  let queryTags: string[] = [];
  if (tags && tags.length > 0) {
    queryTags = tags.map((t) => t.toLowerCase().trim());
  }

  return problems.filter((p) => {
    // 1. Solved count filter
    const solvedCount = p.solvedCount ?? 0;
    if (solvedCount < minSolvedCount) {
      return false;
    }

    // 2. Exclude solved filter
    if (excludeSolvedIds && excludeSolvedIds.has(p.id)) {
      return false;
    }

    // 3. Tag filter
    if (queryTags.length > 0) {
      if (!p.tags || p.tags.length === 0) {
        return false;
      }
      const problemTags = p.tags.map((t) => t.toLowerCase().trim());
      const matches =
        tagMode === "all"
          ? queryTags.every((qt) => problemTags.includes(qt))
          : queryTags.some((qt) => problemTags.includes(qt));
      if (!matches) {
        return false;
      }
    }

    return true;
  });
}
