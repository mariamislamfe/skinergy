"use client";

import { useState } from "react";
import { PanelLeft, X } from "lucide-react";
import { ChatSidebar, type ConversationListItem } from "./ChatSidebar";
import { ChatWindow, type ChatMessageVM } from "./ChatWindow";

export function ChatShell({
  caseId,
  conversationId,
  patientName,
  avatarColor,
  bodyLocation,
  conversations,
  messages,
  userName,
  userAvatarColor,
}: {
  caseId: string;
  conversationId: string;
  patientName: string;
  avatarColor: string;
  bodyLocation: string;
  conversations: ConversationListItem[];
  messages: ChatMessageVM[];
  userName: string;
  userAvatarColor: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-5">
      <aside className="hidden w-72 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:block">
        <ChatSidebar
          caseId={caseId}
          patientName={patientName}
          avatarColor={avatarColor}
          bodyLocation={bodyLocation}
          conversations={conversations}
          activeId={conversationId}
        />
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 bg-[var(--surface)] p-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-2 flex justify-end">
            <button onClick={() => setDrawerOpen(false)} className="rounded-xl p-1.5 hover:bg-[var(--surface-2)]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <ChatSidebar
            caseId={caseId}
            patientName={patientName}
            avatarColor={avatarColor}
            bodyLocation={bodyLocation}
            conversations={conversations}
            activeId={conversationId}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium"
          >
            <PanelLeft className="h-3.5 w-3.5" />
            Chats
          </button>
          <p className="text-xs font-medium text-[var(--muted)]">{bodyLocation}</p>
        </div>
        <ChatWindow
          key={conversationId}
          conversationId={conversationId}
          initialMessages={messages}
          userName={userName}
          userAvatarColor={userAvatarColor}
        />
      </div>
    </div>
  );
}
