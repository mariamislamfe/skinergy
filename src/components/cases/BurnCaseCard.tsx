import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDay } from "@/lib/utils";
import { ChevronRight, Flame, Scan as ScanIcon } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export interface BurnCaseSummary {
  id: string;
  caseNumber: string;
  bodyLocation: string;
  degree: string | null;
  status: RiskStatus;
  openedAt: Date;
  closedAt: Date | null;
  scanCount: number;
  lastScanAt: Date | null;
}

export function BurnCaseCard({ patientId, burnCase }: { patientId: string; burnCase: BurnCaseSummary }) {
  return (
    <Link
      href={`/patients/${patientId}/cases/${burnCase.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 card-shadow transition-all hover:-translate-y-0.5 hover:border-brand-500/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Flame className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Case #{burnCase.caseNumber}</p>
          {burnCase.closedAt && (
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
              Closed
            </span>
          )}
        </div>
        <p className="truncate text-sm text-[var(--muted)]">{burnCase.bodyLocation}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <ScanIcon className="h-3 w-3" />
            {burnCase.scanCount} scan{burnCase.scanCount === 1 ? "" : "s"}
          </span>
          <span>Opened {formatRelativeDay(burnCase.openedAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusBadge status={burnCase.status} />
        <ChevronRight className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
