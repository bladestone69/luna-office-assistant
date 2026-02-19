import { redirect } from "next/navigation";

export default function BecomeClientPage() {
  redirect("/admin/login");
}