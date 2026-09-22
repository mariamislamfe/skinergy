"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Trash2 } from "lucide-react";
import { addClinicalNote, deleteClinicalNote } from "@/lib/actions/cases";
import { formatRelativeDay, formatTime } from "@/lib/utils";

export interface NoteVM {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  authorId: string | null;
}

export function ClinicalNotes({
  caseId,
  notes,
  currentUserId,
  canWrite,
}: {
  caseId: string;
  notes: NoteVM[];
  currentUserId: string;
  canWrite: boolean;
}) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.set("content", content);
    startTransition(async () => {
      await addClinicalNote(caseId, formData);
      setContent("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteClinicalNote(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex items-start gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a clinical note..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <Button size="sm" onClick={submit} loading={pending} disabled={!content.trim()}>
            Add
          </Button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No clinical notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="flex gap-3 rounded-xl border border-[var(--border)] p-3">
              <Avatar name={n.authorName} size={32} color="#4f46e5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{n.authorName}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[var(--muted)]">
                      {formatRelativeDay(n.createdAt)} · {formatTime(n.createdAt)}
                    </p>
                    {n.authorId === currentUserId && (
                      <button onClick={() => remove(n.id)} className="text-[var(--muted)] hover:text-brand-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm">{n.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
