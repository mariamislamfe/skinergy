import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPatientAccess, requireHealthcareRole } from "@/lib/access";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BurnCaseCard } from "@/components/cases/BurnCaseCard";
import { NewCaseDialog } from "@/components/cases/NewCaseDialog";
import { EditPatientDialog } from "@/components/patients/EditPatientDialog";
import { FamilySection } from "@/components/family/FamilySection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Phone, Mail, ShieldAlert, Flame } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

const STATUS_RANK: Record<RiskStatus, number> = { MONITORING: 0, FOLLOW_UP: 1, ATTENTION: 2 };

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  requireHealthcareRole(session.user.role);

  const patient = await assertPatientAccess(session.user.id, session.user.role, id);
  if (!patient) notFound();

  const [burnCases, familyMembers] = await Promise.all([
    prisma.burnCase.findMany({
      where: { patientId: id },
      orderBy: { openedAt: "desc" },
      include: { scans: { orderBy: { capturedAt: "desc" } } },
    }),
    prisma.familyMember.findMany({ where: { patientId: id }, orderBy: { invitedAt: "asc" } }),
  ]);

  const overallStatus = burnCases.reduce<RiskStatus>((worst, c) => {
    const s = c.status as RiskStatus;
    return STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst;
  }, "MONITORING");

  return (
    <div className="animate-fade-in space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={patient.name} color={patient.avatarColor} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">{patient.name}</h1>
              <StatusBadge status={overallStatus} pulse />
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {patient.patientCode}
              {patient.age ? ` · ${patient.age} years` : ""}
              {patient.sex ? ` · ${patient.sex}` : ""}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {patient.phone && (
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Phone className="h-3.5 w-3.5" /> {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Mail className="h-3.5 w-3.5" /> {patient.email}
                </span>
              )}
              {patient.emergencyName && (
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <ShieldAlert className="h-3.5 w-3.5" /> {patient.emergencyName}
                  {patient.emergencyPhone ? ` · ${patient.emergencyPhone}` : ""}
                </span>
              )}
            </div>
          </div>
          <EditPatientDialog
            patient={{
              id: patient.id,
              name: patient.name,
              age: patient.age,
              sex: patient.sex,
              phone: patient.phone,
              email: patient.email,
              emergencyName: patient.emergencyName,
              emergencyPhone: patient.emergencyPhone,
              archived: patient.archived,
            }}
          />
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Burn Cases</h2>
          <NewCaseDialog patientId={patient.id} />
        </div>

        <div className="mt-4">
          {burnCases.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No burn cases yet"
              description="Create the first burn case to start scanning and tracking progress."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {burnCases.map((c) => (
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
                    scanCount: c.scans.length,
                    lastScanAt: c.scans[0]?.capturedAt ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FamilySection
        patientId={patient.id}
        members={familyMembers.map((m) => ({
          id: m.id,
          name: m.name,
          relation: m.relation,
          phone: m.phone,
          accepted: m.accepted,
          notifyOnNewScan: m.notifyOnNewScan,
          notifyOnFollowUp: m.notifyOnFollowUp,
          notifyOnAttention: m.notifyOnAttention,
        }))}
      />
    </div>
  );
}
