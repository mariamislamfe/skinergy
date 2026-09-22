"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCaseAccess } from "@/lib/access";
import { classifySeverity, mockAssessmentSummary } from "@/lib/device/mock";
import { mockClassifyBurn, type BurnClassification } from "@/lib/ai/burn-classifier";
import { compareScans } from "@/lib/burn-analysis";
import type { ScanMetrics } from "@/lib/burn-analysis";

export async function saveScan(
  caseId: string,
  metrics: ScanMetrics,
  opts?: {
    deviceId?: string;
    label?: string;
    imageUrl?: string;
    classification?: BurnClassification;
  }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  const burnCase = await assertCaseAccess(session.user.id, session.user.role, caseId);
  if (!burnCase) return { error: "Case not found." };

  const priorScans = await prisma.scan.count({ where: { burnCaseId: caseId } });
  const severity = classifySeverity(metrics);
  const { summary, aiSummary } = mockAssessmentSummary(severity);
  const classification = opts?.classification ?? mockClassifyBurn(severity);

  let changeFlag = false;
  const lastScan = await prisma.scan.findFirst({
    where: { burnCaseId: caseId },
    orderBy: { capturedAt: "desc" },
  });
  if (lastScan) {
    const cmp = compareScans(lastScan, metrics);
    changeFlag = cmp.changeDetected;
  }

  const scan = await prisma.scan.create({
    data: {
      burnCaseId: caseId,
      label: opts?.label ?? (priorScans === 0 ? "Initial Assessment" : "Follow-up Scan"),
      imageUrl: opts?.imageUrl ?? null,
      temperatureC: metrics.temperatureC,
      moistureIdx: metrics.moistureIdx,
      rednessIdx: metrics.rednessIdx,
      areaCm2: metrics.areaCm2,
      deviceId: opts?.deviceId ?? null,
      assessment: {
        create: {
          severity,
          summary,
          aiSummary,
          changeFlag,
          burnDegree: classification.degree,
          thickness: classification.thickness,
          confidence: classification.confidence,
        },
      },
    },
    include: { assessment: true },
  });

  await prisma.burnCase.update({ where: { id: caseId }, data: { status: severity } });

  if (burnCase.patient.selfUserId) {
    await prisma.notification.create({
      data: {
        userId: burnCase.patient.selfUserId,
        type: "new_scan",
        title: "New scan saved",
        body: `${burnCase.bodyLocation} (Case #${burnCase.caseNumber}) scan has been saved.`,
      },
    });
    if (severity === "ATTENTION") {
      await prisma.notification.create({
        data: {
          userId: burnCase.patient.selfUserId,
          type: "concerning_change",
          title: "Assessment needs attention",
          body: `Your latest ${burnCase.bodyLocation} scan indicates you should seek professional evaluation.`,
        },
      });
    }
  }

  revalidatePath(`/patients/${burnCase.patientId}/cases/${caseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/home");
  return { success: true, scanId: scan.id, severity };
}
