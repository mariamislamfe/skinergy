"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanVisual } from "@/components/scan/ScanVisual";
import { StatusBadge, ChangeDetectedBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatRelativeDay, formatTime } from "@/lib/utils";
import { GitCompare, Sparkles } from "lucide-react";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export interface TimelineScan {
  id: string;
  label: string;
  capturedAt: Date;
  imageUrl: string | null;
  temperatureC: number | null;
  moistureIdx: number | null;
  rednessIdx: number | null;
  areaCm2: number | null;
  assessment: {
    severity: RiskStatus;
    summary: string;
    aiSummary: string | null;
    changeFlag: boolean;
    burnDegree: string | null;
    confidence: number | null;
  } | null;
}

export function ScanTimeline({ caseId, scans }: { caseId: string; scans: TimelineScan[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function compare() {
    if (selected.length !== 2) return;
    router.push(`/scan/compare?caseId=${caseId}&a=${selected[0]}&b=${selected[1]}`);
  }

  const ordered = [...scans].reverse(); // newest first for display

  return (
    <div>
      {scans.length >= 2 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
          <p className="text-sm text-[var(--muted)]">
            {selected.length === 0
              ? "Select two scans to compare"
              : `${selected.length} scan${selected.length === 1 ? "" : "s"} selected`}
          </p>
          <Button size="sm" variant={selected.length === 2 ? "primary" : "outline"} disabled={selected.length !== 2} onClick={compare}>
            <GitCompare className="h-3.5 w-3.5" />
            Compare Scans
          </Button>
        </div>
      )}

      <div className="relative space-y-6 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border)]">
        {ordered.map((scan, i) => (
          <div key={scan.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div
              className={`absolute -left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] ${
                scan.assessment?.severity === "ATTENTION"
                  ? "bg-[var(--status-danger-dot)]"
                  : scan.assessment?.severity === "FOLLOW_UP"
                  ? "bg-[var(--status-warn-dot)]"
                  : "bg-[var(--status-ok-dot)]"
              }`}
            />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 card-shadow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{scan.label}</p>
                    {scan.assessment?.changeFlag && <ChangeDetectedBadge worse />}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {formatRelativeDay(scan.capturedAt)} · {formatTime(scan.capturedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {scan.assessment && <StatusBadge status={scan.assessment.severity} />}
                  {scans.length >= 2 && (
                    <label className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-2 py-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selected.includes(scan.id)}
                        onChange={() => toggle(scan.id)}
                        className="h-3.5 w-3.5 accent-brand-500"
                      />
                      Compare
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
                <ScanVisual rednessIdx={scan.rednessIdx} temperatureC={scan.temperatureC} imageUrl={scan.imageUrl} />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Metric label="Temp" value={scan.temperatureC != null ? `${scan.temperatureC.toFixed(1)}°C` : "—"} />
                    <Metric label="Redness" value={scan.rednessIdx != null ? scan.rednessIdx.toFixed(0) : "—"} />
                    <Metric label="Moisture" value={scan.moistureIdx != null ? scan.moistureIdx.toFixed(0) : "—"} />
                    <Metric label="Area" value={scan.areaCm2 != null ? `${scan.areaCm2.toFixed(1)} cm²` : "—"} />
                  </div>
                  {scan.assessment?.burnDegree && (
                    <p className="text-xs font-medium text-severity-700">
                      {scan.assessment.burnDegree}
                      {scan.assessment.confidence != null ? ` · ${Math.round(scan.assessment.confidence)}% confidence` : ""}
                    </p>
                  )}
                  {scan.assessment && (
                    <p className="text-sm text-[var(--foreground)]">{scan.assessment.summary}</p>
                  )}
                  {scan.assessment?.aiSummary && (
                    <p className="flex items-start gap-1.5 rounded-xl bg-brand-50 p-2.5 text-xs text-brand-700">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {scan.assessment.aiSummary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-2 py-1.5 text-center">
      <p className="font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
    </div>
  );
}
