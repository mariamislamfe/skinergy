import { prisma } from "@/lib/prisma";
import { patientScopeWhere } from "@/lib/access";

export async function getSelectablePatients(userId: string, role: string) {
  return prisma.patient.findMany({
    where: { ...patientScopeWhere(userId, role), archived: false },
    include: {
      burnCases: {
        where: { closedAt: null },
        orderBy: { openedAt: "desc" },
        select: {
          id: true,
          caseNumber: true,
          bodyLocation: true,
          status: true,
          scans: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: { temperatureC: true, moistureIdx: true, rednessIdx: true, areaCm2: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSelectableDevices(userId: string) {
  return prisma.device.findMany({
    where: { OR: [{ ownerId: userId }, { ownerId: null }] },
    orderBy: { status: "asc" },
  });
}
