import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSelectablePatients, getSelectableDevices } from "@/lib/data/scan-flow";
import { ScanFlow } from "@/components/scan/ScanFlow";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; caseId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { patientId, caseId } = await searchParams;

  const [patients, devices] = await Promise.all([
    getSelectablePatients(session.user.id, session.user.role),
    getSelectableDevices(session.user.id),
  ]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Scan</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Capture a new burn scan and generate an assessment.</p>
      </div>

      <ScanFlow
        patients={patients.map((p) => ({
          id: p.id,
          name: p.name,
          avatarColor: p.avatarColor,
          burnCases: p.burnCases.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            bodyLocation: c.bodyLocation,
            status: c.status,
            scans: c.scans,
          })),
        }))}
        devices={devices}
        initialPatientId={patientId}
        initialCaseId={caseId}
      />
    </div>
  );
}
