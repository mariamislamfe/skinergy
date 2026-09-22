"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScanVisual } from "@/components/scan/ScanVisual";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Wifi,
  Battery,
  CheckCircle2,
  ScanLine,
  Sparkles,
  RotateCcw,
  Save,
  ChevronRight,
  Flame,
  Camera,
  ImageUp,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockDeviceReading, classifySeverity, mockAssessmentSummary } from "@/lib/device/mock";
import { mockClassifyBurn, getFirstAidGuidance, type BurnClassification } from "@/lib/ai/burn-classifier";
import { compareScans, type ScanMetrics } from "@/lib/burn-analysis";
import { saveScan } from "@/lib/actions/scans";
import { testDeviceConnectionAction } from "@/lib/actions/devices";
import {
  ResultHeroCard,
  MetricStatPills,
  RecommendationBanner,
  FirstAidChecklist,
  CaseHistoryPanel,
} from "@/components/scan/ScanResultCard";
import type { RiskStatus } from "@/components/ui/StatusBadge";

interface PatientOption {
  id: string;
  name: string;
  avatarColor: string;
  burnCases: {
    id: string;
    caseNumber: string;
    bodyLocation: string;
    status: string;
    scans: ScanMetrics[];
  }[];
}
interface DeviceOption {
  id: string;
  name: string;
  serial: string;
  status: string;
  battery: number;
  signal: string;
  ipAddress: string;
}

type Step = "patient" | "case" | "device" | "photo" | "scanning" | "analysis" | "results";
const STEP_ORDER: Step[] = ["patient", "case", "device", "photo", "scanning", "analysis", "results"];
const STEP_LABEL: Record<Step, string> = {
  patient: "Patient",
  case: "Burn Case",
  device: "Device",
  photo: "Photo",
  scanning: "Scan",
  analysis: "Analysis",
  results: "Results",
};

const ANALYSIS_PHASES_PHOTO = ["Reading image...", "Detecting burn area...", "Classifying severity..."];
const ANALYSIS_PHASES_METRIC = ["Reviewing measurements...", "Comparing with prior scans...", "Generating assessment..."];

