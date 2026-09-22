import { prisma } from "@/lib/prisma";
import { patientScopeWhere } from "@/lib/access";

export async function getDashboardData(userId: string, role: string) {
  const patientWhere = patientScopeWhere(userId, role);

  const [totalPatients, cases, followUpsDueToday, recentScans] = await Promise.all([
    prisma.patient.count({ where: { ...patientWhere, archived: false } }),
    prisma.burnCase.findMany({
      where: { patient: patientWhere, closedAt: null },
      include: { patient: true },
    }),
    prisma.followUp.findMany({
      where: {
        status: "SCHEDULED",
        dueAt: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
        burnCase: { patient: patientWhere },
      },
      include: { burnCase: { include: { patient: true } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.scan.findMany({
      where: { burnCase: { patient: patientWhere } },
      orderBy: { capturedAt: "desc" },
      take: 6,
      include: { assessment: true, burnCase: { include: { patient: true } } },
    }),
  ]);

  const attention = cases.filter((c) => c.status === "ATTENTION").length;
  const followUp = cases.filter((c) => c.status === "FOLLOW_UP").length;
  const monitoring = cases.filter((c) => c.status === "MONITORING").length;

  const recentPatients = await prisma.patient.findMany({
    where: { ...patientWhere, archived: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const attentionCases = cases
    .filter((c) => c.status === "ATTENTION")
    .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
    .slice(0, 5);

  return {
    totalPatients,
    activeCases: cases.length,
    attention,
    followUp,
    monitoring,
    followUpsDueToday,
    recentScans,
    recentPatients,
    attentionCases,
  };
}
