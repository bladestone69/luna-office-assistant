"use client";

import styles from "./HomeTab.module.css";

export default function MenuTab() {
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
              { name: "Profile", value: "Sarah", icon: "👤" },
              { name: "Team members", value: "2 active", icon: "👥" },
              { name: "Billing", value: "Free plan", icon: "💳" },
            ],
          },
          {
            label: "Integrations",
            items: [
              { name: "Trello", value: "Connected", icon: "📋" },
              { name: "Twilio", value: "+27 11 012 5874", icon: "📱" },
              { name: "Hume EVI", value: "Active", icon: "🎙" },
              { name: "Google Calendar", value: "Not connected", icon: "📅" },
            ],
          },
          {
            label: "Support",
            items: [
              { name: "Help Center", value: "", icon: "❓" },
              { name: "Contact support", value: "", icon: "💬" },
              { name: "Privacy policy", value: "", icon: "🔒" },
            ],
          },
        ].map((group) => (
          <div key={group.label} style={{ marginBottom: 28 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 8, fontSize: 13, color: "#6B7B6B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {group.label}
            </h2>
            <div className="card" style={{ overflow: "hidden" }}>
              {group.items.map((item, i) => (
                <div
                  key={item.name}
                  className="list-row"
                  style={{
                    borderBottom: i < group.items.length - 1 ? "1px solid rgba(76,175,80,0.06)" : "none",
                  }}
                >
                  <div style={{ fontSize: 20 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE6", margin: 0 }}>{item.name}</p>
                    {item.value && (
                      <p style={{ fontSize: 12, color: "#6B7B6B", margin: "2px 0 0" }}>{item.value}</p>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          style={{ marginTop: 16, background: "rgba(244,67,54,0.15)", color: "#F44336" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
