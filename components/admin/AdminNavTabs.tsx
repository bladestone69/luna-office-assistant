"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dispatch" },
  { href: "/admin/results", label: "Results" }
] as const;

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-pill ${active ? "nav-pill-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
