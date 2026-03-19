"use client";

import styles from "./HomeTab.module.css";

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

export default function HomeTab() {
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.name}>Sarah</h1>
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

      {/* Quick stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>2</span>
          <span className={styles.statLabel}>Missed calls</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>1</span>
          <span className={styles.statLabel}>New leads</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>12</span>
          <span className={styles.statLabel}>Total calls</span>
        </div>
      </div>

      {/* Today's calls */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Today</h2>
          <button className={styles.seeAll}>See all</button>
        </div>

        {/* Caller rows */}
        {[
          {
            name: "Daniel Martin",
            number: "+27 82 555 0182",
            time: "10:42 AM",
            status: "completed",
            tag: "Completed",
            avatar: "DM",
          },
          {
            name: "Unknown Caller",
            number: "+27 11 234 5678",
            time: "09:15 AM",
            status: "missed",
            tag: "Missed",
            avatar: "??",
          },
          {
            name: "James O'Connor",
            number: "+27 83 444 7788",
            time: "Yesterday",
            status: "voicemail",
            tag: "Voicemail",
            avatar: "JO",
          },
        ].map((call) => (
          <div key={call.number} className={`${styles.callRow} list-row`}>
            <div className="avatar">{call.avatar}</div>
            <div className={styles.callInfo}>
              <p className={styles.callName}>{call.name}</p>
              <p className={styles.callNumber}>{call.number}</p>
            </div>
            <div className={styles.callRight}>
              <p className={styles.callTime}>{call.time}</p>
              <span
                className={`tag ${
                  call.status === "completed"
                    ? "tag-green"
                    : call.status === "missed"
                    ? "tag-red"
                    : "tag-amber"
                }`}
              >
                {call.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Leads</h2>
          <button className={styles.seeAll}>See all</button>
        </div>

        {[
          {
            name: "Emily Thompson",
            source: "Via website form",
            time: "2h ago",
            tag: "New",
            avatar: "ET",
          },
          {
            name: "Mark Reynolds",
            source: "Phone call",
            time: "5h ago",
            tag: "Contacted",
            avatar: "MR",
          },
        ].map((lead) => (
          <div key={lead.name} className={`${styles.callRow} list-row`}>
            <div className="avatar">{lead.avatar}</div>
            <div className={styles.callInfo}>
              <p className={styles.callName}>{lead.name}</p>
              <p className={styles.callNumber}>{lead.source}</p>
            </div>
            <div className={styles.callRight}>
              <span className="tag tag-green">{lead.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI summary card */}
      <div className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-5 5a5 5 0 0110 0v1H7V10zm2 2v1a2 2 0 004 0v-1h-4z" />
            </svg>
          </div>
          <div>
            <p className={styles.aiTitle}>AI Receptionist Summary</p>
            <p className={styles.aiSubtitle}>Last 24 hours</p>
          </div>
        </div>
        <p className={styles.aiSummary}>
          Handled <strong>12 calls</strong>, captured <strong>2 leads</strong>, and sent{" "}
          <strong>1 SMS</strong> follow-up. No urgent items need your attention.
        </p>
        <button className={styles.aiAction}>View full report</button>
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.1 1.21 2 2 0 012.08 1h3a2 2 0 012 1.72c.13 1 .36 1.97.7 2.89a2 2 0 01-.45 2.11L6.59 8.09a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.92.34 1.89.57 2.89.7A2 2 0 0122 16.92z" />
            </svg>
            <span>Test Call</span>
          </button>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Add Lead</span>
          </button>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
            </svg>
            <span>Settings</span>
          </button>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
