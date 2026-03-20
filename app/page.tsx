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
      {activeTab === "admin" && (
        <div className="flex min-h-screen items-center justify-center bg-[#070E1A]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#F0F4F8] mb-2">Admin Panel</h2>
            <p className="text-[#8899A6] text-sm mb-6">Manage your Luna office assistant</p>
            <a href="/admin/login" className="inline-block rounded-xl bg-[#4A90D9] px-6 py-3 font-medium text-white transition-colors hover:bg-[#3a7bc4]">
              Go to Admin Login
            </a>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
