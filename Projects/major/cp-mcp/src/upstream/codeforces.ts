import { politeFetch, UpstreamError } from "./http.js";

interface CodeforcesApiResponse {
  status: string;
  comment?: string;
  result: unknown;
}

/**
 * Make a call to the Codeforces API.
 * Detects failures in the response body (status === "FAILED") and handles errors gracefully.
 */
export async function cfCall<T>(
  method: string,
  params?: Record<string, string | number>
): Promise<T> {
  const urlParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        urlParams.append(key, String(value));
      }
    }
  }

  const queryString = urlParams.toString();
  const url = `https://codeforces.com/api/${method}${
    queryString ? "?" + queryString : ""
  }`;

  const response = await politeFetch(url);

  let text: string;
  try {
    text = await response.text();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new UpstreamError(
      `Failed to read response text: ${errMsg}`,
      response.status,
      true
    );
  }

  let json: CodeforcesApiResponse;
  try {
    json = JSON.parse(text) as CodeforcesApiResponse;
  } catch {
    throw new UpstreamError(
      `Failed to parse response JSON: ${text.slice(0, 200)}`,
      response.status,
      false
    );
  }

  if (json.status !== "OK") {
    const comment = json.comment || "Unknown Codeforces API error";
    const isRateLimit = comment.includes("Call limit exceeded");
    throw new UpstreamError(comment, response.status, isRateLimit);
  }

  return json.result as T;
}
export { UpstreamError };
