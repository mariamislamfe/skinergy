"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHealthcareRole, assertPatientAccess } from "@/lib/access";

const patientSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().int().positive().optional().nullable(),
  sex: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

async function nextPatientCode() {
  const count = await prisma.patient.count();
  return `SK-${1000 + count + 1}`;
}

export async function createPatient(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isHealthcareRole(session.user.role)) {
    return { error: "Not authorized." };
  }

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the form fields." };

  const colors = ["#9a2c40", "#c65a6e", "#7a2333", "#b3475b", "#5e1a27"];
  const patient = await prisma.patient.create({
    data: {
      patientCode: await nextPatientCode(),
      name: parsed.data.name,
      age: parsed.data.age ?? null,
      sex: parsed.data.sex || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      emergencyName: parsed.data.emergencyName || null,
      emergencyPhone: parsed.data.emergencyPhone || null,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      managedBy: { connect: [{ id: session.user.id }] },
    },
  });

  revalidatePath("/patients");
  return { success: true, patientId: patient.id };
}

export async function updatePatient(patientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const patient = await assertPatientAccess(session.user.id, session.user.role, patientId);
  if (!patient) return { error: "Patient not found." };

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the form fields." };

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      name: parsed.data.name,
      age: parsed.data.age ?? null,
      sex: parsed.data.sex || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      emergencyName: parsed.data.emergencyName || null,
      emergencyPhone: parsed.data.emergencyPhone || null,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/patients");
  return { success: true };
}

export async function setPatientArchived(patientId: string, archived: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const patient = await assertPatientAccess(session.user.id, session.user.role, patientId);
  if (!patient) return { error: "Patient not found." };

  await prisma.patient.update({ where: { id: patientId }, data: { archived } });
  revalidatePath("/patients");
  return { success: true };
}
