import { prisma } from "@/lib/prisma";

export async function getCaseDetail(caseId: string) {
  return prisma.burnCase.findUnique({
    where: { id: caseId },
    include: {
      patient: true,
      scans: {
        orderBy: { capturedAt: "asc" },
        include: { assessment: true },
      },
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      followUps: { orderBy: { dueAt: "asc" } },
      conversations: { orderBy: { updatedAt: "desc" }, take: 5 },
    },
  });
}
