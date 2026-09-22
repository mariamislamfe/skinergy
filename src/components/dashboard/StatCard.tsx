import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "ok" | "warn" | "danger" | "brand";
  sublabel?: string;
}) {
  const tones: Record<typeof tone, string> = {
    default: "bg-[var(--surface-2)] text-[var(--foreground)]",
    ok: "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]",
    warn: "bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]",
    danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
    brand: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 card-shadow animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-[var(--muted)]">{sublabel}</p>}
    </div>
  );
}