export function ScanFlow({
  patients,
  devices,
  initialPatientId,
  initialCaseId,
}: {
  patients: PatientOption[];
  devices: DeviceOption[];
  initialPatientId?: string;
  initialCaseId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("patient");
  const [patientId, setPatientId] = useState(initialPatientId ?? (patients.length === 1 ? patients[0].id : undefined));
  const [caseId, setCaseId] = useState(initialCaseId);
  const [deviceId, setDeviceId] = useState<string | undefined>(devices.find((d) => d.status === "connected")?.id);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(devices.some((d) => d.status === "connected"));
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<ScanMetrics | null>(null);
  const [severity, setSeverity] = useState<RiskStatus | null>(null);
  const [summary, setSummary] = useState<{ summary: string; aiSummary: string } | null>(null);
  const [classification, setClassification] = useState<BurnClassification | null>(null);
  const [classificationSource, setClassificationSource] = useState<"model" | "mock" | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [previousMetrics, setPreviousMetrics] = useState<ScanMetrics | null>(null);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const patient = patients.find((p) => p.id === patientId);
  const burnCase = patient?.burnCases.find((c) => c.id === caseId);
  const selectedDevice = devices.find((d) => d.id === deviceId);

  // Auto-advance past pre-selected steps
  useEffect(() => {
    if (initialPatientId && initialCaseId) {
      const p = patients.find((x) => x.id === initialPatientId);
      setPreviousMetrics(p?.burnCases.find((c) => c.id === initialCaseId)?.scans[0] ?? null);
      setStep("device");
    } else if (initialPatientId) setStep("case");
    else if (patients.length === 1) {
      setPatientId(patients[0].id);
      setStep("case");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== "scanning") return;
    let cancelled = false;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 4));
    }, 80);

    const timeout = setTimeout(async () => {
      clearInterval(interval);

      // If a real device is connected, try a live temperature reading from
      // it and simulate the rest (redness/moisture/area aren't sensed by
      // this hardware). Falls back to a fully simulated reading otherwise.
      let realTemperature: number | null = null;
      if (connected && selectedDevice) {
        try {
          const probe = await testDeviceConnectionAction(selectedDevice.ipAddress);
          if ("success" in probe && probe.reachable && probe.temperatureC != null) {
            realTemperature = probe.temperatureC;
          }
        } catch {
          // Device unreachable — fall through to fully simulated reading.
        }
      }
      if (cancelled) return;

      const reading = mockDeviceReading();
      if (realTemperature != null) reading.temperatureC = realTemperature;
      setMetrics(reading);
      setStep("analysis");
    }, 2200);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "analysis" || !metrics) return;
    let cancelled = false;

    async function runAnalysis() {
      const sev = classifySeverity(metrics!);

      let result: BurnClassification | null = null;
      let source: "model" | "mock" = "mock";

      if (photoFile) {
        try {
          const form = new FormData();
          form.set("image", photoFile);
          const res = await fetch("/api/classify", { method: "POST", body: form });
          const data = await res.json();
          if (data.imageUrl) setUploadedImageUrl(data.imageUrl);
          if (data.success) {
            result = { degree: data.degree, thickness: data.thickness, confidence: data.confidence };
            source = "model";
          }
        } catch {
          // fall through to mock below
        }
      }

      if (!result) {
        result = mockClassifyBurn(sev);
        source = "mock";
      }

      // Minimum visible duration so the analysis state doesn't flash.
      await new Promise((r) => setTimeout(r, 1700));
      if (cancelled) return;

      setSeverity(sev);
      setSummary(mockAssessmentSummary(sev));
      setClassification(result);
      setClassificationSource(source);
      setCapturedAt(new Date());
      setStep("results");
    }

    runAnalysis();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, metrics]);

  useEffect(() => {
    if (step !== "analysis") {
      setAnalysisPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalysisPhase((p) => Math.min(p + 1, ANALYSIS_PHASES_PHOTO.length - 1));
    }, 550);
    return () => clearInterval(interval);
  }, [step]);

  const comparison = useMemo(() => {
    if (!metrics || !previousMetrics) return null;
    return compareScans(previousMetrics, metrics);
  }, [metrics, previousMetrics]);

  function selectPatient(id: string) {
    setPatientId(id);
    setCaseId(undefined);
    setStep("case");
  }

  function selectCase(id: string) {
    setCaseId(id);
    setPreviousMetrics(patient?.burnCases.find((c) => c.id === id)?.scans[0] ?? null);
    setStep("device");
  }

  function connectDevice(id: string) {
    setDeviceId(id);
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 1100);
  }

  function goToPhoto() {
    setStep("photo");
  }

  function handlePhotoSelect(file: File) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function startScan() {
    setStep("scanning");
  }

  function retake() {
    setMetrics(null);
    setSeverity(null);
    setSummary(null);
    setClassification(null);
    setClassificationSource(null);
    setCapturedAt(null);
    setUploadedImageUrl(null);
    setStep("scanning");
  }

  async function handleSave() {
    if (!caseId || !metrics || !classification) return;
    setSaving(true);
    const res = await saveScan(caseId, metrics, {
      deviceId,
      imageUrl: uploadedImageUrl ?? undefined,
      classification,
    });
    setSaving(false);
    if (res.success) {
      router.push(`/patients/${patientId}/cases/${caseId}`);
    }
  }

  return (
    <div className={cn("mx-auto animate-fade-in", step === "results" ? "max-w-5xl" : "max-w-2xl")}>
      {step !== "results" && <StepIndicator current={step} />}

      {step === "patient" && (
        <StepCard title="Select patient" description="Who is this scan for?">
          {patients.length === 0 ? (
            <EmptyState icon={Flame} title="No patients available" description="Add a patient first." />
          ) : (
            <div className="space-y-2">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-500/50 hover:bg-brand-50/40 hover:card-shadow"
                >
                  <Avatar name={p.name} color={p.avatarColor} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-[var(--muted)]">{p.burnCases.length} active case{p.burnCases.length === 1 ? "" : "s"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                </button>
              ))}
            </div>
          )}
        </StepCard>
      )}

      {step === "case" && patient && (
        <StepCard title={`Select burn case`} description={`Choose which of ${patient.name}'s burn cases to scan.`}>
          {patient.burnCases.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No active burn cases"
              description="Create a burn case for this patient before scanning."
              action={
                <Link href={`/patients/${patient.id}`}>
                  <Button variant="outline">Go to patient profile</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {patient.burnCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-500/50 hover:bg-brand-50/40 hover:card-shadow"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Flame className="h-4 w-4" fill="currentColor" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Case #{c.caseNumber} · {c.bodyLocation}</p>
                  </div>
                  <StatusBadge status={c.status as RiskStatus} />
                </button>
              ))}
            </div>
          )}
        </StepCard>
      )}

      {step === "device" && (
        <StepCard title="Connect device" description="Connect your Skinergy device, or continue with a simulated reading.">
          <div className="space-y-2">
            {devices.map((d) => {
              const isSelected = deviceId === d.id;
              const isConnecting = connecting && isSelected;
              const isConnected = isSelected && connected;
              const state = isConnected ? "connected" : isConnecting ? "connecting" : "ready";
              return (
                <div
                  key={d.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-300",
                    isSelected ? "border-brand-500/60 bg-brand-50/40 card-shadow" : "border-[var(--border)]"
                  )}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                    <Wifi className={cn("h-4 w-4 transition-colors", isConnected && "text-[var(--status-ok-fg)]")} />
                    {isConnecting && (
                      <span className="absolute inset-0 animate-ping rounded-xl bg-brand-500/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span
                        className={cn(
                          "flex items-center gap-1 font-medium",
                          state === "connected" && "text-[var(--status-ok-fg)]",
                          state === "connecting" && "text-brand-600"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            state === "connected" && "bg-[var(--status-ok-dot)] animate-pulse-dot",
                            state === "connecting" && "bg-brand-500 animate-pulse-dot",
                            state === "ready" && "bg-[var(--muted)]"
                          )}
                        />
                        {state === "connected" ? "Connected · Receiving data" : state === "connecting" ? "Connecting..." : "Ready"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Battery className="h-3 w-3" /> {d.battery}%
                      </span>
                    </div>
                  </div>
                  {isConnected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--status-ok-fg)]" />
                  ) : (
                    <Button size="sm" variant="outline" loading={isConnecting} onClick={() => connectDevice(d.id)}>
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={goToPhoto}>
              Skip — simulate reading
            </Button>
            <Button onClick={goToPhoto} disabled={!connected}>
              <ScanLine className="h-4 w-4" />
              Continue
            </Button>
          </div>
        </StepCard>
      )}

      {step === "photo" && (
        <div className="animate-slide-up">
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight">Upload a burn photo</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Our AI analyzes the image and gives you a clear result with first-aid guidance.
            </p>
          </div>

          {photoPreview ? (
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] card-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Burn preview" className="max-h-96 w-full object-contain bg-[var(--surface-2)]" />
              <div className="flex items-center justify-between border-t border-[var(--border)] p-4">
                <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-ok-fg)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Photo ready
                </span>
                <Button variant="outline" size="sm" onClick={clearPhoto}>
                  Choose a different photo
                </Button>
              </div>
            </div>
          ) : (
            <label className="group relative flex cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center card-shadow transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:card-shadow-lg sm:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--brand-50),_transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-105">
                <Camera className="h-9 w-9" strokeWidth={1.75} />
              </div>
              <div className="relative">
                <p className="text-base font-semibold">Tap to capture or upload</p>
                <p className="mt-1.5 max-w-xs text-sm text-[var(--muted)]">
                  Take a clear, well-lit photo of the burn area
                </p>
              </div>
              <span className="relative inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all group-hover:bg-brand-600 group-hover:shadow-lg group-hover:shadow-brand-500/30">
                <ImageUp className="h-4 w-4" />
                Choose Photo
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoSelect(file);
                }}
              />
            </label>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={startScan}>
              Skip — use simulated result
            </Button>
            <Button onClick={startScan} disabled={!photoPreview}>
              <ScanLine className="h-4 w-4" />
              Analyze Photo
            </Button>
          </div>
        </div>
      )}

      {step === "scanning" && (
        <StepCard title="Scanning..." description="Hold the device steady over the burn area.">
          <ScanVisual rednessIdx={50} temperatureC={null} animated className="h-56 rounded-2xl" />
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface-2)" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="var(--brand-500)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                  className="transition-all duration-150 ease-linear"
                />
              </svg>
              <span className="absolute text-sm font-semibold text-brand-600">{progress}%</span>
            </div>
            <p className="text-sm text-[var(--muted)]">Capturing measurements...</p>
          </div>
        </StepCard>
      )}

      {step === "analysis" && metrics && (
        <StepCard title="Analyzing" description="This only takes a moment.">
          {photoPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Analyzing" className="max-h-80 w-full object-contain opacity-90" />
              {/* Corner targeting brackets — signals "the system is examining this image" without claiming a specific detected region. */}
              <div className="pointer-events-none absolute inset-4 sm:inset-6">
                <Corner className="left-0 top-0 border-l-2 border-t-2" />
                <Corner className="right-0 top-0 border-r-2 border-t-2" />
                <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
                <Corner className="bottom-0 right-0 border-b-2 border-r-2" />
              </div>
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 h-1/4 bg-gradient-to-b from-white/0 via-white/60 to-white/0 animate-scan-sweep" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[3px] border-brand-100" />
                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent border-l-transparent" />
                <Sparkles className="h-7 w-7 text-brand-500" />
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2.5">
            <BrainCircuit className="h-4 w-4 text-brand-500" />
            <p key={analysisPhase} className="animate-fade-in text-sm font-medium text-[var(--foreground)]">
              {(photoFile ? ANALYSIS_PHASES_PHOTO : ANALYSIS_PHASES_METRIC)[analysisPhase]}
            </p>
          </div>
        </StepCard>
      )}

      {step === "results" && metrics && severity && summary && classification && capturedAt && (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Analysis Complete</h2>
                <p className="text-xs text-[var(--muted)]">Review the result before saving to the patient&apos;s record.</p>
              </div>
            </div>
            {classificationSource && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                  classificationSource === "model" ? "bg-brand-50 text-brand-700" : "bg-[var(--surface-2)] text-[var(--muted)]"
                )}
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                {classificationSource === "model" ? "AI model classification" : "Simulated — no photo analyzed"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Primary column — the dominant visual + the one action that matters */}
            <div className="space-y-5">
              {uploadedImageUrl ? (
                <div className="animate-slide-up overflow-hidden rounded-3xl border border-[var(--border)] card-shadow" style={{ animationDelay: "40ms" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImageUrl} alt="Captured burn" className="max-h-80 w-full object-contain bg-[var(--surface-2)]" />
                </div>
              ) : (
                <div className="animate-slide-up" style={{ animationDelay: "40ms" }}>
                  <ScanVisual rednessIdx={metrics.rednessIdx} temperatureC={metrics.temperatureC} className="max-h-80 rounded-3xl" />
                </div>
              )}

              <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                <ResultHeroCard degree={classification.degree} thickness={classification.thickness} confidence={classification.confidence} />
              </div>

              <div className="flex flex-col-reverse gap-2 animate-slide-up sm:flex-row sm:justify-end" style={{ animationDelay: "160ms" }}>
                <Button variant="outline" onClick={retake}>
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleSave} loading={saving} className="bg-severity-900 hover:bg-severity-700">
                  <Save className="h-4 w-4" />
                  Save Case
                </Button>
              </div>
            </div>

            {/* Secondary column — supporting detail, never competing with the result */}
            <div className="space-y-4 animate-slide-up lg:sticky lg:top-6" style={{ animationDelay: "180ms" }}>
              <MetricStatPills temperatureC={metrics.temperatureC} confidence={classification.confidence} />

              <RecommendationBanner severity={severity} />

              <p className="flex items-start gap-1.5 rounded-2xl bg-brand-50 p-3.5 text-xs text-brand-700">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {summary.aiSummary}
              </p>
              {comparison && (
                <p className="rounded-2xl border border-[var(--border)] p-3.5 text-xs text-[var(--muted)]">{comparison.narrative}</p>
              )}

              <FirstAidChecklist items={getFirstAidGuidance(classification.degree)} />
              <CaseHistoryPanel capturedAt={capturedAt} bodyLocation={burnCase?.bodyLocation ?? ""} />

              <details className="group rounded-2xl border border-[var(--border)] p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Device Measurements
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="Redness idx" value={metrics.rednessIdx != null ? metrics.rednessIdx.toFixed(0) : "—"} />
                  <Metric label="Moisture idx" value={metrics.moistureIdx != null ? metrics.moistureIdx.toFixed(0) : "—"} />
                  <Metric label="Area" value={metrics.areaCm2 != null ? `${metrics.areaCm2.toFixed(1)} cm²` : "—"} />
                  <Metric label="Status" value={severity.replace("_", " ")} />
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <div className={cn("absolute h-6 w-6 border-white/80", className)} />;
}

function StepCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="animate-slide-up">
      <CardContent>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2 text-center">
      <p className="font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i <= idx ? "bg-brand-500" : "bg-[var(--surface-2)]"
              )}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-[var(--muted)]">
        Step {idx + 1} of {STEP_ORDER.length} · {STEP_LABEL[current]}
      </p>
    </div>
  );
}
