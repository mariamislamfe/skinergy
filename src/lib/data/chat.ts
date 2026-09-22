import { prisma } from "@/lib/prisma";
import { patientScopeWhere } from "@/lib/access";

export async function getConversationsForCase(caseId: string) {
  return prisma.conversation.findMany({
    where: { burnCaseId: caseId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getConversationWithMessages(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      burnCase: { include: { patient: true } },
    },
  });
}

export async function getRecentConversations(userId: string, role: string, limit = 30) {
  return prisma.conversation.findMany({
    where: { burnCase: { patient: patientScopeWhere(userId, role) } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      burnCase: { include: { patient: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getCasesWithPatientForChat(userId: string, role: string) {
  return prisma.burnCase.findMany({
    where: { patient: patientScopeWhere(userId, role), closedAt: null },
    orderBy: { openedAt: "desc" },
    include: { patient: true },
  });
}
