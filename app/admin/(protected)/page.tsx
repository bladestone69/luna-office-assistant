import { InstructionComposer } from "@/components/admin/InstructionComposer";
import { AdminHumeAssistant } from "@/components/hume/AdminHumeAssistant";
import { SHEET_COLUMNS, SHEET_TABS } from "@/lib/constants";
import { getRecentSheetRecords } from "@/lib/sheets";

export const dynamic = "force-dynamic";

function RecordsTable({
  title,
  records,
  columns,
  exportTab
}: {
  title: string;
  records: Record<string, string>[];
  columns: readonly string[];
  exportTab: "instructions" | "ai_feedback" | "bookings";
}) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <a className="btn btn-muted" href={`/api/admin/export?tab=${exportTab}`}>
          Export CSV
        </a>
      </div>

      {!records.length ? (
        <p className="text-sm text-ink/70">No records available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-ink/15 px-2 py-2 font-semibold text-ink"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, rowIndex) => (
                <tr key={`${record.createdAt || "row"}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column} className="border-b border-ink/10 px-2 py-2 text-ink/85">
                      {record[column] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminDashboardPage() {
  try {
    const [instructions, aiFeedback, bookings] = await Promise.all([
      getRecentSheetRecords(SHEET_TABS.instructions, 40),
      getRecentSheetRecords(SHEET_TABS.aiFeedback, 80),
      getRecentSheetRecords(SHEET_TABS.bookings, 20)
    ]);

    const latestFeedbackByInstruction = new Map<string, Record<string, string>>();
    aiFeedback.forEach((record) => {
      const instructionId = record.instructionId;
      if (instructionId && !latestFeedbackByInstruction.has(instructionId)) {
        latestFeedbackByInstruction.set(instructionId, record);
      }
    });

    const instructionQueue = instructions.map((instruction) => {
      const latest = latestFeedbackByInstruction.get(instruction.instructionId || "");
      return {
        ...instruction,
        status: latest?.status || instruction.status || "pending",
        lastSummary: latest?.summary || "",
        lastUpdateAt: latest?.createdAt || instruction.createdAt || ""
      };
    });

    const queueColumns = [
      ...SHEET_COLUMNS.Instructions,
      "lastSummary",
      "lastUpdateAt"
    ] as const;

    return (
      <div className="space-y-6">
        <InstructionComposer />
        <AdminHumeAssistant />
        <RecordsTable
          title="Instruction Queue"
          records={instructionQueue}
          columns={queueColumns}
          exportTab="instructions"
        />
        <RecordsTable
          title="AI Feedback Feed"
          records={aiFeedback}
          columns={SHEET_COLUMNS.AI_Feedback}
          exportTab="ai_feedback"
        />
        <RecordsTable
          title="Meetings Captured From AI Outcomes"
          records={bookings}
          columns={SHEET_COLUMNS.Bookings}
          exportTab="bookings"
        />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel p-6">
        <h2 className="text-xl font-semibold text-alarm">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-ink/80">
          Could not load Google Sheets data. Check integration setup and environment
          variables.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ink/5 p-3 text-xs text-ink/80">
          {message}
        </pre>
      </section>
    );
  }
}
