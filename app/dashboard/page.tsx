"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell, Tab } from "@/components/MobileShell";
import HomeTab from "@/components/tabs/HomeTab";
import CallsTab from "@/components/tabs/CallsTab";
import AITab from "@/components/tabs/AITab";
import MenuTab from "@/components/tabs/MenuTab";
import type { DashboardData } from "./types";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/client/dashboard", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return;
          }

          throw new Error(data.error || "Failed to load dashboard");
        }

        if (!cancelled) {
          setDashboard(data as DashboardData);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E1A] px-6 py-10 text-[#F0F4F8]">
        Loading your dashboard...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#070E1A] px-6 py-10 text-[#F0F4F8]">
        {error || "Could not load dashboard."}
      </div>
    );
  }

  return (
    <MobileShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && <HomeTab dashboard={dashboard} />}
      {activeTab === "calls" && <CallsTab dashboard={dashboard} />}
      {activeTab === "ai" && <AITab dashboard={dashboard} />}
      {activeTab === "menu" && <MenuTab dashboard={dashboard} />}
    </MobileShell>
  );
}
