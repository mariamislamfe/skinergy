import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { requireHealthcareRole } from "@/lib/access";
import { getPatientSummaries } from "@/lib/data/patients";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientSearchBar } from "@/components/patients/PatientSearchBar";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Users } from "lucide-react";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  requireHealthcareRole(session.user.role);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Manage patient records and burn cases.</p>
        </div>
        <AddPatientDialog />
      </div>

      <div className="mt-6">
        <PatientSearchBar />
      </div>

      <div className="mt-6">
        <Suspense fallback={<PatientsGridSkeleton />}>
          <PatientsGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function PatientsGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { q } = await searchParams;

  const patients = await getPatientSummaries(session.user.id, session.user.role, { search: q });

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={q ? "No patients match your search" : "No patients yet"}
        description={q ? "Try a different name or patient ID." : "Add your first patient to start tracking burn cases."}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {patients.map((p) => (
        <PatientCard key={p.id} patient={p} />
      ))}
    </div>
  );
}

function PatientsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
