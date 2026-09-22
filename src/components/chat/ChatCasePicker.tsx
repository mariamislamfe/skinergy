"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronRight } from "lucide-react";
import { createConversation } from "@/lib/actions/chat";
import type { RiskStatus } from "@/components/ui/StatusBadge";

interface CaseOption {
  id: string;
  caseNumber: string;
  bodyLocation: string;
  status: string;
  patientName: string;
  avatarColor: string;
}

export function ChatCasePicker({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(caseId: string) {
    startTransition(async () => {
      const res = await createConversation(caseId, "New conversation");
      if (res.success && res.conversationId) router.push(`/chat/${res.conversationId}`);
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-2">
      {cases.map((c) => (
        <button
          key={c.id}
          disabled={pending}
          onClick={() => select(c.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left transition hover:border-brand-500/50 hover:bg-brand-50/40 disabled:opacity-50"
        >
          <Avatar name={c.patientName} color={c.avatarColor} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{c.patientName}</p>
            <p className="text-xs text-[var(--muted)]">
              Case #{c.caseNumber} · {c.bodyLocation}
            </p>
          </div>
          <StatusBadge status={c.status as RiskStatus} />
          <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
        </button>
      ))}
    </div>
  );
}
