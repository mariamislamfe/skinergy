import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  const isHealthcare =
    session.user.role === "DOCTOR" || session.user.role === "NURSE" || session.user.role === "ADMIN";

  return (
    <AppShell
      userName={session.user.name ?? "User"}
      userRole={session.user.role}
      avatarColor={session.user.avatarColor}
      unreadCount={unreadCount}
      defaultMode={isHealthcare ? "HEALTHCARE" : "PERSONAL"}
    >
      {children}
    </AppShell>
  );
}
