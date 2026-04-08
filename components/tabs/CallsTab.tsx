"use client";

import styles from "./HomeTab.module.css";
import type { DashboardData } from "@/app/dashboard/types";

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function formatDuration(durationSeconds: number) {
  if (!durationSeconds) {
    return "No duration";
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

type CallsTabProps = {
  dashboard: DashboardData;
};

export default function CallsTab({ dashboard }: CallsTabProps) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>Calls</h1>
          <p style={{ fontSize: 13, color: "#6B7B6B", margin: "4px 0 0" }}>
            {dashboard.stats.totalCalls} total / {dashboard.stats.missedCalls} missed
          </p>
        </div>
        <span className="tag tag-green">Recent activity</span>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>All Calls</h2>
        {dashboard.recentCalls.length ? (
          dashboard.recentCalls.map((call) => (
            <div key={call.id} className={`${styles.callRow} list-row`}>
              <div className="avatar">{getInitials(call.name)}</div>
              <div className={styles.callInfo}>
                <p className={styles.callName}>{call.name}</p>
                <p className={styles.callNumber}>{call.number}</p>
              </div>
              <div className={styles.callRight}>
                <p className={styles.callTime}>{call.timeLabel}</p>
                <span
                  className={`tag ${
                    call.outcome === "completed"
                      ? "tag-green"
                      : call.outcome === "missed"
                      ? "tag-red"
                      : "tag-amber"
                  }`}
                >
                  {call.outcome}
                </span>
                <p className={styles.callTime}>{formatDuration(call.durationSeconds)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: 16, color: "#5B8DB8", fontSize: 13 }}>
            No call history is available yet.
          </div>
        )}
      </div>
    </div>
  );
}
