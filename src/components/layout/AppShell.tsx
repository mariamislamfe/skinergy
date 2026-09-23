"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  userName,
  userRole,
  avatarColor,
  unreadCount,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  avatarColor: string;
  unreadCount: number;
}) {
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="no-print hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <Sidebar role={userRole} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileNavOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 bg-[var(--surface)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar role={userRole} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={userName}
          userRole={userRole}
          avatarColor={avatarColor}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="mx-auto w-full max-w-7xl px-4 py-6 animate-fade-in sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
