import "server-only";
import { google } from "googleapis";
import { requiredEnv } from "@/lib/env";
import { getGoogleJwt } from "@/lib/google-auth";
import type { SheetTab } from "@/lib/constants";

type SheetsRecord = Record<string, string>;

const REQUIRED_SHEETS_ENV = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SHEETS_SPREADSHEET_ID"
] as const;

const PLACEHOLDER_PATTERNS: Record<(typeof REQUIRED_SHEETS_ENV)[number], RegExp[]> = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: [/service-account-name@project-id/i],
  GOOGLE_PRIVATE_KEY: [/YOUR_KEY_HERE/i],
  GOOGLE_SHEETS_SPREADSHEET_ID: [/^your-google-sheet-id$/i]
};

let hasWarnedMissingSheetsEnv = false;

export function isSheetsConfigured(): boolean {
  return REQUIRED_SHEETS_ENV.every((name) => {
    const value = process.env[name];
    if (typeof value !== "string") return false;

    const normalized = value.trim();
    if (!normalized) return false;

    const patterns = PLACEHOLDER_PATTERNS[name];
    return !patterns.some((pattern) => pattern.test(normalized));
  });
}

function warnMissingSheetsConfig(context: string) {
  if (hasWarnedMissingSheetsEnv) return;
  hasWarnedMissingSheetsEnv = true;
  console.warn(
    `[sheets] ${context}: Google Sheets env is not configured. ` +
      `Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID.`
  );
}

function getSheetsClient() {
  const auth = getGoogleJwt(["https://www.googleapis.com/auth/spreadsheets"]);
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId() {
  return requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

export async function appendSheetRow(tab: SheetTab, values: string[]) {
  if (!isSheetsConfigured()) {
    warnMissingSheetsConfig(`append ${tab}`);
    return;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values]
    }
  });
}

export async function getSheetRows(tab: SheetTab): Promise<string[][]> {
  if (!isSheetsConfigured()) {
    warnMissingSheetsConfig(`read ${tab}`);
    return [];
  }

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A:Z`
  });

  return response.data.values || [];
}

export async function getRecentSheetRecords(
  tab: SheetTab,
  limit = 20
): Promise<SheetsRecord[]> {
  const rows = await getSheetRows(tab);
  if (!rows.length) return [];

  const headers = rows[0] || [];
  const records = rows.slice(1).map((row) => {
    const record: SheetsRecord = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || "";
    });
    return record;
  });

  return records.reverse().slice(0, limit);
}

export async function getAllSheetRecords(tab: SheetTab): Promise<SheetsRecord[]> {
  const rows = await getSheetRows(tab);
  if (!rows.length) return [];

  const headers = rows[0] || [];
  return rows.slice(1).map((row) => {
    const record: SheetsRecord = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || "";
    });
    return record;
  });
}
