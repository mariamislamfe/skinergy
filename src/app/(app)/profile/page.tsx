import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHealthcareRole } from "@/lib/access";
import { getSelfPatient } from "@/lib/data/personal";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EditPatientDialog } from "@/components/patients/EditPatientDialog";
import { FamilySection } from "@/components/family/FamilySection";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { Mail, ShieldAlert, Phone, Stethoscope } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const healthcare = isHealthcareRole(session.user.role);

  if (healthcare) {
    const [patientCount, activeCaseCount] = await Promise.all([
      prisma.patient.count({ where: { managedBy: { some: { id: session.user.id } }, archived: false } }),
      prisma.burnCase.count({ where: { patient: { managedBy: { some: { id: session.user.id } } }, closedAt: null } }),
    ]);

    return (
      <div className="mx-auto max-w-xl animate-fade-in space-y-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar name={session.user.name ?? "User"} color={session.user.avatarColor} size={64} />
            <div>
              <h1 className="text-lg font-semibold">{session.user.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <Stethoscope className="h-3.5 w-3.5" /> {session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="text-center">
              <p className="text-2xl font-semibold">{patientCount}</p>
              <p className="text-xs text-[var(--muted)]">Patients managed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-2xl font-semibold">{activeCaseCount}</p>
              <p className="text-xs text-[var(--muted)]">Active burn cases</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[var(--muted)]">
              <Mail className="h-3.5 w-3.5" /> {session.user.email}
            </p>
          </CardContent>
        </Card>

        <SignOutButton />
      </div>
    );
  }

  const patient = await getSelfPatient(session.user.id);

  return (
    <div className="mx-auto max-w-xl animate-fade-in space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={session.user.name ?? "User"} color={session.user.avatarColor} size={64} />
            <div>
              <h1 className="text-lg font-semibold">{session.user.name}</h1>
              {patient && <p className="text-sm text-[var(--muted)]">{patient.patientCode}</p>}
            </div>
          </div>
          {patient && (
            <EditPatientDialog
              patient={{
                id: patient.id,
                name: patient.name,
                age: patient.age,
                sex: patient.sex,
                phone: patient.phone,
                email: patient.email,
                emergencyName: patient.emergencyName,
                emergencyPhone: patient.emergencyPhone,
                archived: patient.archived,
              }}
            />
          )}
        </CardContent>
      </Card>

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {patient.phone && (
              <p className="flex items-center gap-2 text-[var(--muted)]">
                <Phone className="h-3.5 w-3.5" /> {patient.phone}
              </p>
            )}
            {patient.email && (
              <p className="flex items-center gap-2 text-[var(--muted)]">
                <Mail className="h-3.5 w-3.5" /> {patient.email}
              </p>
            )}
            {patient.emergencyName && (
              <p className="flex items-center gap-2 text-[var(--muted)]">
                <ShieldAlert className="h-3.5 w-3.5" /> {patient.emergencyName}
                {patient.emergencyPhone ? ` · ${patient.emergencyPhone}` : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {patient && (
        <FamilySection
          patientId={patient.id}
          members={patient.familyMembers.map((m) => ({
            id: m.id,
            name: m.name,
            relation: m.relation,
            phone: m.phone,
            accepted: m.accepted,
            notifyOnNewScan: m.notifyOnNewScan,
            notifyOnFollowUp: m.notifyOnFollowUp,
            notifyOnAttention: m.notifyOnAttention,
          }))}
        />
      )}

      <SignOutButton />
    </div>
  );
}
