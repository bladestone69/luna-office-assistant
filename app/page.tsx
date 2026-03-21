"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell, Tab } from "@/components/MobileShell";
import HomeTab from "@/components/tabs/HomeTab";
import CallsTab from "@/components/tabs/CallsTab";
import AITab from "@/components/tabs/AITab";
import MenuTab from "@/components/tabs/MenuTab";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const router = useRouter();

  useEffect(() => {
    // Check if client is logged in — if not, redirect to login
    const clientSession = document.cookie.includes("luna_client_session");
    const adminSession = document.cookie.includes("luna_admin_session");
    if (!clientSession && !adminSession) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <MobileShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && <HomeTab />}
      {activeTab === "calls" && <CallsTab />}
      {activeTab === "ai" && <AITab />}
      {activeTab === "menu" && <MenuTab />}
    </MobileShell>
  );
}
