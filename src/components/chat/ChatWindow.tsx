"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Send,
  Sparkles,
  Flame,
  GitCompare,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { sendMessage, sendQuickAction } from "@/lib/actions/chat";
import type { QuickAction } from "@/lib/ai/assistant";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ChatMessageVM {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

const QUICK_ACTIONS: { action: QuickAction; label: string; icon: typeof Flame }[] = [
  { action: "explain_burn", label: "Explain My Burn", icon: Flame },
  { action: "compare_previous", label: "Compare With Previous Scan", icon: GitCompare },
  { action: "explain_latest", label: "Explain Latest Assessment", icon: FileText },
  { action: "care_instructions", label: "Care Instructions", icon: ShieldCheck },
  { action: "warning_signs", label: "Warning Signs", icon: AlertTriangle },
  { action: "when_scan_again", label: "When Should I Scan Again?", icon: CalendarClock },
];

export function ChatWindow({
  conversationId,
  initialMessages,
  userName,
  userAvatarColor,
}: {
  conversationId: string;
  initialMessages: ChatMessageVM[];
  userName: string;
  userAvatarColor: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessageVM = { id: `tmp-${Date.now()}`, role: "user", content: text, createdAt: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    startTransition(async () => {
      const res = await sendMessage(conversationId, text);
      setTyping(false);
      if (res.success && res.reply) {
        setMessages((m) => [
          ...m,
          { id: res.messageId ?? `a-${Date.now()}`, role: "assistant", content: res.reply, createdAt: new Date() },
        ]);
      }
    });
  }

  function runQuickAction(action: QuickAction, label: string) {
    const userMsg: ChatMessageVM = { id: `tmp-${Date.now()}`, role: "user", content: label, createdAt: new Date() };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);
    startTransition(async () => {
      const res = await sendQuickAction(conversationId, action);
      setTyping(false);
      if (res.success && res.reply) {
        setMessages((m) => [
          ...m,
          { id: res.messageId ?? `a-${Date.now()}`, role: "assistant", content: res.reply, createdAt: new Date() },
        ]);
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">How can I help with this burn today?</p>
            <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">
              Ask a question, or use a quick action below to get started.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} userName={userName} userAvatarColor={userAvatarColor} />
        ))}

        {typing && <TypingIndicator />}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
        {QUICK_ACTIONS.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            onClick={() => runQuickAction(action, label)}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-brand-500/50 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this burn..."
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  userName,
  userAvatarColor,
}: {
  message: ChatMessageVM;
  userName: string;
  userAvatarColor: string;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-end gap-2 animate-fade-in", isUser && "flex-row-reverse")}>
      {isUser ? (
        <Avatar name={userName} color={userAvatarColor} size={28} />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "rounded-br-sm bg-brand-500 text-white"
            : "rounded-bl-sm border border-[var(--border)] bg-[var(--surface)]"
        )}
      >
        <div className={cn("prose-chat", isUser && "prose-chat-user")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        <p className={cn("mt-1 text-[10px] opacity-60", isUser ? "text-right" : "")}>{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}
