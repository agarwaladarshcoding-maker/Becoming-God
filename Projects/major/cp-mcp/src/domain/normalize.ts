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
    maxRating:
      cfUser.maxRating !== undefined ? Number(cfUser.maxRating) : undefined,
    rank: cfUser.rank !== undefined ? String(cfUser.rank) : undefined,
    lastActiveAt: cfUser.lastOnlineTimeSeconds
      ? new Date(cfUser.lastOnlineTimeSeconds * 1000).toISOString()
      : undefined,
    profileUrl: `https://codeforces.com/profile/${cfUser.handle}`,
  };
}

/**
 * Parses a Codeforces problem ID (e.g. "1900C", "cf:1900C") or contest/problemset URL
 * to extract contestId and index.
 */
export function parseCodeforcesProblem(problemStr: string): {
  contestId: number;
  index: string;
} {
  let cleaned = problemStr.trim();

  // If it's a URL
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const url = new URL(cleaned);
      const host = url.hostname;
      if (!host.includes("codeforces.com")) {
        throw new Error("Not a Codeforces URL");
      }
      const pathname = url.pathname;
      // Matches /contest/1900/problem/C or /problemset/problem/1900/C or /gym/1000/problem/A
      const contestMatch = pathname.match(
        /(?:\/contest|\/problemset\/problem|\/gym)\/(\d+)\/problem\/([A-Za-z0-9]+)/i
      );
      if (contestMatch) {
        const contestId = parseInt(contestMatch[1], 10);
        const index = contestMatch[2].toUpperCase();
        return { contestId, index };
      }
      const problemsetMatch = pathname.match(
        /\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/i
      );
      if (problemsetMatch) {
        const contestId = parseInt(problemsetMatch[1], 10);
        const index = problemsetMatch[2].toUpperCase();
        return { contestId, index };
      }
      throw new Error("Could not parse contest ID and index from URL pathname");
    } catch (err) {
      throw new Error(
        `Invalid Codeforces URL: ${problemStr} (${err instanceof Error ? err.message : String(err)})`
      );
    }
  }

  // Strip prefix "cf:" if present
  if (cleaned.toLowerCase().startsWith("cf:")) {
    cleaned = cleaned.slice(3);
  }

  // Matches pattern like 1900C or 1900c or 4A or 1234F2
  const match = cleaned.match(/^(\d+)([A-Za-z0-9]+)$/);
  if (!match) {
    throw new Error(
      `Invalid Codeforces problem ID format: "${problemStr}". Expected formats: "1900C", "cf:1900C", or Codeforces URL.`
    );
  }

  const contestId = parseInt(match[1], 10);
  const index = match[2].toUpperCase();
  return { contestId, index };
}

/**
 * Helper to extract tag and properly balance open/close div tags.
 */
export function extractContainer(
  html: string,
  className: string
): string | null {
  const marker = `class="${className}"`;
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const startIdx = html.lastIndexOf("<div", markerIdx);
  if (startIdx === -1) return null;

  let depth = 0;
  let pos = startIdx;
  while (pos < html.length) {
    if (
      html.substring(pos, pos + 4) === "<div" &&
      /[\s>]/.test(html.charAt(pos + 4))
    ) {
      depth++;
      pos += 4;
    } else if (html.substring(pos, pos + 6) === "</div>") {
      depth--;
      pos += 6;
      if (depth === 0) {
        return html.substring(startIdx, pos);
      }
    } else {
      pos++;
    }
  }
  return null;
}

/**
 * Trims HTML tags, collapses whitespace, and decodes HTML entities for raw pre text.
 */
export function cleanPreText(htmlText: string): string {
  let text = htmlText.replace(/<br\s*\/?>/gi, "\n").substring(0); // copy
  text = text.replace(/<[^>]*>/g, "");
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Parses markdown out of a Codeforces HTML fragment.
 */
export function cleanHtmlToMarkdown(htmlText: string): string {
  if (!htmlText) return "";

  let md = htmlText;

  // Replace list items
  md = md.replace(/<li[^>]*>/gi, "\n* ");
  md = md.replace(/<\/li>/gi, "");
  md = md.replace(/<ul[^>]*>/gi, "\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<ol[^>]*>/gi, "\n");
  md = md.replace(/<\/ol>/gi, "\n");

  // Replace paragraphs and line breaks
  md = md.replace(/<p[^>]*>/gi, "\n\n");
  md = md.replace(/<\/p>/gi, "");
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Replace strong/bold
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");

  // Replace emphasis/italic
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Replace monospace/code spans
  md = md.replace(
    /<span\s+class="tex-font-style-tt"[^>]*>([\s\S]*?)<\/span>/gi,
    "`$1`"
  );
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Replace sub and sup
  md = md.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, "_$1");
  md = md.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, "^$1");

  // Remove all other HTML tags
  md = md.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  md = md
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&le;/g, "≤")
    .replace(/&ge;/g, "≥")
    .replace(/&ne;/g, "≠")
    .replace(/&plusmn;/g, "±")
    .replace(/&times;/g, "×")
    .replace(/&div;/g, "÷")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'");

  // Collapse multiple empty lines
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}

/**
 * Parses a sample-tests block into examples markdown.
 */
