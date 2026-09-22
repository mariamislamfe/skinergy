import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { assertCaseAccess } from "@/lib/access";
import { getCaseDetail } from "@/lib/data/cases";
import { PrintButton } from "@/components/reports/PrintButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDay, formatTime } from "@/lib/utils";
import { ArrowLeft, Activity } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function ReportPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const access = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!access) notFound();

  const burnCase = await getCaseDetail(caseId);
  if (!burnCase) notFound();

  const firstScan = burnCase.scans[0];
  const latestScan = burnCase.scans[burnCase.scans.length - 1];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to reports
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Skinergy Medical Report</p>
              <p className="text-xs text-[var(--muted)]">Generated {formatRelativeDay(new Date())}</p>
            </div>
          </div>
          <StatusBadge status={burnCase.status as RiskStatus} />
        </div>

        <Section title="Patient Information">
          <Grid>
            <Field label="Name" value={burnCase.patient.name} />
            <Field label="Patient ID" value={burnCase.patient.patientCode} />
            <Field label="Age" value={burnCase.patient.age ? `${burnCase.patient.age} years` : "—"} />
            <Field label="Sex" value={burnCase.patient.sex ?? "—"} />
            <Field label="Phone" value={burnCase.patient.phone ?? "—"} />
            <Field label="Emergency contact" value={burnCase.patient.emergencyName ?? "—"} />
          </Grid>
        </Section>

        <Section title="Burn Case">
          <Grid>
            <Field label="Case number" value={`#${burnCase.caseNumber}`} />
            <Field label="Body location" value={burnCase.bodyLocation} />
            <Field label="Degree" value={burnCase.degree ?? "—"} />
            <Field label="Cause" value={burnCase.cause ?? "—"} />
            <Field label="Opened" value={formatRelativeDay(burnCase.openedAt)} />
            <Field label="Status" value={burnCase.closedAt ? "Closed" : "Active"} />
          </Grid>
        </Section>

        <Section title="Initial Assessment">
          {firstScan?.assessment ? (
            <AssessmentBlock scan={firstScan} />
          ) : (
            <p className="text-sm text-[var(--muted)]">No initial assessment recorded.</p>
          )}
        </Section>

        <Section title="Latest Assessment">
          {latestScan?.assessment ? (
            <AssessmentBlock scan={latestScan} />
          ) : (
            <p className="text-sm text-[var(--muted)]">No assessment recorded.</p>
          )}
        </Section>

        <Section title="Scan History">
          {burnCase.scans.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No scans recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                  <th className="py-1.5 pr-3 font-medium">Date</th>
                  <th className="py-1.5 pr-3 font-medium">Label</th>
                  <th className="py-1.5 pr-3 font-medium">Temp</th>
                  <th className="py-1.5 pr-3 font-medium">Redness</th>
                  <th className="py-1.5 pr-3 font-medium">Area</th>
                  <th className="py-1.5 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {burnCase.scans.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-1.5 pr-3">
                      {formatRelativeDay(s.capturedAt)} {formatTime(s.capturedAt)}
                    </td>
                    <td className="py-1.5 pr-3">{s.label}</td>
                    <td className="py-1.5 pr-3">{s.temperatureC != null ? `${s.temperatureC.toFixed(1)}°C` : "—"}</td>
                    <td className="py-1.5 pr-3">{s.rednessIdx != null ? s.rednessIdx.toFixed(0) : "—"}</td>
                    <td className="py-1.5 pr-3">{s.areaCm2 != null ? `${s.areaCm2.toFixed(1)} cm²` : "—"}</td>
                    <td className="py-1.5">{s.assessment?.severity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Clinical Notes">
          {burnCase.notes.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No clinical notes.</p>
          ) : (
            <div className="space-y-2">
              {burnCase.notes.map((n) => (
                <div key={n.id} className="text-sm">
                  <p className="font-medium">
                    {n.authorName} <span className="font-normal text-[var(--muted)]">— {formatRelativeDay(n.createdAt)} {formatTime(n.createdAt)}</span>
                  </p>
                  <p className="text-[var(--muted)]">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Follow-ups" last>
          {burnCase.followUps.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No follow-ups scheduled.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-[var(--muted)]">
              {burnCase.followUps.map((f) => (
                <li key={f.id}>
                  {formatRelativeDay(f.dueAt)} — {f.status}
                  {f.note ? ` · ${f.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`py-5 ${last ? "" : "border-b border-[var(--border)]"}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">{children}</div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function AssessmentBlock({
  scan,
}: {
  scan: {
    capturedAt: Date;
    temperatureC: number | null;
    rednessIdx: number | null;
    moistureIdx: number | null;
    areaCm2: number | null;
    assessment: { summary: string; severity: string } | null;
  };
}) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{formatRelativeDay(scan.capturedAt)}</p>
      <p className="mt-1 text-sm">{scan.assessment?.summary}</p>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        {scan.temperatureC != null && <span>Temp: {scan.temperatureC.toFixed(1)}°C</span>}
        {scan.rednessIdx != null && <span>Redness: {scan.rednessIdx.toFixed(0)}</span>}
        {scan.moistureIdx != null && <span>Moisture: {scan.moistureIdx.toFixed(0)}</span>}
        {scan.areaCm2 != null && <span>Area: {scan.areaCm2.toFixed(1)} cm²</span>}
      </div>
    </div>
  );
}
