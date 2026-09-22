import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDay } from "@/lib/utils";
import { ChevronRight, Flame } from "lucide-react";
import type { PatientSummary } from "@/lib/data/patients";

export function PatientCard({ patient }: { patient: PatientSummary }) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 card-shadow transition-all hover:-translate-y-0.5 hover:border-brand-500/40 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <Avatar name={patient.name} color={patient.avatarColor} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{patient.name}</h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="text-xs text-[var(--muted)]">
            {patient.patientCode}
            {patient.age ? ` · ${patient.age}y` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <Flame className="h-3.5 w-3.5 text-[var(--muted)]" />
        <span className="text-[var(--foreground)]">{patient.primaryLocation ?? "No burn case yet"}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">
          Last scan: {patient.lastScanAt ? formatRelativeDay(patient.lastScanAt) : "—"}
        </p>
        <StatusBadge status={patient.status} pulse />
      </div>

      {patient.caseCount > 1 && (
        <p className="mt-2 text-[11px] font-medium text-brand-600">{patient.caseCount} burn cases</p>
      )}
    </Link>
  );
}
