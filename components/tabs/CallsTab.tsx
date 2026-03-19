"use client";

import styles from "./HomeTab.module.css";

export default function CallsTab() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>Calls</h1>
          <p style={{ fontSize: 13, color: "#6B7B6B", margin: "4px 0 0" }}>
            12 total · 2 missed
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Incoming", "Outgoing"].map((filter) => (
            <button
              key={filter}
              className={filter === "All" ? "tag tag-green" : styles.seeAll}
              style={{ fontSize: 12, cursor: "pointer" }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today</h2>
        {[
          { name: "Daniel Martin", number: "+27 82 555 0182", time: "10:42 AM", status: "completed", tag: "Completed", avatar: "DM", duration: "2m 14s" },
          { name: "Unknown Caller", number: "+27 11 234 5678", time: "09:15 AM", status: "missed", tag: "Missed", avatar: "??" },
          { name: "Emma Wilson", number: "+27 84 512 9900", time: "Yesterday", status: "completed", tag: "Completed", avatar: "EW", duration: "4m 02s" },
        ].map((call) => (
          <div key={call.number} className={`${styles.callRow} list-row`}>
            <div className="avatar">{call.avatar}</div>
            <div className={styles.callInfo}>
              <p className={styles.callName}>{call.name}</p>
              <p className={styles.callNumber}>{call.number}</p>
            </div>
            <div className={styles.callRight}>
              <p className={styles.callTime}>{call.time}</p>
              <span className={`tag ${call.status === "completed" ? "tag-green" : "tag-red"}`}>{call.tag}</span>
              {call.duration && <p className={styles.callTime}>{call.duration}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Voicemails</h2>
        {[
          { name: "James O'Connor", number: "+27 83 444 7788", time: "Yesterday", avatar: "JO" },
        ].map((vm) => (
          <div key={vm.number} className={`${styles.callRow} list-row`}>
            <div className="avatar">{vm.avatar}</div>
            <div className={styles.callInfo}>
              <p className={styles.callName}>{vm.name}</p>
              <p className={styles.callNumber}>Voicemail · 0:34</p>
            </div>
            <div className={styles.callRight}>
              <span className="tag tag-amber">New</span>
              <button className={styles.aiAction} style={{ fontSize: 11, padding: "4px 10px" }}>Play</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
