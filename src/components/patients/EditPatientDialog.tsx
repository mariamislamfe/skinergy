"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pencil } from "lucide-react";
import { updatePatient, setPatientArchived } from "@/lib/actions/patients";

interface PatientEditable {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  archived: boolean;
}

export function EditPatientDialog({ patient }: { patient: PatientEditable }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updatePatient(patient.id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function toggleArchive() {
    startTransition(async () => {
      await setPatientArchived(patient.id, !patient.archived);
      setOpen(false);
      router.push("/patients");
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit patient">
        <form action={handleSubmit} className="space-y-3.5">
          <Field label="Full name" name="name" defaultValue={patient.name} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" name="age" type="number" defaultValue={patient.age ?? ""} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sex</label>
              <select
                name="sex"
                defaultValue={patient.sex ?? ""}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <Field label="Phone" name="phone" defaultValue={patient.phone ?? ""} />
          <Field label="Email" name="email" type="email" defaultValue={patient.email ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency contact" name="emergencyName" defaultValue={patient.emergencyName ?? ""} />
            <Field label="Emergency phone" name="emergencyPhone" defaultValue={patient.emergencyPhone ?? ""} />
          </div>

          {error && (
            <p className="rounded-xl bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-fg)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={toggleArchive}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {patient.archived ? "Unarchive patient" : "Archive patient"}
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save changes
              </Button>
            </div>
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
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
