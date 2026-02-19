import Link from "next/link";
import { InstructionComposer } from "@/components/admin/InstructionComposer";
import { isSheetsConfigured } from "@/lib/sheets";

export default function AdminDispatchPage() {
  const sheetsReady = isSheetsConfigured();

  return (
    <div className="animate-fade-up space-y-6">
      {!sheetsReady ? (
        <section className="panel border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900">
          Google Sheets is not configured. Set `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
          `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SHEETS_SPREADSHEET_ID` to dispatch and track
          calls.
        </section>
      ) : null}

      <section className="panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Dispatch Flow</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Step 1</p>
            <p className="mt-2 text-sm text-ink/80">Paste the numbers you want EVI to call.</p>
          </article>
          <article className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Step 2</p>
            <p className="mt-2 text-sm text-ink/80">
              Add your pitch prompt that matches the EVI behavior you configured.
            </p>
          </article>
          <article className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Step 3</p>
            <p className="mt-2 text-sm text-ink/80">
              Open the results screen to monitor status and call outcomes.
            </p>
          </article>
        </div>
      </section>

      <InstructionComposer />

      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-ink">Need live outcomes?</h3>
          <p className="mt-1 text-sm text-ink/70">
            The results view combines dispatched instructions with the latest AI feedback.
          </p>
        </div>
        <Link href="/admin/results" className="btn">
          Open Results Screen
        </Link>
      </section>
    </div>
  );
}
