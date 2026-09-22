import type { RiskStatus } from "@/components/ui/StatusBadge";

export interface BurnClassification {
  degree: string;
  thickness: string;
  confidence: number;
}

/**
 * Burn-degree image classification. Today this derives a plausible result
 * from the device's severity triage so the UI has real values to render.
 * Swap the body of this function for a call to the MobileNetV2 inference
 * service (see /public/MobileNetV2_model.keras.rar) once it's running —
 * the 3-way softmax output (1st/2nd/3rd degree + confidence) maps directly
 * onto this same return shape.
 */
export function mockClassifyBurn(severity: RiskStatus): BurnClassification {
  const table: Record<RiskStatus, BurnClassification[]> = {
    MONITORING: [
      { degree: "1st Degree", thickness: "Superficial", confidence: 91 },
      { degree: "1st Degree", thickness: "Superficial", confidence: 87 },
    ],
    FOLLOW_UP: [
      { degree: "2nd Degree", thickness: "Superficial Partial Thickness", confidence: 88 },
      { degree: "2nd Degree", thickness: "Superficial Partial Thickness", confidence: 82 },
    ],
    ATTENTION: [
      { degree: "2nd Degree", thickness: "Partial Thickness", confidence: 94 },
      { degree: "3rd Degree", thickness: "Full Thickness", confidence: 90 },
    ],
  };
  const options = table[severity];
  return options[Math.floor(Math.random() * options.length)];
}

export function getFirstAidGuidance(degree: string): string[] {
  if (degree.startsWith("3rd")) {
    return [
      "Do not remove stuck clothing or apply water, ice, or creams.",
      "Cover loosely with a clean, dry, non-stick cloth.",
      "Keep the person warm and still.",
      "Seek emergency medical care immediately.",
    ];
  }
  if (degree.startsWith("2nd")) {
    return [
      "Cool the burn with cool (not cold) running water for 10–20 minutes.",
      "Do not use ice, creams, or oils.",
      "Cover with a clean, non-stick dressing.",
      "Seek medical assessment.",
    ];
  }
  return [
    "Cool the area with cool running water for about 10 minutes.",
    "Do not apply ice directly to the skin.",
    "Keep the area clean and moisturized.",
    "Monitor for blistering or increased pain over the next 24 hours.",
  ];
}