function parseSamples(sampleTestsHtml: string): string {
  let md = "### Examples\n\n";
  let pos = 0;

  while (true) {
    const nextInput = sampleTestsHtml.indexOf('class="input"', pos);
    if (nextInput === -1) break;

    const inputDivStart = sampleTestsHtml.lastIndexOf("<div", nextInput);
    if (inputDivStart === -1) break;
    const inputContent = extractContainer(
      sampleTestsHtml.substring(inputDivStart),
      "input"
    );
    if (!inputContent) break;

    const preMatch = inputContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    let sampleInput = preMatch
      ? preMatch[1]
      : inputContent.replace(/<[^>]*>/g, "").trim();

    const nextOutput = sampleTestsHtml.indexOf(
      'class="output"',
      inputDivStart + inputContent.length
    );
    let sampleOutput = "";
    if (nextOutput !== -1) {
      const outputDivStart = sampleTestsHtml.lastIndexOf("<div", nextOutput);
      if (outputDivStart !== -1) {
        const outputContent = extractContainer(
          sampleTestsHtml.substring(outputDivStart),
          "output"
        );
        if (outputContent) {
          const outPreMatch = outputContent.match(
            /<pre[^>]*>([\s\S]*?)<\/pre>/i
          );
          sampleOutput = outPreMatch
            ? outPreMatch[1]
            : outputContent.replace(/<[^>]*>/g, "").trim();
        }
      }
    }

    md += `**Input**\n\`\`\`\n${cleanPreText(sampleInput)}\n\`\`\`\n\n`;
    md += `**Output**\n\`\`\`\n${cleanPreText(sampleOutput)}\n\`\`\`\n\n`;

    pos = inputDivStart + inputContent.length;
  }

  return md;
}

/**
 * Parses Codeforces whole problem statement page.
 */
export function parseCodeforcesStatementHtml(html: string): string | null {
  const statementHtml = extractContainer(html, "problem-statement");
  if (!statementHtml) return null;

  const headerContent = extractContainer(statementHtml, "header");
  const headerEndIdx = headerContent
    ? statementHtml.indexOf(headerContent) + headerContent.length
    : 0;

  const inputSpecIdx = statementHtml.indexOf('class="input-specification"');
  const outputSpecIdx = statementHtml.indexOf('class="output-specification"');
  const sampleTestsIdx = statementHtml.indexOf('class="sample-tests"');
  const noteIdx = statementHtml.indexOf('class="note"');

  const sectionIndexes = [
    inputSpecIdx,
    outputSpecIdx,
    sampleTestsIdx,
    noteIdx,
  ].filter((idx) => idx !== -1);
  const descEndIdx =
    sectionIndexes.length > 0
      ? Math.min(
          ...sectionIndexes.map((idx) => statementHtml.lastIndexOf("<div", idx))
        )
      : statementHtml.length - 6;

  const descriptionHtml = statementHtml.substring(headerEndIdx, descEndIdx);

  const inputSpecContent = extractContainer(
    statementHtml,
    "input-specification"
  );
  const outputSpecContent = extractContainer(
    statementHtml,
    "output-specification"
  );
  const sampleTestsContent = extractContainer(statementHtml, "sample-tests");
  const noteContent = extractContainer(statementHtml, "note");

  const cleanDescription = cleanHtmlToMarkdown(descriptionHtml);
  const cleanInputSpec = inputSpecContent
    ? cleanHtmlToMarkdown(
        inputSpecContent.replace(/<div class="section-title">.*?<\/div>/i, "")
      )
    : "";
  const cleanOutputSpec = outputSpecContent
    ? cleanHtmlToMarkdown(
        outputSpecContent.replace(/<div class="section-title">.*?<\/div>/i, "")
      )
    : "";
  const cleanNote = noteContent
    ? cleanHtmlToMarkdown(
        noteContent.replace(/<div class="section-title">.*?<\/div>/i, "")
      )
    : "";

  const getHeaderField = (htmlContent: string, className: string): string => {
    const div = extractContainer(htmlContent, className);
    if (!div) return "";
    const withoutTitle = div.replace(
      /<div class="property-title">[\s\S]*?<\/div>/gi,
      ""
    );
    return cleanPreText(withoutTitle);
  };

  const title = getHeaderField(headerContent || "", "title");
  const timeLimit = getHeaderField(headerContent || "", "time-limit");
  const memoryLimit = getHeaderField(headerContent || "", "memory-limit");
  const inputFile = getHeaderField(headerContent || "", "input-file");
  const outputFile = getHeaderField(headerContent || "", "output-file");

  let statementMarkdown = "";
  statementMarkdown += `# ${title}\n\n`;
  if (timeLimit) statementMarkdown += `- **Time Limit**: ${timeLimit}\n`;
  if (memoryLimit) statementMarkdown += `- **Memory Limit**: ${memoryLimit}\n`;
  if (inputFile) statementMarkdown += `- **Input File**: ${inputFile}\n`;
  if (outputFile) statementMarkdown += `- **Output File**: ${outputFile}\n\n`;

  statementMarkdown += `## Description\n\n${cleanDescription.trim()}\n\n`;

  if (cleanInputSpec) {
    statementMarkdown += `### Input\n\n${cleanInputSpec.trim()}\n\n`;
  }
  if (cleanOutputSpec) {
    statementMarkdown += `### Output\n\n${cleanOutputSpec.trim()}\n\n`;
  }

  if (sampleTestsContent) {
    statementMarkdown += parseSamples(sampleTestsContent);
  }

  if (cleanNote) {
    statementMarkdown += `### Note\n\n${cleanNote.trim()}\n\n`;
  }

  return statementMarkdown.trim();
}
