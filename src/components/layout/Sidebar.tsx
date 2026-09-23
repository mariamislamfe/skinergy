"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { personalNav, healthcareNav } from "./nav-config";
import { useAppStore } from "@/store/app-store";

const HEALTHCARE_ROLES = new Set(["DOCTOR", "ADMIN"]);

export function Sidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const items = HEALTHCARE_ROLES.has(role) ? healthcareNav : personalNav;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
            <Flame className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Skinergy</span>
        </Link>
        <button
          className="rounded-xl p-1.5 hover:bg-[var(--surface-2)] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                  : "text-[var(--muted)] hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.9} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <p className="text-xs font-semibold">Skinergy Device #001</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-ok-dot)]" />
          <span className="text-[11px] text-[var(--muted)]">Connected · 86% battery</span>
        </div>
      </div>
    </div>
  );
}
