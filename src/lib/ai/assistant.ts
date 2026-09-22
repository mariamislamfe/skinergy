import { compareScans, type ScanMetrics } from "@/lib/burn-analysis";
import { formatRelativeDay } from "@/lib/utils";

export interface AssistantScan extends ScanMetrics {
  label: string;
  capturedAt: Date;
  assessment: {
    severity: string;
    summary: string;
    aiSummary: string | null;
  } | null;
}

export interface AssistantContext {
  patientName: string;
  age: number | null;
  bodyLocation: string;
  degree: string | null;
  cause: string | null;
  status: string;
  openedAt: Date;
  scans: AssistantScan[]; // sorted oldest -> newest
}

export type QuickAction =
  | "explain_burn"
  | "compare_previous"
  | "explain_latest"
  | "care_instructions"
  | "warning_signs"
  | "when_scan_again";

const DISCLAIMER =
  "This isn't a diagnosis — professional medical evaluation is recommended if you're unsure or symptoms change.";

function latest(ctx: AssistantContext) {
  return ctx.scans[ctx.scans.length - 1] ?? null;
}
function previous(ctx: AssistantContext) {
  return ctx.scans.length >= 2 ? ctx.scans[ctx.scans.length - 2] : null;
}

function metricsTable(scan: AssistantScan) {
  const rows: string[] = [];
  if (scan.temperatureC != null) rows.push(`- Temperature: ${scan.temperatureC.toFixed(1)}°C`);
  if (scan.rednessIdx != null) rows.push(`- Redness index: ${scan.rednessIdx.toFixed(0)}`);
  if (scan.moistureIdx != null) rows.push(`- Moisture index: ${scan.moistureIdx.toFixed(0)}`);
  if (scan.areaCm2 != null) rows.push(`- Affected area: ${scan.areaCm2.toFixed(1)} cm²`);
  return rows.join("\n");
}

