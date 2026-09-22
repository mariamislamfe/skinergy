import { prisma } from "@/lib/prisma";

export async function getSelfPatient(userId: string) {
  return prisma.patient.findUnique({
    where: { selfUserId: userId },
    include: {
      burnCases: {
        orderBy: { openedAt: "desc" },
        include: {
          scans: { orderBy: { capturedAt: "desc" }, take: 1, include: { assessment: true } },
          _count: { select: { scans: true } },
        },
      },
      familyMembers: true,
    },
  });
}

export async function getAllScansForPatient(patientId: string) {
  return prisma.scan.findMany({
    where: { burnCase: { patientId } },
    orderBy: { capturedAt: "desc" },
    include: { assessment: true, burnCase: true },
  });
}
