
import { Submission, VerificationResult } from "./types.js";

/**
 * Verifies the solved status of problems based on submissions.
 * Logic: solved ⇔ exists a submission with verdict === "OK" and testset === "TESTS" (CF) or result === "AC" (AC).
 */
export function verifySubmissionChain(
    problemId: string,
    problemName: string,
    url: string,
    submissions: Submission[],
    sinceEpoch: number
): VerificationResult {
    let status: "solved" | "attempted" | "untouched" = "untouched";
    let firstAcAt: string | undefined;
    let attempts = 0;
    const distinctVerdicts = new Set<string>();
    let withinWindow = false;

    // Filter submissions for this problem
    const probSubmissions = submissions.filter(s => s.problemId === problemId);

    if (probSubmissions.length > 0) {
        status = "attempted";
        attempts = probSubmissions.length;

        for (const sub of probSubmissions) {
            distinctVerdicts.add(sub.verdict);
            if (sub.verdict === "AC" || (sub.rawVerdict === "OK" && sub.testset === "TESTS")) {
                status = "solved";
                if (!firstAcAt || new Date(sub.at) < new Date(firstAcAt)) {
                    firstAcAt = sub.at;
                }
                if (new Date(sub.at).getTime() / 1000 >= sinceEpoch) {
                    withinWindow = true;
                }
            }
        }
    }

    return {
        problemId,
        problemName,
        url,
        status,
        firstAcAt,
        attempts,
        distinctVerdicts: Array.from(distinctVerdicts),
        withinWindow
    };
}
