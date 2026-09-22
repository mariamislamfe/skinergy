"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { createBurnCase } from "@/lib/actions/cases";

export function NewCaseDialog({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createBurnCase(patientId, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.push(`/patients/${patientId}/cases/${res.caseId}`);
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Burn Case
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New burn case" description="Open a new case to track a distinct burn separately.">
        <form action={handleSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Body location</label>
            <input
              name="bodyLocation"
              required
              placeholder="e.g. Right Hand"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Degree (optional)</label>
            <select
              name="degree"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Unknown</option>
              <option value="First-degree">First-degree</option>
              <option value="Second-degree (superficial partial thickness)">Second-degree (superficial)</option>
              <option value="Second-degree (deep partial thickness)">Second-degree (deep)</option>
              <option value="Third-degree (deep)">Third-degree</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Cause (optional)</label>
            <input
              name="cause"
              placeholder="e.g. Hot water spill"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-fg)]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create case
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
