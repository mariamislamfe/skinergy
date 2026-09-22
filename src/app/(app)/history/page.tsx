import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSelfPatient, getAllScansForPatient } from "@/lib/data/personal";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, ChangeDetectedBadge } from "@/components/ui/StatusBadge";
import { ScanVisual } from "@/components/scan/ScanVisual";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeDay, formatTime } from "@/lib/utils";
import { History as HistoryIcon } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const patient = await getSelfPatient(session.user.id);
  const scans = patient ? await getAllScansForPatient(patient.id) : [];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Every scan across all of your burn cases, most recent first.</p>

      <div className="mt-6">
        {scans.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No scan history yet" description="Your scans will appear here as you track your recovery." />
        ) : (
          <div className="relative space-y-4 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border)]">
            {scans.map((s, i) => (
              <div key={s.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div
                  className={`absolute -left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] ${
                    s.assessment?.severity === "ATTENTION"
                      ? "bg-[var(--status-danger-dot)]"
                      : s.assessment?.severity === "FOLLOW_UP"
                      ? "bg-[var(--status-warn-dot)]"
                      : "bg-[var(--status-ok-dot)]"
                  }`}
                />
                <Link href={`/patients/${patient!.id}/cases/${s.burnCaseId}`}>
                  <Card className="transition hover:border-brand-500/40">
                    <CardContent className="flex flex-col gap-3 sm:flex-row">
                      <ScanVisual
                        rednessIdx={s.rednessIdx}
                        temperatureC={s.temperatureC}
                        className="h-28 w-full sm:h-auto sm:w-32"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{s.burnCase.bodyLocation}</p>
                          <span className="text-xs text-[var(--muted)]">Case #{s.burnCase.caseNumber}</span>
                          {s.assessment?.changeFlag && <ChangeDetectedBadge worse />}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {s.label} · {formatRelativeDay(s.capturedAt)} · {formatTime(s.capturedAt)}
                        </p>
                        {s.assessment && <p className="mt-1.5 text-sm">{s.assessment.summary}</p>}
                      </div>
                      {s.assessment && <StatusBadge status={s.assessment.severity as RiskStatus} />}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
