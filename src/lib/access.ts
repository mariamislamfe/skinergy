import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export function isHealthcareRole(role: string) {
  return role === "DOCTOR" || role === "ADMIN";
}

/** Call at the top of any healthcare-only page (dashboard, patients,
 * reports, ...). Patients get redirected to their personal home instead
 * of ever seeing healthcare-only data or UI. */
export function requireHealthcareRole(role: string): void {
  if (!isHealthcareRole(role)) redirect("/home");
}

/** Call at the top of any personal-only page (home, my-burn, history,
 * ...). Healthcare staff get redirected to their dashboard instead. */
export function requirePersonalRole(role: string): void {
  if (isHealthcareRole(role)) redirect("/dashboard");
}

/**
 * Returns the Prisma `where` clause that scopes patients to what this user is
 * allowed to see: healthcare staff see everyone they manage, patients see
 * only their own linked record. This is the single choke point for patient
 * data isolation — every patient query should go through it.
 */
export function patientScopeWhere(userId: string, role: string) {
  if (isHealthcareRole(role)) {
    return { managedBy: { some: { id: userId } } };
  }
  return { selfUserId: userId };
}

export async function assertPatientAccess(userId: string, role: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, ...patientScopeWhere(userId, role) },
  });
  return patient;
}

export async function assertCaseAccess(userId: string, role: string, caseId: string) {
  const burnCase = await prisma.burnCase.findFirst({
    where: { id: caseId, patient: patientScopeWhere(userId, role) },
    include: { patient: true },
  });
  return burnCase;
}
