export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, type Booking } from "@/db/schema";
import { DateTime } from "luxon";
import { APP_TIMEZONE } from "@/lib/constants";

function formatWhen(date: Date | null | undefined) {
  if (!date) return "—";
  return DateTime.fromJSDate(date).setZone(APP_TIMEZONE).toFormat("ccc d LLL yyyy, HH:mm");
}

export default async function AdminBookingsPage() {
  let rows: Booking[] = [];
  let error: string | null = null;

  try {
    rows = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.startDateTime))
      .limit(100);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load bookings";
  }

  return (
    <div className="animate-fade-up space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#F5F0E8]">Bookings</h2>
            <p className="mt-1 text-sm text-[#8A8A8A]">
              Self-hosted calendar. All confirmed meetings live in your database.
            </p>
          </div>
          <p className="text-sm text-[#C9A84C]">{rows.length} shown</p>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
            <p className="mt-2 text-xs text-red-200/80">
              If the table does not exist yet, run <code className="font-mono">npm run db:push</code> against this database.
            </p>
          </div>
        ) : null}

        {!error && rows.length === 0 ? (
          <p className="mt-6 text-sm text-[#8A8A8A]">No bookings yet.</p>
        ) : null}

        {rows.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(201,168,76,0.15)] text-xs uppercase tracking-[0.08em] text-[#8A8A8A]">
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[rgba(255,255,255,0.04)] text-[#F5F0E8]"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatWhen(row.startDateTime)}
                      <div className="text-xs text-[#8A8A8A]">
                        to {formatWhen(row.endDateTime)}
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.name || "—"}</td>
                    <td className="px-3 py-3">{row.meetingType}</td>
                    <td className="px-3 py-3">
                      <div>{row.phone || "—"}</div>
                      <div className="text-xs text-[#8A8A8A]">{row.email || ""}</div>
                    </td>
                    <td className="px-3 py-3 capitalize">{row.status || "confirmed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
