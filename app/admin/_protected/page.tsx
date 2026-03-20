export const dynamic = "force-dynamic";

import Link from "next/link";
import { InstructionComposer } from "@/components/admin/InstructionComposer";
import { isSheetsConfigured } from "@/lib/sheets";

export default function AdminDispatchPage() {
  const sheetsReady = isSheetsConfigured();

  return (
    <div className="animate-fade-up space-y-6">
      {!sheetsReady ? (
        <section className="panel border border-[#C9A84C]/40 bg-[#C9A84C]/10 p-4 text-sm text-[#C9A84C]">
          Google Sheets is not configured. Set{" "}
          <code className="rounded bg-[#C9A84C]/15 px-1.5 py-0.5 font-mono text-xs">
            GOOGLE_SERVICE_ACCOUNT_EMAIL
          </code>
          ,{" "}
          <code className="rounded bg-[#C9A84C]/15 px-1.5 py-0.5 font-mono text-xs">
            GOOGLE_PRIVATE_KEY
          </code>{" "}
          and{" "}
          <code className="rounded bg-[#C9A84C]/15 px-1.5 py-0.5 font-mono text-xs">
            GOOGLE_SHEETS_SPREADSHEET_ID
          </code>{" "}
          to dispatch and track calls.
        </section>
      ) : null}

      <section className="panel p-6">
        <h2 className="font-serif text-2xl font-semibold text-[#F5F0E8]">
          How It Works
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
              Step 1
            </p>
            <p className="mt-2 text-sm text-[#F5F0E8]">
              Paste the numbers you want EVI to call.
            </p>
          </article>
          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
              Step 2
            </p>
            <p className="mt-2 text-sm text-[#F5F0E8]">
              Add your pitch prompt that matches the EVI behavior you configured.
            </p>
          </article>
          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
              Step 3
            </p>
            <p className="mt-2 text-sm text-[#F5F0E8]">
              Open the results screen to monitor status and call outcomes.
            </p>
          </article>
        </div>
      </section>

      <InstructionComposer />

      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#F5F0E8]">
            Need live outcomes?
          </h3>
          <p className="mt-1 text-sm text-[#8A8A8A]">
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
