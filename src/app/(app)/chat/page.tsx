import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRecentConversations, getCasesWithPatientForChat } from "@/lib/data/chat";
import { createConversation } from "@/lib/actions/chat";
import { ChatCasePicker } from "@/components/chat/ChatCasePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageCircle } from "lucide-react";

export default async function ChatLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { caseId: forcedCaseId } = await searchParams;

  const cases = await getCasesWithPatientForChat(session.user.id, session.user.role);

  if (forcedCaseId && cases.some((c) => c.id === forcedCaseId)) {
    const res = await createConversation(forcedCaseId, "New conversation");
    if (res.success && res.conversationId) redirect(`/chat/${res.conversationId}`);
  }

  if (!forcedCaseId) {
    const recent = await getRecentConversations(session.user.id, session.user.role, 1);
    if (recent.length > 0) redirect(`/chat/${recent[0].id}`);
  }

  if (cases.length === 1) {
    const res = await createConversation(cases[0].id, "New conversation");
    if (res.success && res.conversationId) redirect(`/chat/${res.conversationId}`);
  }

  if (cases.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <div className="mt-6">
          <EmptyState
            icon={MessageCircle}
            title="No active burn cases"
            description="Create a burn case first — the AI assistant needs a case to give you context-aware answers."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Choose which burn case you&apos;d like to discuss.</p>
      <div className="mt-6">
        <ChatCasePicker
          cases={cases.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            bodyLocation: c.bodyLocation,
            status: c.status,
            patientName: c.patient.name,
            avatarColor: c.patient.avatarColor,
          }))}
        />
      </div>
    </div>
  );
}
