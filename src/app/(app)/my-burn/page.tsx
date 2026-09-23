import { auth } from "@/lib/auth";
import { requirePersonalRole } from "@/lib/access";
import { getSelfPatient } from "@/lib/data/personal";
import { BurnCaseCard } from "@/components/cases/BurnCaseCard";
import { NewCaseDialog } from "@/components/cases/NewCaseDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flame } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function MyBurnPage() {
  const session = await auth();
  if (!session?.user) return null;
  requirePersonalRole(session.user.role);

  const patient = await getSelfPatient(session.user.id);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Burn</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">All of your tracked burn cases.</p>
        </div>
        {patient && <NewCaseDialog patientId={patient.id} />}
      </div>

      <div className="mt-6">
        {!patient || patient.burnCases.length === 0 ? (
          <EmptyState icon={Flame} title="No burn cases yet" description="Start a scan to create your first burn case." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {patient.burnCases.map((c) => (
              <BurnCaseCard
                key={c.id}
                patientId={patient.id}
                burnCase={{
                  id: c.id,
                  caseNumber: c.caseNumber,
                  bodyLocation: c.bodyLocation,
                  degree: c.degree,
                  status: c.status as RiskStatus,
                  openedAt: c.openedAt,
                  closedAt: c.closedAt,
                  scanCount: c._count.scans,
                  lastScanAt: c.scans[0]?.capturedAt ?? null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
