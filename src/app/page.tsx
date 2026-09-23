import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isHealthcareRole } from "@/lib/access";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  redirect(isHealthcareRole(session.user.role) ? "/dashboard" : "/home");
}
