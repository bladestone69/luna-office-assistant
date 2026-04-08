"use client";

import styles from "./HomeTab.module.css";
import type { DashboardData } from "@/app/dashboard/types";

const GREETINGS = [
  "Good morning",
  "Good afternoon",
  "Good evening",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS[0];
  if (hour < 18) return GREETINGS[1];
  return GREETINGS[2];
}

function getDateLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

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
    return "No duration recorded";
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

type HomeTabProps = {
  dashboard: DashboardData;
};

export default function HomeTab({ dashboard }: HomeTabProps) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.name}>{dashboard.user.name}</h1>
        </div>
        <div className={styles.dateBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{getDateLabel()}</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{dashboard.stats.missedCalls}</span>
          <span className={styles.statLabel}>Missed calls</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{dashboard.stats.newLeads}</span>
          <span className={styles.statLabel}>New leads</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{dashboard.stats.totalCalls}</span>
          <span className={styles.statLabel}>Total calls</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Calls</h2>
        </div>

        {dashboard.recentCalls.length ? (
          dashboard.recentCalls.slice(0, 3).map((call) => (
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
            No calls recorded for this client yet.
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Leads</h2>
        </div>

        {dashboard.recentLeads.length ? (
          dashboard.recentLeads.slice(0, 3).map((lead) => (
            <div key={lead.id} className={`${styles.callRow} list-row`}>
              <div className="avatar">{getInitials(lead.name)}</div>
              <div className={styles.callInfo}>
                <p className={styles.callName}>{lead.name}</p>
                <p className={styles.callNumber}>{lead.source} / {lead.phone}</p>
              </div>
              <div className={styles.callRight}>
                <p className={styles.callTime}>{lead.timeLabel}</p>
                <span className="tag tag-green">{lead.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: 16, color: "#5B8DB8", fontSize: 13 }}>
            No leads have been captured yet.
          </div>
        )}
      </div>

      <div className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-5 5a5 5 0 0110 0v1H7V10zm2 2v1a2 2 0 004 0v-1h-4z" />
            </svg>
          </div>
          <div>
            <p className={styles.aiTitle}>AI Receptionist Summary</p>
            <p className={styles.aiSubtitle}>{dashboard.client.name}</p>
          </div>
        </div>
        <p className={styles.aiSummary}>
          {dashboard.ai.active ? "Your AI receptionist is active." : "Your AI receptionist is not configured yet."}{" "}
          It has handled <strong>{dashboard.stats.totalCalls} calls</strong> and captured{" "}
          <strong>{dashboard.stats.newLeads} leads</strong>.{" "}
          {dashboard.ai.primaryNumber
            ? `Primary number: ${dashboard.ai.primaryNumber}.`
            : "No primary phone number is assigned yet."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={`tag ${dashboard.ai.active ? "tag-green" : "tag-amber"}`}>
            {dashboard.ai.active ? "AI active" : "Needs setup"}
          </span>
          <span className="tag tag-green">
            {dashboard.ai.agentCount} agent{dashboard.ai.agentCount === 1 ? "" : "s"}
          </span>
          <span className="tag tag-green">
            {dashboard.team.memberCount} team member{dashboard.team.memberCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