function explainBurn(ctx: AssistantContext) {
  const l = latest(ctx);
  const lines = [
    `**${ctx.patientName}${ctx.age ? `, ${ctx.age}` : ""}** — ${ctx.bodyLocation}${ctx.degree ? ` · ${ctx.degree}` : ""}`,
    ctx.cause ? `Reported cause: ${ctx.cause}.` : "",
    `Case opened ${formatRelativeDay(ctx.openedAt)}, with ${ctx.scans.length} scan${ctx.scans.length === 1 ? "" : "s"} on record.`,
  ].filter(Boolean);

  if (l?.assessment) {
    lines.push("", `**Latest assessment (${formatRelativeDay(l.capturedAt)}):**`, l.assessment.summary);
    if (l.assessment.aiSummary) lines.push("", l.assessment.aiSummary);
  }

  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

function explainLatest(ctx: AssistantContext) {
  const l = latest(ctx);
  if (!l) return `No scans have been recorded yet for this burn case. ${DISCLAIMER}`;

  const lines = [
    `**${l.label}** — ${formatRelativeDay(l.capturedAt)}`,
    "",
    "**Available measurements:**",
    metricsTable(l) || "No device measurements recorded for this scan.",
  ];

  if (l.assessment) {
    lines.push("", `**Assessment:** ${l.assessment.summary}`);
    if (l.assessment.aiSummary) lines.push("", l.assessment.aiSummary);
  }

  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

function comparePrevious(ctx: AssistantContext) {
  const l = latest(ctx);
  const p = previous(ctx);
  if (!l || !p) {
    return `There's only ${ctx.scans.length} scan recorded for this case so far, so a comparison isn't possible yet. Once a follow-up scan is added, I can compare it with this one. ${DISCLAIMER}`;
  }

  const cmp = compareScans(p, l);
  const rows: string[] = ["| Metric | Previous | Current | Change |", "|---|---|---|---|"];
  if (p.rednessIdx != null && l.rednessIdx != null)
    rows.push(`| Redness index | ${p.rednessIdx.toFixed(0)} | ${l.rednessIdx.toFixed(0)} | ${fmtDelta(cmp.deltas.redness)} |`);
  if (p.temperatureC != null && l.temperatureC != null)
    rows.push(`| Temperature | ${p.temperatureC.toFixed(1)}°C | ${l.temperatureC.toFixed(1)}°C | ${fmtDelta(cmp.deltas.temperature)} |`);
  if (p.areaCm2 != null && l.areaCm2 != null)
    rows.push(`| Area | ${p.areaCm2.toFixed(1)} cm² | ${l.areaCm2.toFixed(1)} cm² | ${fmtDelta(cmp.deltas.area)} |`);
  if (p.moistureIdx != null && l.moistureIdx != null)
    rows.push(`| Moisture index | ${p.moistureIdx.toFixed(0)} | ${l.moistureIdx.toFixed(0)} | ${fmtDelta(cmp.deltas.moisture)} |`);

  const lines = [
    `Comparing **${p.label}** (${formatRelativeDay(p.capturedAt)}) with **${l.label}** (${formatRelativeDay(l.capturedAt)}):`,
    "",
    ...(rows.length > 1 ? rows : ["No overlapping measurements between these two scans."]),
    "",
    cmp.narrative,
  ];

  if (cmp.changeDetected) {
    lines.push("", "⚠️ **Change Detected** — professional medical evaluation is recommended.");
  }
  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

function careInstructions(ctx: AssistantContext) {
  const degree = (ctx.degree ?? "").toLowerCase();
  const lines = ["**General care guidance for this burn:**", ""];

  if (degree.includes("third") || ctx.status === "ATTENTION") {
    lines.push(
      "- This burn has indicators that may need professional attention — avoid self-treating beyond basic first aid.",
      "- Keep the area covered with a clean, non-stick dressing.",
      "- Do not apply ice, butter, or home remedies.",
      "- Seek in-person medical evaluation promptly."
    );
  } else {
    lines.push(
      "- Keep the area clean and covered with a non-stick, breathable dressing.",
      "- Avoid popping any blisters — they help protect against infection.",
      "- Avoid ice directly on the burn; cool running water is preferable for fresh burns.",
      "- Keep the area out of direct sunlight while healing.",
      "- Change dressings as advised, watching for signs of infection at each change."
    );
  }

  lines.push("", "Follow any specific instructions given by your clinician over this general guidance.", "", DISCLAIMER);
  return lines.join("\n");
}

function warningSigns() {
  return [
    "**Seek professional medical evaluation if you notice:**",
    "",
    "- Redness spreading beyond the original burn area",
    "- Increasing pain after the first 2–3 days (instead of easing)",
    "- Pus, unusual odor, or the area feels warm and swollen",
    "- Fever or chills",
    "- Numbness, or a white/leathery appearance of the skin",
    "- A burn covering a large area, or on the face, hands, joints, or genitals",
    "",
    "If any of these apply, don't wait for the next scheduled scan — seek care promptly.",
    "",
    DISCLAIMER,
  ].join("\n");
}

function whenScanAgain(ctx: AssistantContext) {
  const l = latest(ctx);
  let recommendation = "in 5–7 days";
  if (ctx.status === "ATTENTION") recommendation = "as soon as possible, ideally today";
  else if (ctx.status === "FOLLOW_UP") recommendation = "in 2–3 days";

  const lines = [
    `Based on the current status (**${ctx.status.replace("_", " ").toLowerCase()}**), a follow-up scan is suggested ${recommendation}.`,
  ];
  if (l) lines.push(`Your last scan was ${formatRelativeDay(l.capturedAt)}.`);
  lines.push("", "Scan sooner if you notice any warning signs in the meantime.", "", DISCLAIMER);
  return lines.join("\n");
}

function fmtDelta(n: number | null) {
  if (n == null) return "—";
  if (n === 0) return "no change";
  return n > 0 ? `+${n}` : `${n}`;
}

export function runQuickAction(action: QuickAction, ctx: AssistantContext): string {
  switch (action) {
    case "explain_burn":
      return explainBurn(ctx);
    case "compare_previous":
      return comparePrevious(ctx);
    case "explain_latest":
      return explainLatest(ctx);
    case "care_instructions":
      return careInstructions(ctx);
    case "warning_signs":
      return warningSigns();
    case "when_scan_again":
      return whenScanAgain(ctx);
  }
}

export function generateAssistantReply(ctx: AssistantContext, userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (/(better|improv|healing|progress)/.test(msg)) return comparePrevious(ctx);
  if (/(worse|worried|concern)/.test(msg)) return comparePrevious(ctx);
  if (/(compare|previous|last scan)/.test(msg)) return comparePrevious(ctx);
  if (/(care|dressing|treat|clean|bandage)/.test(msg)) return careInstructions(ctx);
  if (/(warning|infect|danger|red flag|emergency)/.test(msg)) return warningSigns();
  if (/(scan again|next scan|when should i)/.test(msg)) return whenScanAgain(ctx);
  if (/(latest|assessment|result)/.test(msg)) return explainLatest(ctx);
  if (/(explain|what is|tell me about|my burn)/.test(msg)) return explainBurn(ctx);

  const l = latest(ctx);
  const lines = [
    `Based on the available assessment for ${ctx.patientName}'s ${ctx.bodyLocation.toLowerCase()} burn, here's what I can share:`,
    "",
  ];
  if (l?.assessment) {
    lines.push(l.assessment.summary);
    if (l.assessment.aiSummary) lines.push("", l.assessment.aiSummary);
  } else {
    lines.push("No assessment is available yet — a scan needs to be completed first.");
  }
  lines.push(
    "",
    "You can ask me things like *\"is it getting better?\"*, *\"what should I watch for?\"*, or use the quick actions above.",
    "",
    DISCLAIMER
  );
  return lines.join("\n");
}
