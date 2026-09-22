"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { createPatient } from "@/lib/actions/patients";

export function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createPatient(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.push(`/patients/${res.patientId}`);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Patient
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add new patient" description="Create a patient record to start tracking burn cases.">
        <form action={handleSubmit} className="space-y-3.5">
          <Field label="Full name" name="name" required placeholder="Jane Doe" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" name="age" type="number" placeholder="32" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sex</label>
              <select name="sex" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <Field label="Phone" name="phone" placeholder="+20 100 123 4567" />
          <Field label="Email" name="email" type="email" placeholder="patient@email.com" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency contact" name="emergencyName" placeholder="Name" />
            <Field label="Emergency phone" name="emergencyPhone" placeholder="+20 ..." />
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
              Create patient
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
