export function toCsv(records: Record<string, string>[]) {
  if (!records.length) return "";

  const headers = Object.keys(records[0]);
  const headerLine = headers.map(escapeCsv).join(",");
  const rows = records.map((record) =>
    headers.map((header) => escapeCsv(record[header] || "")).join(",")
  );

  return [headerLine, ...rows].join("\n");
}

function escapeCsv(value: string) {
  const normalized = value.replace(/\r?\n/g, " ");
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}
