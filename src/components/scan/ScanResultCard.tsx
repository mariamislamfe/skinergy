import { Flame, Thermometer, ShieldCheck, AlertTriangle, CheckCircle2, CalendarDays, MapPin } from "lucide-react";
import { formatRelativeDay, formatTime, cn } from "@/lib/utils";
import type { RiskStatus } from "@/components/ui/StatusBadge";

const BANNER_CONFIG: Record<RiskStatus, { title: string; body: string; tone: string; icon: typeof AlertTriangle }> = {
  ATTENTION: {
    title: "Medical Attention Recommended",
    body: "Seek professional medical care.",
    tone: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
    icon: AlertTriangle,
  },
  FOLLOW_UP: {
    title: "Follow-up Recommended",
    body: "Monitor closely and rescan in a few days.",
    tone: "bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]",
    icon: AlertTriangle,
  },
  MONITORING: {
    title: "Continue Home Care",
    body: "No signs of complication — continue monitoring.",
    tone: "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]",
    icon: CheckCircle2,
  },
};

/** The dominant hero element of the results screen — deliberately the
 * single strongest visual on the page, everything else is secondary. */
export function ResultHeroCard({
  degree,
  thickness,
  confidence,
  className,
}: {
  degree: string;
  thickness: string;
  confidence: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in-scale relative overflow-hidden rounded-3xl bg-gradient-to-br from-severity-700 to-severity-900 p-7 text-white shadow-xl shadow-severity-900/25 sm:p-9",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Flame className="h-8 w-8" strokeWidth={2} fill="currentColor" />
        </div>
        <div>
          <p className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{degree} Burn</p>
          <p className="mt-1 text-sm text-white/70 sm:text-base">{thickness}</p>
        </div>
      </div>

      <div className="relative mt-8 flex items-center justify-between border-t border-white/15 pt-5">
        <span className="text-xs font-medium uppercase tracking-wide text-white/60">AI Confidence</span>
        <span className="text-2xl font-bold tabular-nums">{Math.round(confidence)}%</span>
      </div>
      <div className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
          style={{ width: `${Math.round(confidence)}%` }}
        />
      </div>
    </div>
  );
}

export function MetricStatPills({
  temperatureC,
  confidence,
}: {
  temperatureC: number | null;
  confidence: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatPill icon={Thermometer} label="Skin Temperature" value={temperatureC != null ? `${temperatureC.toFixed(1)}°C` : "—"} />
      <StatPill icon={ShieldCheck} label="Confidence" value={`${Math.round(confidence)}%`} />
    </div>
  );
}

export function RecommendationBanner({ severity }: { severity: RiskStatus }) {
  const banner = BANNER_CONFIG[severity];
  const BannerIcon = banner.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl p-4", banner.tone)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/50">
        <BannerIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{banner.title}</p>
        <p className="text-xs opacity-90">{banner.body}</p>
      </div>
    </div>
  );
}

export function FirstAidChecklist({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">First-Aid Guidance</p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CaseHistoryPanel({
  capturedAt,
  bodyLocation,
}: {
  capturedAt: Date;
  bodyLocation: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Case History</p>
      <div className="space-y-1.5 text-sm text-[var(--muted)]">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatRelativeDay(capturedAt)} · {formatTime(capturedAt)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          {bodyLocation}
        </p>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow duration-200 hover:card-shadow">
      <div className="flex items-center gap-1.5 text-[var(--muted)]">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
