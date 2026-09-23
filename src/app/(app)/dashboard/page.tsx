import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireHealthcareRole } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeDay, formatTime } from "@/lib/utils";
import {
  Users,
  Flame,
  CalendarClock,
  AlertTriangle,
  ChevronRight,
  ScanLine,
  Plus,
} from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  requireHealthcareRole(session.user.role);

  const data = await getDashboardData(session.user.id, session.user.role);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Welcome back, {session.user.name?.split(" ")[0]}. Here&apos;s today&apos;s overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/patients">
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
          <Link href="/scan">
            <Button>
              <ScanLine className="h-4 w-4" />
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Patients" value={data.totalPatients} icon={Users} tone="brand" sublabel={`${data.activeCases} active burn cases`} />
        <StatCard label="Needs Attention" value={data.attention} icon={AlertTriangle} tone="danger" />
        <StatCard label="Follow-up Due" value={data.followUp} icon={CalendarClock} tone="warn" />
        <StatCard label="Monitoring" value={data.monitoring} icon={Flame} tone="ok" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <Link href="/patients" className="text-xs font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {data.attentionCases.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No urgent cases right now. Nice work.</p>
              ) : (
                <div className="space-y-2">
                  {data.attentionCases.map((c) => (
                    <Link
                      key={c.id}
                      href={`/patients/${c.patientId}/cases/${c.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-brand-400 hover:bg-brand-50/40"
                    >
                      <Avatar name={c.patient.name} color={c.patient.avatarColor} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.patient.name}</p>
                        <p className="text-xs text-[var(--muted)]">{c.bodyLocation} · Case #{c.caseNumber}</p>
                      </div>
                      <StatusBadge status="ATTENTION" pulse />
                      <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentScans.length === 0 ? (
                <EmptyState icon={ScanLine} title="No scans yet" description="Scans will appear here once captured." />
              ) : (
                <div className="space-y-2">
                  {data.recentScans.map((s) => (
                    <Link
                      key={s.id}
                      href={`/patients/${s.burnCase.patientId}/cases/${s.burnCaseId}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-brand-500/40"
                    >
                      <Avatar name={s.burnCase.patient.name} color={s.burnCase.patient.avatarColor} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{s.burnCase.patient.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {s.label} · {formatRelativeDay(s.capturedAt)} {formatTime(s.capturedAt)}
                        </p>
                      </div>
                      {s.assessment && <StatusBadge status={s.assessment.severity as RiskStatus} />}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {data.followUpsDueToday.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Nothing due today.</p>
              ) : (
                <div className="space-y-2">
                  {data.followUpsDueToday.map((f) => (
                    <Link
                      key={f.id}
                      href={`/patients/${f.burnCase.patientId}/cases/${f.burnCaseId}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2.5 transition hover:border-amber-300"
                    >
                      <Avatar name={f.burnCase.patient.name} color={f.burnCase.patient.avatarColor} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.burnCase.patient.name}</p>
                        <p className="truncate text-xs text-[var(--muted)]">{f.burnCase.bodyLocation}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentPatients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2.5 transition hover:border-brand-500/40"
                  >
                    <Avatar name={p.name} color={p.avatarColor} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-[var(--muted)]">{p.patientCode}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
