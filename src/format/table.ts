/**
 * Formats data into a neat, column-padded markdown table.
 */
export function formatMarkdownTable(
  headers: string[],
  rows: string[][]
): string {
  if (headers.length === 0) {
    return "";
  }

  const numCols = headers.length;
  const colWidths = headers.map((h) => h.length);

  for (const row of rows) {
    for (let i = 0; i < numCols; i++) {
      const val = row[i] !== undefined && row[i] !== null ? String(row[i]) : "";
      if (val.length > colWidths[i]) {
        colWidths[i] = val.length;
      }
    }
  }

  const headerRow =
    "| " + headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ") + " |";
  const separatorRow =
    "| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |";
  const bodyRows = rows.map((row) => {
    const cells = Array.from({ length: numCols }, (_, i) => {
      const val = row[i] !== undefined && row[i] !== null ? String(row[i]) : "";
      return val.padEnd(colWidths[i]);
    });
    return "| " + cells.join(" | ") + " |";
  });

  return [headerRow, separatorRow, ...bodyRows].join("\n");
}
