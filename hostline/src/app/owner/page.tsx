import { redirect } from "next/navigation";
import { isOwnerAuthenticated } from "@/lib/auth";
import { getOwnerSnapshot } from "@/lib/store";
import { OwnerConsole } from "@/components/OwnerConsole";

export default function OwnerPage() {
  if (!isOwnerAuthenticated()) redirect("/owner/login");
  return <OwnerConsole initial={getOwnerSnapshot()} />;
}
