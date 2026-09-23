import Link from "next/link";
import { auth } from "@/lib/auth";
import { requirePersonalRole } from "@/lib/access";
import { getSelfPatient } from "@/lib/data/personal";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ChangeDetectedBadge } from "@/components/ui/StatusBadge";
import { ScanVisual } from "@/components/scan/ScanVisual";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeDay } from "@/lib/utils";
import { ScanLine, MessageCircle, MapPin, Flame, Sparkles, ShieldCheck } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;
  requirePersonalRole(session.user.role);

  const patient = await getSelfPatient(session.user.id);
  const activeCases = patient?.burnCases.filter((c) => !c.closedAt) ?? [];
  const primary = activeCases[0];
  const latestScan = primary?.scans[0];

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="animate-fade-in-scale relative overflow-hidden rounded-3xl bg-gradient-to-br from-severity-700 to-severity-900 p-6 text-white shadow-xl shadow-severity-900/25 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-2 text-white/70">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <Flame className="h-4 w-4" fill="currentColor" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest">Skinergy</span>
        </div>

        <h1 className="relative mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Hi {firstName} 👋
        </h1>
        <p className="relative mt-1.5 max-w-md text-sm text-white/70">
          Here&apos;s how your recovery is going — scan, ask, and track it all in one place.
        </p>

        {primary && (
          <div className="relative mt-5 flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              Tracking {activeCases.length} active burn case{activeCases.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAction href="/scan" icon={ScanLine} label="New Scan" />
        <QuickAction href="/chat" icon={MessageCircle} label="Ask AI Assistant" />
        <QuickAction href="/location" icon={MapPin} label="Find Nearby Help" />
      </div>

      {!primary ? (
        <EmptyState
          icon={Flame}
          title="No active burn case"
          description="Start a scan to create your first burn case and begin tracking."
          action={
            <Link href="/scan">
              <Button>
                <ScanLine className="h-4 w-4" />
                Start Scan
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Current burn — Case #{primary.caseNumber}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold">{primary.bodyLocation}</h2>
              </div>
              <StatusBadge status={primary.status as RiskStatus} pulse />
            </div>

            {latestScan ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
                <ScanVisual rednessIdx={latestScan.rednessIdx} temperatureC={latestScan.temperatureC} imageUrl={latestScan.imageUrl} />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Last scan: {formatRelativeDay(latestScan.capturedAt)}</p>
                    {latestScan.assessment?.changeFlag && <ChangeDetectedBadge worse />}
                  </div>
                  {latestScan.assessment && (
                    <>
                      <p className="text-sm text-[var(--foreground)]">{latestScan.assessment.summary}</p>
                      {latestScan.assessment.aiSummary && (
                        <p className="flex items-start gap-1.5 rounded-xl bg-brand-50 p-2.5 text-xs text-brand-700">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {latestScan.assessment.aiSummary}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">No scans recorded yet for this case.</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/patients/${patient!.id}/cases/${primary.id}`}>
                <Button variant="outline" size="sm">
                  View full timeline
                </Button>
              </Link>
              <Link href={`/scan?patientId=${patient!.id}&caseId=${primary.id}`}>
                <Button size="sm">
                  <ScanLine className="h-3.5 w-3.5" />
                  Scan again
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {activeCases.length > 1 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Other Burn Cases</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeCases.slice(1).map((c) => (
              <Link
                key={c.id}
                href={`/patients/${patient!.id}/cases/${c.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 card-shadow transition hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Case #{c.caseNumber} · {c.bodyLocation}</p>
                </div>
                <StatusBadge status={c.status as RiskStatus} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof ScanLine;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 card-shadow"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
