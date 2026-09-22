"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ScanTimeline, type TimelineScan } from "./ScanTimeline";
import { ClinicalNotes, type NoteVM } from "./ClinicalNotes";
import { FollowUps, type FollowUpVM } from "./FollowUps";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const ProgressChart = dynamic(() => import("./ProgressChart").then((m) => m.ProgressChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const TABS = ["Timeline", "Progress", "Notes", "Follow-ups"] as const;

export function CaseDetailTabs({
  caseId,
  scans,
  notes,
  followUps,
  currentUserId,
  canWrite,
}: {
  caseId: string;
  scans: TimelineScan[];
  notes: NoteVM[];
  followUps: FollowUpVM[];
  currentUserId: string;
  canWrite: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Timeline");

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-[var(--surface-2)] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-[var(--surface)] text-brand-600 shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Timeline" &&
          (scans.length === 0 ? (
            <EmptyTimeline />
          ) : (
            <ScanTimeline caseId={caseId} scans={scans} />
          ))}

        {tab === "Progress" && (
          <Card>
            <CardContent>
              <ProgressChart scans={scans} />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total scans" value={String(scans.length)} />
                <Stat
                  label="Latest redness"
                  value={scans.at(-1)?.rednessIdx != null ? scans.at(-1)!.rednessIdx!.toFixed(0) : "—"}
                />
                <Stat
                  label="Latest area"
                  value={scans.at(-1)?.areaCm2 != null ? `${scans.at(-1)!.areaCm2!.toFixed(1)} cm²` : "—"}
                />
                <Stat
                  label="Latest temp"
                  value={scans.at(-1)?.temperatureC != null ? `${scans.at(-1)!.temperatureC!.toFixed(1)}°C` : "—"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "Notes" && (
          <Card>
            <CardContent>
              <ClinicalNotes caseId={caseId} notes={notes} currentUserId={currentUserId} canWrite={canWrite} />
            </CardContent>
          </Card>
        )}

        {tab === "Follow-ups" && (
          <Card>
            <CardContent>
              <FollowUps caseId={caseId} followUps={followUps} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
      <p className="text-sm font-medium">No scans yet</p>
      <p className="mt-1 text-sm text-[var(--muted)]">Start a scan to begin tracking this burn case.</p>
    </div>
  );
}
