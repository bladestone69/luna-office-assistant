import { SHEET_TABS } from "@/lib/constants";
import { getRecentSheetRecords, isSheetsConfigured } from "@/lib/sheets";

export const dynamic = "force-dynamic";

type StatusTone =
  | "status-pending"
  | "status-in_progress"
  | "status-completed"
  | "status-failed"
  | "status-needs_follow_up";

function toneForStatus(status: string): StatusTone {
  if (status === "completed") return "status-completed";
  if (status === "failed") return "status-failed";
  if (status === "in_progress") return "status-in_progress";
  if (status === "needs_follow_up") return "status-needs_follow_up";
  return "status-pending";
}

function clean(value: string) {
  return value?.trim() || "-";
}

function clip(value: string, length = 120) {
  const normalized = clean(value);
  if (normalized === "-" || normalized.length <= length) return normalized;
  return `${normalized.slice(0, length)}...`;
}

export default async function AdminResultsPage() {
  const sheetsReady = isSheetsConfigured();
  if (!sheetsReady) {
    return (
      <section className="panel p-6">
        <h2 className="font-serif text-2xl font-semibold text-[#F5F0E8]">Results</h2>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Google Sheets is not configured yet. Add environment variables to start tracking
          outcomes.
        </p>
      </section>
    );
  }

  try {
    const [instructions, feedback] = await Promise.all([
      getRecentSheetRecords(SHEET_TABS.instructions, 500),
      getRecentSheetRecords(SHEET_TABS.aiFeedback, 1000)
    ]);

    const latestFeedbackByInstruction = new Map<string, Record<string, string>>();
    feedback.forEach((row) => {
      const instructionId = row.instructionId || "";
      if (instructionId && !latestFeedbackByInstruction.has(instructionId)) {
        latestFeedbackByInstruction.set(instructionId, row);
      }
    });

    const rows = instructions.map((instruction) => {
      const instructionId = instruction.instructionId || "";
      const latest = latestFeedbackByInstruction.get(instructionId);
      const status = latest?.status || instruction.status || "pending";

      return {
        instructionId,
        campaignName: instruction.clientName || "-",
        phoneNumber: instruction.clientPhone || "-",
        pitchPrompt: instruction.instructionText || "-",
        status,
        summary: latest?.summary || "",
        nextAction: latest?.nextAction || "",
        updatedAt: latest?.createdAt || instruction.createdAt || ""
      };
    });

    const stats = {
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      inProgress: rows.filter((row) => row.status === "in_progress").length,
      completed: rows.filter((row) => row.status === "completed").length,
      failed: rows.filter((row) => row.status === "failed").length
    };

    return (
      <div className="animate-fade-up space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="panel p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#8A8A8A]">Total</p>
            <p className="mt-2 text-3xl font-bold text-[#F5F0E8]">{stats.total}</p>
          </article>
          <article className="panel p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#8A8A8A]">Pending</p>
            <p className="mt-2 text-3xl font-bold text-[#F5F0E8]">{stats.pending}</p>
          </article>
          <article className="panel p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#8A8A8A]">In Progress</p>
            <p className="mt-2 text-3xl font-bold text-[#F5F0E8]">{stats.inProgress}</p>
          </article>
          <article className="panel p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#8A8A8A]">Completed</p>
            <p className="mt-2 text-3xl font-bold text-[#F5F0E8]">{stats.completed}</p>
          </article>
          <article className="panel p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#8A8A8A]">Failed</p>
            <p className="mt-2 text-3xl font-bold text-[#F5F0E8]">{stats.failed}</p>
          </article>
        </section>

        <section className="panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#F5F0E8]">Call Results</h2>
              <p className="mt-1 text-sm text-[#8A8A8A]">
                Latest AI feedback per dispatched number.
              </p>
            </div>
            <div className="flex gap-2">
              <a className="btn btn-muted" href="/api/admin/export?tab=instructions">
                Export Dispatches
              </a>
              <a className="btn btn-muted" href="/api/admin/export?tab=ai_feedback">
                Export Feedback
              </a>
            </div>
          </div>

          {!rows.length ? (
            <p className="text-sm text-[#8A8A8A]">No results yet. Dispatch calls to begin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Campaign
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Number
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Prompt
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Status
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Summary
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Next Action
                    </th>
                    <th className="border-b border-[rgba(201,168,76,0.15)] px-3 py-2 font-semibold text-[#8A8A8A]">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.instructionId || "row"}-${index}`} className="align-top">
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#F5F0E8]">
                        {clean(row.campaignName)}
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#F5F0E8]">
                        {clean(row.phoneNumber)}
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#8A8A8A]">
                        {clip(row.pitchPrompt, 100)}
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3">
                        <span className={`status-pill ${toneForStatus(row.status)}`}>
                          {clean(row.status).replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#F5F0E8]">
                        {clip(row.summary, 110)}
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#8A8A8A]">
                        {clip(row.nextAction, 80)}
                      </td>
                      <td className="border-b border-[rgba(201,168,76,0.08)] px-3 py-3 text-[#8A8A8A]">
                        {clean(row.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel p-6">
        <h2 className="font-serif text-2xl font-semibold text-red-400">Results unavailable</h2>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Could not load instruction and feedback records.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-red-900/40 bg-red-900/20 p-3 text-xs text-red-300">
          {message}
        </pre>
      </section>
    );
  }
}
