import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patientScopeWhere } from "@/lib/access";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import { formatRelativeDay } from "@/lib/utils";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const cases = await prisma.burnCase.findMany({
    where: { patient: patientScopeWhere(session.user.id, session.user.role) },
    include: { patient: true, _count: { select: { scans: true } } },
    orderBy: { openedAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Generate a complete report for any burn case.</p>

      <div className="mt-6">
        {cases.length === 0 ? (
          <EmptyState icon={FileText} title="No burn cases yet" description="Reports become available once a burn case is created." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Case</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scans</th>
                  <th className="px-4 py-3 font-medium">Opened</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.patient.name} color={c.patient.avatarColor} size={28} />
                        <span className="font-medium">{c.patient.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      #{c.caseNumber} · {c.bodyLocation}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status as RiskStatus} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{c._count.scans}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{formatRelativeDay(c.openedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/reports/${c.id}`}>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3.5 w-3.5" />
                          Generate Report
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
