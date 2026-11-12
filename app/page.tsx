import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveClientSession } from "@/lib/client-access";
import LandingPage from "@/components/marketing/LandingPage";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { CLIENT_COOKIE } from "@/lib/client-session";

export default async function Page() {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  if (await verifyAdminSession(adminToken)) {
    redirect("/admin");
  }

  const clientToken = cookieStore.get(CLIENT_COOKIE)?.value;
  if (await resolveClientSession(clientToken)) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
