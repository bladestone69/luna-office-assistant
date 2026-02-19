import "server-only";
import { google } from "googleapis";
import { requiredEnv } from "@/lib/env";
import { getGoogleJwt } from "@/lib/google-auth";
import type { SheetTab } from "@/lib/constants";

type SheetsRecord = Record<string, string>;

function getSheetsClient() {
  const auth = getGoogleJwt(["https://www.googleapis.com/auth/spreadsheets"]);
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId() {
  return requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

export async function appendSheetRow(tab: SheetTab, values: string[]) {
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
