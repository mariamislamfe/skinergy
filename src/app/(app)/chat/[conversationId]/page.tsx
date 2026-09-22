import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { assertCaseAccess } from "@/lib/access";
import { getConversationWithMessages, getConversationsForCase } from "@/lib/data/chat";
import { ChatShell } from "@/components/chat/ChatShell";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const convo = await getConversationWithMessages(conversationId);
  if (!convo) notFound();

  const access = await assertCaseAccess(session.user.id, session.user.role, convo.burnCaseId);
  if (!access) notFound();

  const siblings = await getConversationsForCase(convo.burnCaseId);

  return (
    <div className="animate-fade-in">
      <ChatShell
        caseId={convo.burnCaseId}
        conversationId={conversationId}
        patientName={convo.burnCase.patient.name}
        avatarColor={convo.burnCase.patient.avatarColor}
        bodyLocation={`${convo.burnCase.bodyLocation} · Case #${convo.burnCase.caseNumber}`}
        conversations={siblings.map((s) => ({ id: s.id, title: s.title, updatedAt: s.updatedAt }))}
        messages={convo.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt }))}
        userName={session.user.name ?? "You"}
        userAvatarColor={session.user.avatarColor}
      />
    </div>
  );
}
