"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-muted" onClick={logout} disabled={busy}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
