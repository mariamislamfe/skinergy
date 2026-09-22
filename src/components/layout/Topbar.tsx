"use client";

import { Menu, Bell, LogOut, Search } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Topbar({
  userName,
  userRole,
  avatarColor,
  unreadCount,
  title,
}: {
  userName: string;
  userRole: string;
  avatarColor: string;
  unreadCount: number;
  title?: string;
}) {
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="glass no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] px-4 sm:px-6">
      <button
        className="rounded-xl p-2 hover:bg-[var(--surface-2)] lg:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {title ? (
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      ) : (
        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 sm:flex">
          <Search className="h-4 w-4 text-[var(--muted)]" />
          <input
            placeholder="Search patients, cases, scans..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative rounded-xl p-2.5 hover:bg-[var(--surface-2)]"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-[var(--surface-2)]"
          >
            <Avatar name={userName} color={avatarColor} size={32} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{userName}</p>
              <p className="text-[11px] capitalize leading-tight text-[var(--muted)]">
                {userRole.toLowerCase()}
              </p>
            </div>
          </button>

          <div
            className={cn(
              "absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 card-shadow transition-all",
              menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            )}
          >
            <Link
              href="/profile"
              className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
              onClick={() => setMenuOpen(false)}
            >
              View profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-brand-600 hover:bg-brand-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
