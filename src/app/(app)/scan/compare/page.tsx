import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCaseAccess } from "@/lib/access";
import { compareScans } from "@/lib/burn-analysis";
import { ScanVisual } from "@/components/scan/ScanVisual";
import { Card, CardContent } from "@/components/ui/Card";
import { ChangeDetectedBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDay, formatTime } from "@/lib/utils";
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default async function ScanComparePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string; a?: string; b?: string }>;
}) {
  const { caseId, a, b } = await searchParams;
  const session = await auth();
  if (!session?.user || !caseId || !a || !b) notFound();

  const access = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!access) notFound();

  const [scanA, scanB] = await Promise.all([
    prisma.scan.findFirst({ where: { id: a, burnCaseId: caseId }, include: { assessment: true } }),
    prisma.scan.findFirst({ where: { id: b, burnCaseId: caseId }, include: { assessment: true } }),
  ]);
  if (!scanA || !scanB) notFound();

  const [previous, current] = scanA.capturedAt <= scanB.capturedAt ? [scanA, scanB] : [scanB, scanA];
  const cmp = compareScans(previous, current);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link
        href={`/patients/${access.patientId}/cases/${caseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to case
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Compare Scans</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{access.bodyLocation} — Case #{access.caseNumber}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScanColumn label="Previous Scan" scan={previous} />
        <ScanColumn label="Current Scan" scan={current} />
      </div>

      <Card className="mt-6">
        <CardContent>
          <h2 className="text-base font-semibold">Measurement Changes</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DeltaStat label="Temperature" delta={cmp.deltas.temperature} unit="°C" />
            <DeltaStat label="Redness" delta={cmp.deltas.redness} unit="" invert />
            <DeltaStat label="Moisture" delta={cmp.deltas.moisture} unit="" />
            <DeltaStat label="Area" delta={cmp.deltas.area} unit=" cm²" invert />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                cmp.trend === "improving"
                  ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]"
                  : cmp.trend === "worsening"
                  ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]"
                  : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              {cmp.trend === "improving" ? (
                <TrendingDown className="h-5 w-5" />
              ) : cmp.trend === "worsening" ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <Minus className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Progress Summary</h3>
              <p className="mt-1 text-sm text-[var(--foreground)]">{cmp.narrative}</p>
              {cmp.changeDetected && (
                <div className="mt-3 flex items-center gap-2">
                  <ChangeDetectedBadge worse />
                  <p className="text-xs text-[var(--muted)]">Professional medical evaluation is recommended.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScanColumn({
  label,
  scan,
}: {
  label: string;
  scan: {
    label: string;
    capturedAt: Date;
    imageUrl: string | null;
    temperatureC: number | null;
    moistureIdx: number | null;
    rednessIdx: number | null;
    areaCm2: number | null;
    assessment: { summary: string; severity: string } | null;
  };
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 text-sm font-medium">
          {formatRelativeDay(scan.capturedAt)} · {formatTime(scan.capturedAt)}
        </p>
        <div className="mt-3">
          <ScanVisual rednessIdx={scan.rednessIdx} temperatureC={scan.temperatureC} imageUrl={scan.imageUrl} />
        </div>
        {scan.assessment && <p className="mt-3 text-sm text-[var(--muted)]">{scan.assessment.summary}</p>}
      </CardContent>
    </Card>
  );
}

function DeltaStat({ label, delta, unit, invert }: { label: string; delta: number | null; unit: string; invert?: boolean }) {
  const positive = delta != null && delta > 0;
  const negative = delta != null && delta < 0;
  const good = invert ? negative : positive;
  const bad = invert ? positive : negative;

  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
      <p
        className={`flex items-center justify-center gap-1 text-lg font-semibold ${
          good ? "text-[var(--status-ok-fg)]" : bad ? "text-[var(--status-danger-fg)]" : ""
        }`}
      >
        {delta == null ? "—" : delta > 0 ? <ArrowRight className="h-4 w-4 rotate-[-45deg]" /> : delta < 0 ? <ArrowRight className="h-4 w-4 rotate-[45deg]" /> : null}
        {delta != null ? `${delta > 0 ? "+" : ""}${delta}${unit}` : "No data"}
      </p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}
