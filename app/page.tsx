"use client";

import { useState } from "react";
import { MobileShell, Tab } from "@/components/MobileShell";
import HomeTab from "@/components/tabs/HomeTab";
import CallsTab from "@/components/tabs/CallsTab";
import AITab from "@/components/tabs/AITab";
import MenuTab from "@/components/tabs/MenuTab";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  return (
    <MobileShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && <HomeTab />}
      {activeTab === "calls" && <CallsTab />}
      {activeTab === "ai" && <AITab />}
      {activeTab === "menu" && <MenuTab />}
    </MobileShell>
  );
}
