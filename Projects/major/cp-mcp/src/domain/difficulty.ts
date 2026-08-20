export interface AtcoderDifficultyModel {
  difficulty?: number;
  is_experimental?: boolean;
}

export interface NormalizedDifficulty {
  difficulty?: number;
  difficultySource: "estimated" | "unknown";
  difficultyConfidence?: "high" | "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Maps AtCoder Problems' estimated difficulty onto the Codeforces rating scale.
 */
export function atcoderDifficultyToCfScale(difficulty: number): number {
  const adjusted = difficulty < 400 ? 800 + difficulty * 0.5 : difficulty + 400;
  return clamp(Math.round(adjusted / 100) * 100, 800, 3500);
}

/**
 * Normalizes an AtCoder Problems model difficulty into the shared Problem shape.
 */
export function normalizeAtcoderDifficulty(
  model?: AtcoderDifficultyModel
): NormalizedDifficulty {
  if (!model || typeof model.difficulty !== "number") {
    return { difficultySource: "unknown" };
  }

  return {
    difficulty: atcoderDifficultyToCfScale(model.difficulty),
    difficultySource: "estimated",
    difficultyConfidence: model.is_experimental ? "low" : "high",
  };
}
