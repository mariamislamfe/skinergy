import type { ScanMetrics } from "@/lib/burn-analysis";

/**
 * Simulated device reading, used everywhere the real 192.168.4.1 device
 * would normally supply a measurement. Swap this out for a call to the
 * device's local endpoint once hardware integration is wired up.
 */
export function mockDeviceReading(baseline?: Partial<ScanMetrics>): ScanMetrics {
  const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

  return {
    temperatureC: baseline?.temperatureC != null ? drift(baseline.temperatureC, 0.6) : rnd(36.6, 38.4),
    moistureIdx: baseline?.moistureIdx != null ? drift(baseline.moistureIdx, 6) : rnd(30, 65),
    rednessIdx: baseline?.rednessIdx != null ? drift(baseline.rednessIdx, 10) : rnd(20, 85),
    areaCm2: baseline?.areaCm2 != null ? drift(baseline.areaCm2, 1.5) : rnd(4, 25),
  };
}

function drift(value: number, spread: number) {
  const v = value + (Math.random() - 0.55) * spread;
  return Math.round(Math.max(0, v) * 10) / 10;
}

export function classifySeverity(metrics: ScanMetrics): "MONITORING" | "FOLLOW_UP" | "ATTENTION" {
  const redness = metrics.rednessIdx ?? 0;
  if (redness >= 75) return "ATTENTION";
  if (redness >= 50) return "FOLLOW_UP";
  return "MONITORING";
}

export function mockAssessmentSummary(severity: "MONITORING" | "FOLLOW_UP" | "ATTENTION") {
  const summaries: Record<typeof severity, { summary: string; aiSummary: string }> = {
    MONITORING: {
      summary: "Measurements are within an expected range for a healing burn. No signs of complication detected.",
      aiSummary: "Based on the available measurements, indicators are consistent with normal healing. Routine monitoring is sufficient.",
    },
    FOLLOW_UP: {
      summary: "Measurements show moderate redness and localized temperature. Continued monitoring with a follow-up scan is advisable.",
      aiSummary: "Possible indicators suggest this area should be re-checked in a few days to confirm the healing trend.",
    },
    ATTENTION: {
      summary: "Elevated redness index and temperature detected. These indicators may warrant closer evaluation.",
      aiSummary: "Based on the available assessment, professional medical evaluation is recommended given the elevated indicators.",
    },
  };
  return summaries[severity];
}
