import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getDeskSnapshot } from "@/lib/store";
import { DeskClient } from "@/components/DeskClient";

export default function DashboardPage() {
  if (!isAuthenticated()) {
    redirect("/login");
  }

  const desk = getDeskSnapshot();
  return <DeskClient initial={desk} />;
}
