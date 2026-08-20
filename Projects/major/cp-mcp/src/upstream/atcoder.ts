
import { politeFetch, UpstreamError } from "./http.js";

/**
 * Make a call to the AtCoder Problems API (v3).
 */
export async function acCall<T>(
    endpoint: string,
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
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/${endpoint}${
        queryString ? "?" + queryString : ""
    }`;

    const response = await politeFetch(url);

    if (response.status === 304) {
        throw new Error("Unexpected 304 in acCall");
    }

    let text = "";
    try {
        text = await response.text();
        return JSON.parse(text) as T;
    } catch {
        throw new UpstreamError(
            `Failed to parse AtCoder response: ${text.slice(0, 200)}`,
            response.status,
            false
        );
    }
}
