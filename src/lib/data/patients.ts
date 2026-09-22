import { prisma } from "@/lib/prisma";
import { patientScopeWhere } from "@/lib/access";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export interface PatientSummary {
  id: string;
  patientCode: string;
  name: string;
  age: number | null;
  avatarColor: string;
  archived: boolean;
  primaryLocation: string | null;
  lastScanAt: Date | null;
  status: RiskStatus;
  caseCount: number;
}

const STATUS_RANK: Record<RiskStatus, number> = { MONITORING: 0, FOLLOW_UP: 1, ATTENTION: 2 };

export async function getPatientSummaries(
  userId: string,
  role: string,
  opts?: { search?: string; includeArchived?: boolean }
): Promise<PatientSummary[]> {
  const patients = await prisma.patient.findMany({
    where: {
      ...patientScopeWhere(userId, role),
      archived: opts?.includeArchived ? undefined : false,
      ...(opts?.search
        ? {
            OR: [
              { name: { contains: opts.search } },
              { patientCode: { contains: opts.search } },
            ],
          }
        : {}),
    },
    include: {
      burnCases: {
        orderBy: { openedAt: "desc" },
        include: { scans: { orderBy: { capturedAt: "desc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return patients.map((p) => {
    const activeCases = p.burnCases.filter((c) => !c.closedAt);
    const cases = activeCases.length > 0 ? activeCases : p.burnCases;
    const status = cases.reduce<RiskStatus>((worst, c) => {
      const s = c.status as RiskStatus;
      return STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst;
    }, "MONITORING");

    const lastScanAt = p.burnCases
      .flatMap((c) => c.scans)
      .reduce<Date | null>((latest, s) => (!latest || s.capturedAt > latest ? s.capturedAt : latest), null);

    const mostRecentCase = p.burnCases[0];

    return {
      id: p.id,
      patientCode: p.patientCode,
      name: p.name,
      age: p.age,
      avatarColor: p.avatarColor,
      archived: p.archived,
      primaryLocation: mostRecentCase?.bodyLocation ?? null,
      lastScanAt,
      status,
      caseCount: p.burnCases.length,
    };
  });
}
