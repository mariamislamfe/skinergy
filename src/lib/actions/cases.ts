"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPatientAccess, assertCaseAccess, isHealthcareRole } from "@/lib/access";

const caseSchema = z.object({
  bodyLocation: z.string().min(2),
  degree: z.string().optional(),
  cause: z.string().optional(),
});

export async function createBurnCase(patientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const patient = await assertPatientAccess(session.user.id, session.user.role, patientId);
  if (!patient) return { error: "Patient not found." };

  const parsed = caseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the form fields." };

  const existing = await prisma.burnCase.count({ where: { patientId } });
  const caseNumber = String(existing + 1).padStart(3, "0");

  const burnCase = await prisma.burnCase.create({
    data: {
      patientId,
      caseNumber,
      bodyLocation: parsed.data.bodyLocation,
      degree: parsed.data.degree || null,
      cause: parsed.data.cause || null,
      status: "MONITORING",
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: true, caseId: burnCase.id };
}

export async function addClinicalNote(caseId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const burnCase = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!burnCase) return { error: "Case not found." };

  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Note cannot be empty." };

  await prisma.note.create({
    data: {
      burnCaseId: caseId,
      authorId: session.user.id,
      authorName: session.user.name ?? "Unknown",
      content,
    },
  });

  revalidatePath(`/patients/${burnCase.patientId}/cases/${caseId}`);
  return { success: true };
}

export async function deleteClinicalNote(noteId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const note = await prisma.note.findUnique({ where: { id: noteId }, include: { burnCase: true } });
  if (!note) return { error: "Note not found." };
  const access = await assertCaseAccess(session.user.id, session.user.role, note.burnCaseId);
  if (!access) return { error: "Not authorized." };
  if (note.authorId !== session.user.id && !isHealthcareRole(session.user.role)) {
    return { error: "Not authorized." };
  }

  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/patients/${note.burnCase.patientId}/cases/${note.burnCaseId}`);
  return { success: true };
}

const followUpSchema = z.object({
  dueAt: z.coerce.date(),
  note: z.string().optional(),
});

export async function scheduleFollowUp(caseId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const burnCase = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!burnCase) return { error: "Case not found." };

  const parsed = followUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please pick a valid date." };

  await prisma.followUp.create({
    data: { burnCaseId: caseId, dueAt: parsed.data.dueAt, note: parsed.data.note || null },
  });

  revalidatePath(`/patients/${burnCase.patientId}/cases/${caseId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markFollowUpDone(followUpId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId }, include: { burnCase: true } });
  if (!followUp) return { error: "Not found." };
  const access = await assertCaseAccess(session.user.id, session.user.role, followUp.burnCaseId);
  if (!access) return { error: "Not authorized." };

  await prisma.followUp.update({ where: { id: followUpId }, data: { status: "DONE" } });
  revalidatePath(`/patients/${followUp.burnCase.patientId}/cases/${followUp.burnCaseId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
