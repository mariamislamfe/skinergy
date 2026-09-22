import { cn } from "@/lib/utils";

export type RiskStatus = "MONITORING" | "FOLLOW_UP" | "ATTENTION";

const CONFIG: Record<
  RiskStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  MONITORING: {
    label: "Monitoring",
    bg: "bg-[var(--status-ok-bg)]",
    fg: "text-[var(--status-ok-fg)]",
    dot: "bg-[var(--status-ok-dot)]",
  },
  FOLLOW_UP: {
    label: "Follow-up Due",
    bg: "bg-[var(--status-warn-bg)]",
    fg: "text-[var(--status-warn-fg)]",
    dot: "bg-[var(--status-warn-dot)]",
  },
  ATTENTION: {
    label: "Needs Attention",
    bg: "bg-[var(--status-danger-bg)]",
    fg: "text-[var(--status-danger-fg)]",
    dot: "bg-[var(--status-danger-dot)]",
  },
};

export function StatusBadge({
  status,
  className,
  pulse = false,
}: {
  status: RiskStatus;
  className?: string;
  pulse?: boolean;
}) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        c.bg,
        c.fg,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          c.dot,
          pulse && status === "ATTENTION" && "animate-pulse-dot"
        )}
      />
      {c.label}
    </span>
  );
}

export function ChangeDetectedBadge({ worse }: { worse: boolean }) {
  if (!worse) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-danger-bg)] px-2.5 py-1 text-xs font-medium text-[var(--status-danger-fg)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      Change Detected
    </span>
  );
}
