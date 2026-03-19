"use client";

import styles from "./HomeTab.module.css";

export default function AITab() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>AI Assistant</h1>
          <p style={{ fontSize: 13, color: "#6B7B6B", margin: "4px 0 0" }}>
            Powered by Hume EVI
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="tag tag-green" style={{ fontSize: 11 }}>
            ● Active
          </span>
        </div>
      </div>

      {/* EVI status card */}
      <div className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-5 5a5 5 0 0110 0v1H7V10zm2 2v1a2 2 0 004 0v-1h-4z"/>
            </svg>
          </div>
          <div>
            <p className={styles.aiTitle}>Hume EVI</p>
            <p className={styles.aiSubtitle}>Voice + SMS</p>
          </div>
        </div>
        <p className={styles.aiSummary}>
          Your AI receptionist is <strong style={{ color: "#4CAF50" }}>online</strong> and ready to handle calls and SMS messages.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={styles.aiAction} style={{ flex: 1 }}>Configure</button>
          <button className={styles.aiAction} style={{ flex: 1, borderColor: "rgba(244,67,54,0.3)", color: "#F44336" }}>Pause</button>
        </div>
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Configure</h2>
        {[
          { label: "Voice greeting", value: "Default greeting set", icon: "🎙" },
          { label: "SMS templates", value: "3 templates active", icon: "💬" },
          { label: "Working hours", value: "Mon–Fri, 9am–6pm", icon: "🕐" },
          { label: "Call routing", value: "Voicemail after 3 rings", icon: "📞" },
          { label: "Trello integration", value: "Not connected", icon: "📋", highlight: true },
          { label: "Twilio number", value: "+27 11 012 5874", icon: "📱" },
        ].map((item) => (
          <div key={item.label} className="list-row" style={{ borderBottom: "1px solid rgba(76,175,80,0.06)" }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE6", margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: "#6B7B6B", margin: "2px 0 0" }}>{item.value}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
