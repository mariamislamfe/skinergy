"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPatientAccess } from "@/lib/access";

const memberSchema = z.object({
  name: z.string().min(2),
  relation: z.string().min(1),
  phone: z.string().optional(),
});

export async function addFamilyMember(patientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const patient = await assertPatientAccess(session.user.id, session.user.role, patientId);
  if (!patient) return { error: "Patient not found." };

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the form fields." };

  await prisma.familyMember.create({
    data: {
      patientId,
      name: parsed.data.name,
      relation: parsed.data.relation,
      phone: parsed.data.phone || null,
      notifyOnNewScan: formData.get("notifyOnNewScan") === "on",
      notifyOnFollowUp: formData.get("notifyOnFollowUp") === "on",
      notifyOnAttention: formData.get("notifyOnAttention") === "on",
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function removeFamilyMember(memberId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member) return { error: "Not found." };
  const patient = await assertPatientAccess(session.user.id, session.user.role, member.patientId);
  if (!patient) return { error: "Not authorized." };

  await prisma.familyMember.delete({ where: { id: memberId } });
  revalidatePath("/profile");
  return { success: true };
}
