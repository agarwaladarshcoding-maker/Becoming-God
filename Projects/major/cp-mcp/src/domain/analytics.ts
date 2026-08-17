export interface RatingHistoryStats {
  peakRating: number;
  peakContest: string;
  peakDate: string;
  bestDelta: number;
  bestDeltaContest: string;
  worstDelta: number;
  worstDeltaContest: string;
  trendText: string;
}

export interface RawCfRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

/**
 * Computes career statistics and trends for Codeforces user rating history.
 */
export function computeCfRatingStats(
  history: RawCfRatingChange[]
): RatingHistoryStats | null {
  if (!history || history.length === 0) {
    return null;
  }

  let peakRating = -Infinity;
  let peakContest = "";
  let peakDate = "";

  let bestDelta = -Infinity;
  let bestDeltaContest = "";

  let worstDelta = Infinity;
  let worstDeltaContest = "";

  for (const change of history) {
    const delta = change.newRating - change.oldRating;
    const dateStr = new Date(change.ratingUpdateTimeSeconds * 1000)
      .toISOString()
      .split("T")[0];

    if (change.newRating > peakRating) {
      peakRating = change.newRating;
      peakContest = change.contestName;
      peakDate = dateStr;
    }

    if (delta > bestDelta) {
      bestDelta = delta;
      bestDeltaContest = change.contestName;
    }

    if (delta < worstDelta) {
      worstDelta = delta;
      worstDeltaContest = change.contestName;
    }
  }

  // Trend over the last 5 contests (or fewer if history is shorter)
  const recentCount = Math.min(5, history.length);
  let trendText = "";
  if (recentCount > 0) {
    const recentChanges = history.slice(-recentCount);
    const startRating = recentChanges[0].oldRating;
    const endRating = recentChanges[recentChanges.length - 1].newRating;
    const overallDelta = endRating - startRating;
    const sign = overallDelta >= 0 ? "+" : "";
    trendText = `${sign}${overallDelta} rating points over the last ${recentCount} contest${
      recentCount === 1 ? "" : "s"
    }`;
  } else {
    trendText = "No recent contests";
  }

  return {
    peakRating,
    peakContest,
    peakDate,
    bestDelta,
    bestDeltaContest,
    worstDelta,
    worstDeltaContest,
    trendText,
  };
}
