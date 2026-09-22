import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCaseDetail } from "@/lib/data/cases";
import { assertCaseAccess, isHealthcareRole } from "@/lib/access";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CaseDetailTabs } from "@/components/cases/CaseDetailTabs";
import { ArrowLeft, MessageCircle, ScanLine } from "lucide-react";
import { formatRelativeDay } from "@/lib/utils";
import type { RiskStatus } from "@/components/ui/StatusBadge";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>;
}) {
  const { id, caseId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const access = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!access) notFound();

  const burnCase = await getCaseDetail(caseId);
  if (!burnCase) notFound();

  return (
    <div className="animate-fade-in space-y-6">
      <Link href={`/patients/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {burnCase.patient.name}
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={burnCase.patient.name} color={burnCase.patient.avatarColor} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">
                Case #{burnCase.caseNumber} · {burnCase.bodyLocation}
              </h1>
              <StatusBadge status={burnCase.status as RiskStatus} pulse />
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {burnCase.patient.name}
              {burnCase.degree ? ` · ${burnCase.degree}` : ""}
              {burnCase.cause ? ` · ${burnCase.cause}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Opened {formatRelativeDay(burnCase.openedAt)}
              {burnCase.closedAt ? ` · Closed ${formatRelativeDay(burnCase.closedAt)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/chat?caseId=${caseId}`}>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4" />
                Ask AI
              </Button>
            </Link>
            <Link href={`/scan?patientId=${id}&caseId=${caseId}`}>
              <Button>
                <ScanLine className="h-4 w-4" />
                New Scan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <CaseDetailTabs
        caseId={caseId}
        scans={burnCase.scans.map((s) => ({
          id: s.id,
          label: s.label,
          capturedAt: s.capturedAt,
          imageUrl: s.imageUrl,
          temperatureC: s.temperatureC,
          moistureIdx: s.moistureIdx,
          rednessIdx: s.rednessIdx,
          areaCm2: s.areaCm2,
          assessment: s.assessment
            ? {
                severity: s.assessment.severity as RiskStatus,
                summary: s.assessment.summary,
                aiSummary: s.assessment.aiSummary,
                changeFlag: s.assessment.changeFlag,
                burnDegree: s.assessment.burnDegree,
                confidence: s.assessment.confidence,
              }
            : null,
        }))}
        notes={burnCase.notes.map((n) => ({
          id: n.id,
          authorName: n.authorName,
          content: n.content,
          createdAt: n.createdAt,
          authorId: n.authorId,
        }))}
        followUps={burnCase.followUps.map((f) => ({
          id: f.id,
          dueAt: f.dueAt,
          status: f.status,
          note: f.note,
        }))}
        currentUserId={session.user.id}
        canWrite={isHealthcareRole(session.user.role)}
      />
    </div>
  );
}
