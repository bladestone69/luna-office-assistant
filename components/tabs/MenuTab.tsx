"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./HomeTab.module.css";
import type { DashboardData } from "@/app/dashboard/types";

type MenuTabProps = {
  dashboard: DashboardData;
};

export default function MenuTab({ dashboard }: MenuTabProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>Menu</h1>
        </div>
      </div>

      <div className={styles.section}>
        {[
          {
            label: "Account",
            items: [
              { name: "Profile", value: dashboard.user.name, href: "/profile" },
              { name: "Email", value: dashboard.user.email },
              { name: "Team members", value: `${dashboard.team.memberCount} active` },
            ],
          },
          {
            label: "Workspace",
            items: [
              { name: "Company", value: dashboard.client.name },
              { name: "Plan", value: dashboard.client.plan },
              { name: "Primary number", value: dashboard.ai.primaryNumber || "Not assigned" },
              { name: "AI status", value: dashboard.ai.active ? "Active" : "Needs setup" },
            ],
          },
          {
            label: "Support",
            items: [
              { name: "Industry", value: dashboard.client.industry || "Not set" },
              { name: "Client email", value: dashboard.client.email || "Not set" },
              { name: "Client phone", value: dashboard.client.phone || "Not set" },
            ],
          },
        ].map((group) => (
          <div key={group.label} style={{ marginBottom: 28 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 8, fontSize: 13, color: "#6B7B6B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {group.label}
            </h2>
            <div className="card" style={{ overflow: "hidden" }}>
              {group.items.map((item, index) => {
                const inner = (
                  <div
                    className="list-row"
                    style={{
                      borderBottom: index < group.items.length - 1 ? "1px solid rgba(76,175,80,0.06)" : "none",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE6", margin: 0 }}>{item.name}</p>
                      {item.value ? (
                        <p style={{ fontSize: 12, color: "#6B7B6B", margin: "2px 0 0" }}>{item.value}</p>
                      ) : null}
                    </div>
                    {item.href ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    ) : null}
                  </div>
                );

                return item.href ? (
                  <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={item.name}>{inner}</div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          disabled={signingOut}
          onClick={() => void handleSignOut()}
          style={{ marginTop: 16, background: "rgba(244,67,54,0.15)", color: "#F44336" }}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
