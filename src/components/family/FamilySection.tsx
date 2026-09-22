"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { UserPlus, Trash2, BellRing, CheckCircle2, Clock } from "lucide-react";
import { addFamilyMember, removeFamilyMember } from "@/lib/actions/family";
import { useRouter } from "next/navigation";

export interface FamilyMemberVM {
  id: string;
  name: string;
  relation: string;
  phone: string | null;
  accepted: boolean;
  notifyOnNewScan: boolean;
  notifyOnFollowUp: boolean;
  notifyOnAttention: boolean;
}

export function FamilySection({ patientId, members }: { patientId: string; members: FamilyMemberVM[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addFamilyMember(patientId, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeFamilyMember(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family & Caregivers</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No family members or caregivers added yet. Invite someone trusted to receive updates.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <Avatar name={m.name} size={36} color="#64748b" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-[var(--muted)]">{m.relation}</p>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                    m.accepted
                      ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]"
                      : "bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]"
                  }`}
                >
                  {m.accepted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {m.accepted ? "Accepted" : "Invited"}
                </span>
                <button
                  onClick={() => handleRemove(m.id)}
                  className="rounded-xl p-1.5 text-[var(--muted)] hover:bg-brand-50 hover:text-brand-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite family or caregiver"
        description="They'll be invited to receive updates. Full medical record access requires their own acceptance."
      >
        <form action={handleAdd} className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Mona Hassan"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Relation</label>
              <select
                name="relation"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                placeholder="+20 ..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <BellRing className="h-3.5 w-3.5" /> Notify about
            </p>
            <Checkbox name="notifyOnNewScan" label="New scan completed" defaultChecked />
            <Checkbox name="notifyOnFollowUp" label="Follow-up due" defaultChecked />
            <Checkbox name="notifyOnAttention" label="Needs medical attention" defaultChecked />
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
              Send invite
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded accent-brand-500" />
      {label}
    </label>
  );
}
