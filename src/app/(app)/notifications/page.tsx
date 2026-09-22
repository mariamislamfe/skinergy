import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/notifications/NotificationList";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Stay on top of scans, follow-ups, and updates.</p>
      <div className="mt-6">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}
