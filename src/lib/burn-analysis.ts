export interface ScanMetrics {
  temperatureC: number | null;
  moistureIdx: number | null;
  rednessIdx: number | null;
  areaCm2: number | null;
}

export interface ScanComparison {
  trend: "improving" | "worsening" | "stable" | "unknown";
  changeDetected: boolean;
  deltas: {
    temperature: number | null;
    moisture: number | null;
    redness: number | null;
    area: number | null;
  };
  narrative: string;
}

/**
 * Compares two scans using only measurements that exist on both — never
 * invents values. Redness and area are the primary trend signals; a rise in
 * either drives "worsening" so the UI's Change Detected flag stays honest.
 */
export function compareScans(previous: ScanMetrics, current: ScanMetrics): ScanComparison {
  const deltas = {
    temperature:
      previous.temperatureC != null && current.temperatureC != null
        ? round1(current.temperatureC - previous.temperatureC)
        : null,
    moisture:
      previous.moistureIdx != null && current.moistureIdx != null
        ? round1(current.moistureIdx - previous.moistureIdx)
        : null,
    redness:
      previous.rednessIdx != null && current.rednessIdx != null
        ? round1(current.rednessIdx - previous.rednessIdx)
        : null,
    area:
      previous.areaCm2 != null && current.areaCm2 != null
        ? round1(current.areaCm2 - previous.areaCm2)
        : null,
  };

  const signals: number[] = [];
  if (deltas.redness != null) signals.push(deltas.redness);
  if (deltas.area != null) signals.push(deltas.area);

  if (signals.length === 0) {
    return {
      trend: "unknown",
      changeDetected: false,
      deltas,
      narrative: "Not enough comparable measurements between these two scans to determine a trend.",
    };
  }

  const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
  let trend: ScanComparison["trend"] = "stable";
  if (avg <= -3) trend = "improving";
  else if (avg >= 3) trend = "worsening";

  const narrative =
    trend === "improving"
      ? "Visible changes suggest improvement compared with the previous assessment."
      : trend === "worsening"
      ? "Measurements suggest this area may be changing unfavorably compared with the previous assessment."
      : "Measurements are broadly similar to the previous assessment.";

  return { trend, changeDetected: trend === "worsening", deltas, narrative };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
