"use client";

import styles from "./HomeTab.module.css";
import type { DashboardData } from "@/app/dashboard/types";

type AITabProps = {
  dashboard: DashboardData;
};

export default function AITab({ dashboard }: AITabProps) {
  const statusTone = dashboard.ai.active ? "tag-green" : "tag-amber";

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>AI Assistant</h1>
          <p style={{ fontSize: 13, color: "#6B7B6B", margin: "4px 0 0" }}>
            {dashboard.client.name}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`tag ${statusTone}`} style={{ fontSize: 11 }}>
            {dashboard.ai.active ? "Active" : "Needs setup"}
          </span>
        </div>
      </div>

      <div className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-5 5a5 5 0 0110 0v1H7V10zm2 2v1a2 2 0 004 0v-1h-4z" />
            </svg>
          </div>
          <div>
            <p className={styles.aiTitle}>Hume EVI</p>
            <p className={styles.aiSubtitle}>Voice reception</p>
          </div>
        </div>
        <p className={styles.aiSummary}>
          Your AI receptionist is{" "}
          <strong style={{ color: dashboard.ai.active ? "#4CAF50" : "#F59E0B" }}>
            {dashboard.ai.active ? "online" : "not connected"}
          </strong>
          . {dashboard.ai.primaryNumber ? `Current number: ${dashboard.ai.primaryNumber}.` : "No phone number is connected yet."}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="card" style={{ flex: 1, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5B8DB8" }}>AI agents</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700, color: "#F0F4F8" }}>
              {dashboard.ai.agentCount}
            </p>
          </div>
          <div className="card" style={{ flex: 1, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5B8DB8" }}>Phone numbers</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700, color: "#F0F4F8" }}>
              {dashboard.ai.phoneNumberCount}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Setup</h2>
        {[
          { label: "Primary number", value: dashboard.ai.primaryNumber || "Not assigned" },
          { label: "Lead sync", value: dashboard.ai.hasTrello ? "Lead cards detected" : "No Trello cards linked" },
          { label: "Client plan", value: dashboard.client.plan },
          { label: "Client status", value: dashboard.client.status },
        ].map((item) => (
          <div key={item.label} className="list-row" style={{ borderBottom: "1px solid rgba(76,175,80,0.06)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE6", margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: "#6B7B6B", margin: "2px 0 0" }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
