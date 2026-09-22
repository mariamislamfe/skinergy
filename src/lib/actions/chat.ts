"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCaseAccess } from "@/lib/access";
import { generateAssistantReply, runQuickAction, type AssistantContext, type QuickAction } from "@/lib/ai/assistant";

async function buildContext(caseId: string): Promise<AssistantContext | null> {
  const burnCase = await prisma.burnCase.findUnique({
    where: { id: caseId },
    include: {
      patient: true,
      scans: {
        orderBy: { capturedAt: "asc" },
        include: { assessment: true },
      },
    },
  });
  if (!burnCase) return null;

  return {
    patientName: burnCase.patient.name,
    age: burnCase.patient.age,
    bodyLocation: burnCase.bodyLocation,
    degree: burnCase.degree,
    cause: burnCase.cause,
    status: burnCase.status,
    openedAt: burnCase.openedAt,
    scans: burnCase.scans.map((s) => ({
      label: s.label,
      capturedAt: s.capturedAt,
      temperatureC: s.temperatureC,
      moistureIdx: s.moistureIdx,
      rednessIdx: s.rednessIdx,
      areaCm2: s.areaCm2,
      assessment: s.assessment
        ? { severity: s.assessment.severity, summary: s.assessment.summary, aiSummary: s.assessment.aiSummary }
        : null,
    })),
  };
}

export async function createConversation(caseId: string, title: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const burnCase = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!burnCase) return { error: "Case not found." };

  const convo = await prisma.conversation.create({
    data: { burnCaseId: caseId, title: title.slice(0, 80) || "New conversation" },
  });

  return { success: true, conversationId: convo.id };
}

async function persistExchange(conversationId: string, userText: string, assistantText: string) {
  await prisma.message.create({ data: { conversationId, role: "user", content: userText } });
  const assistantMsg = await prisma.message.create({
    data: { conversationId, role: "assistant", content: assistantText },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return assistantMsg;
}

export async function sendMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return { error: "Conversation not found." };
  const access = await assertCaseAccess(session.user.id, session.user.role, convo.burnCaseId);
  if (!access) return { error: "Not authorized." };

  const ctx = await buildContext(convo.burnCaseId);
  if (!ctx) return { error: "Case not found." };

  const reply = generateAssistantReply(ctx, content);
  const assistantMsg = await persistExchange(conversationId, content, reply);

  revalidatePath(`/chat/${conversationId}`);
  return { success: true, reply, messageId: assistantMsg.id };
}

const QUICK_ACTION_LABELS: Record<QuickAction, string> = {
  explain_burn: "Explain My Burn",
  compare_previous: "Compare With Previous Scan",
  explain_latest: "Explain Latest Assessment",
  care_instructions: "Care Instructions",
  warning_signs: "Warning Signs",
  when_scan_again: "When Should I Scan Again?",
};

export async function sendQuickAction(conversationId: string, action: QuickAction) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return { error: "Conversation not found." };
  const access = await assertCaseAccess(session.user.id, session.user.role, convo.burnCaseId);
  if (!access) return { error: "Not authorized." };

  const ctx = await buildContext(convo.burnCaseId);
  if (!ctx) return { error: "Case not found." };

  const reply = runQuickAction(action, ctx);
  const assistantMsg = await persistExchange(conversationId, QUICK_ACTION_LABELS[action], reply);

  revalidatePath(`/chat/${conversationId}`);
  return { success: true, reply, messageId: assistantMsg.id };
}
