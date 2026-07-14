import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth";
import { getClientDesk } from "@/lib/store";
import { ClientDesk } from "@/components/ClientDesk";

export default function DeskPage() {
  const session = getClientSession();
  if (!session?.clientId) redirect("/desk/login");
  const desk = getClientDesk(session.clientId);
  if (!desk) redirect("/desk/login");
  return <ClientDesk initial={desk} />;
}
