"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./MobileShell.module.css";

// Tab icons as inline SVGs
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 4l9 5.5v9.5a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function PhoneIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.1 1.21 2 2 0 012.08 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.59 8.09a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ShieldIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export type Tab = "home" | "calls" | "ai" | "menu" | "admin";

interface MobileShellProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MobileShell({ activeTab, onTabChange, children }: MobileShellProps) {
  const router = useRouter();
  const [time, setTime] = useState(getTime());

  // Update time periodically
  useState(() => {
    const interval = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(interval);
  });

  function handleAdminClick() {
    router.push("/admin/login");
  }

  return (
    <div className={styles.shell}>
      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusTime}>{time}</span>
        <div className={styles.statusRight}>
          <span className={styles.statusDot} />
          <span className={styles.statusNetwork}>5G</span>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className={styles.wifiIcon}>
            <path d="M8 10.5a.5.5 0 00.5-.5V6a.5.5 0 00-1 0v4a.5.5 0 00.5.5z" />
            <path d="M6.5 8a1.5 1.5 0 013 0 .5.5 0 00-1 0 1 1 0 01-2 0 .5.5 0 00-1 0 1.5 1.5 0 013 0z" opacity=".4" />
            <path d="M3 5.5a8 8 0 0110 0 .5.5 0 00-1 0 7 7 0 00-8 0 .5.5 0 00-1 0z" opacity=".2" />
          </svg>
        </div>
      </div>

      {/* Page content */}
      <div className={styles.content}>{children}</div>

      {/* Bottom nav */}
      <nav className={styles.bottomNav}>
        <button
          className={`${styles.navItem} ${activeTab === "home" ? styles.active : ""}`}
          onClick={() => onTabChange("home")}
        >
          <HomeIcon active={activeTab === "home"} />
          <span>Home</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === "calls" ? styles.active : ""}`}
          onClick={() => onTabChange("calls")}
        >
          <PhoneIcon active={activeTab === "calls"} />
          <span>Calls</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === "ai" ? styles.active : ""}`}
          onClick={() => onTabChange("ai")}
        >
          <ChatIcon active={activeTab === "ai"} />
          <span>AI</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === "menu" ? styles.active : ""}`}
          onClick={() => onTabChange("menu")}
        >
          <MenuIcon active={activeTab === "menu"} />
          <span>Menu</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === "admin" ? styles.active : ""}`}
          onClick={handleAdminClick}
        >
          <ShieldIcon active={activeTab === "admin"} />
          <span>Admin</span>
        </button>
      </nav>
    </div>
  );
}
