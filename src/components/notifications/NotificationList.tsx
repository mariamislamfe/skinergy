"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatRelativeDay, formatTime, cn } from "@/lib/utils";
import { Bell, ScanLine, CalendarClock, AlertTriangle, Users, CheckCheck } from "lucide-react";

export interface NotificationVM {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

const ICONS: Record<string, typeof Bell> = {
  new_scan: ScanLine,
  follow_up: CalendarClock,
  concerning_change: AlertTriangle,
  family_update: Users,
};

export function NotificationList({ notifications }: { notifications: NotificationVM[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />;
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} loading={pending}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <button
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                n.read ? "border-[var(--border)] bg-[var(--surface)]" : "border-brand-500/30 bg-brand-50/40"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  n.type === "concerning_change" ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]" : "bg-brand-50 text-brand-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                </div>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{n.body}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatRelativeDay(n.createdAt)} · {formatTime(n.createdAt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
