"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CalendarClock, CheckCircle2, Plus } from "lucide-react";
import { scheduleFollowUp, markFollowUpDone } from "@/lib/actions/cases";
import { formatRelativeDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface FollowUpVM {
  id: string;
  dueAt: Date;
  status: "SCHEDULED" | "DONE" | "MISSED";
  note: string | null;
}

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
];

export function FollowUps({ caseId, followUps }: { caseId: string; followUps: FollowUpVM[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function schedulePreset(hours: number) {
    const due = new Date(Date.now() + hours * 3600 * 1000);
    const formData = new FormData();
    formData.set("dueAt", due.toISOString());
    startTransition(async () => {
      await scheduleFollowUp(caseId, formData);
      setOpen(false);
      router.refresh();
    });
  }

  function submitCustom(formData: FormData) {
    startTransition(async () => {
      await scheduleFollowUp(caseId, formData);
      setOpen(false);
      router.refresh();
    });
  }

  function complete(id: string) {
    startTransition(async () => {
      await markFollowUpDone(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">Schedule reminders to re-check this burn.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Schedule
        </Button>
      </div>

      {followUps.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No follow-ups scheduled.</p>
      ) : (
        <div className="space-y-2">
          {followUps.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  f.status === "DONE" ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]" : "bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]"
                )}
              >
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {f.status === "DONE" ? "Completed" : "Due"} {formatRelativeDay(f.dueAt)}
                </p>
                {f.note && <p className="truncate text-xs text-[var(--muted)]">{f.note}</p>}
              </div>
              {f.status !== "DONE" && (
                <Button size="sm" variant="ghost" onClick={() => complete(f.id)} loading={pending}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark done
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule follow-up">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => schedulePreset(p.hours)}
                className="rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-600"
              >
                {p.label}
              </button>
            ))}
          </div>

          <form action={submitCustom} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Custom date</label>
              <input
                type="datetime-local"
                name="dueAt"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Note (optional)</label>
              <input
                name="note"
                placeholder="e.g. Check for infection"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Schedule
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
