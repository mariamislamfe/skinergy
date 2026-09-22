"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Plus, ArrowLeftRight, MessageSquare } from "lucide-react";
import { createConversation } from "@/lib/actions/chat";
import { formatRelativeDay, cn } from "@/lib/utils";

export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: Date;
}

export function ChatSidebar({
  caseId,
  patientName,
  avatarColor,
  bodyLocation,
  conversations,
  activeId,
  onNavigate,
}: {
  caseId: string;
  patientName: string;
  avatarColor: string;
  bodyLocation: string;
  conversations: ConversationListItem[];
  activeId?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function newChat() {
    startTransition(async () => {
      const res = await createConversation(caseId, "New conversation");
      if (res.success && res.conversationId) {
        onNavigate?.();
        router.push(`/chat/${res.conversationId}`);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] p-3">
        <Avatar name={patientName} color={avatarColor} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{patientName}</p>
          <p className="truncate text-xs text-[var(--muted)]">{bodyLocation}</p>
        </div>
        <Link href="/chat" className="rounded-xl p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]">
          <ArrowLeftRight className="h-4 w-4" />
        </Link>
      </div>

      <button
        onClick={newChat}
        disabled={pending}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] py-2.5 text-sm font-medium text-brand-600 transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>

      <p className="mb-1.5 mt-5 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Recent Chats
      </p>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="px-1 py-4 text-sm text-[var(--muted)]">No conversations yet.</p>
        )}
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            onClick={onNavigate}
            className={cn(
              "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
              c.id === activeId
                ? "bg-brand-50 text-brand-700"
                : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
            )}
          >
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.title}</p>
              <p className="text-xs text-[var(--muted)]">{formatRelativeDay(c.updatedAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
