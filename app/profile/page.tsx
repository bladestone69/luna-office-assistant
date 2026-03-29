"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; clientId: string } | null>(null);

  // Current password state
  const [current, setCurrent] = useState("");
  const [fresh, setFresh] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, fresh: false, confirm: false });

  useEffect(() => {
    // Decode session from cookie
    const match = document.cookie.match(/vercelaura_client_session=([^;]+)/);
    if (!match) { router.replace("/login"); return; }
    try {
      const decoded = Buffer.from(match[1], "base64url").toString("utf8");
      const [userId, clientId] = decoded.split("|").slice(0, 2);
      setUser({ name: "Client User", email: "you@example.com", clientId });
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (fresh.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (fresh !== confirm) { setPwError("New passwords do not match"); return; }
    if (!user) return;
    setPwLoading(true);
    try {
      const res = await fetch(`/api/clients/${user.clientId}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: fresh }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Failed"); return; }
      setPwSuccess(true);
      setCurrent(""); setFresh(""); setConfirm("");
    } catch {
      setPwError("Something went wrong");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A1612", color: "#F0EDE6", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", background: "#0A1612" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/" style={{ color: "#6B7B6B", textDecoration: "none", fontSize: 14 }}>← Back</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(76,175,80,0.15)", color: "#4CAF50",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700
          }}>
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{user?.name ?? "Loading…"}</h1>
            <p style={{ fontSize: 13, color: "#6B7B6B", margin: "4px 0 0" }}>{user?.email ?? ""}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        {/* Change Password */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6B7B6B", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Change Password</h2>
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Current password", value: current, set: setCurrent, key: "current" },
              { label: "New password", value: fresh, set: setFresh, key: "fresh" },
              { label: "Confirm new password", value: confirm, set: setConfirm, key: "confirm" },
            ].map((f) => (
              <div key={f.key} style={{ position: "relative" }}>
                <input
                  type={showPass[f.key as keyof typeof showPass] ? "text" : "password"}
                  placeholder={f.label}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "12px 44px 12px 14px",
                    borderRadius: 12, border: "1px solid rgba(76,175,80,0.15)",
                    background: "rgba(76,175,80,0.06)", color: "#F0EDE6",
                    fontSize: 14, boxSizing: "border-box", outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => ({ ...p, [f.key]: !p[f.key as keyof typeof p] }))}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#6B7B6B", cursor: "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPass[f.key as keyof typeof showPass] ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            ))}
            {pwError && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{pwError}</p>}
            {pwSuccess && <p style={{ color: "#4ade80", fontSize: 13, margin: 0 }}>Password updated successfully!</p>}
            <button
              type="submit"
              disabled={pwLoading}
              style={{
                padding: "12px", borderRadius: 12, border: "none",
                background: "#4CAF50", color: "#070E1A",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                opacity: pwLoading ? 0.6 : 1,
              }}
            >
              {pwLoading ? "Saving…" : "Change Password"}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <button
          onClick={() => {
            document.cookie = "vercelaura_client_session=; Max-Age=0; path=/";
            router.replace("/login");
          }}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "1px solid rgba(244,67,54,0.3)",
            background: "rgba(244,67,54,0.1)", color: "#F44336",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
