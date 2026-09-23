"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { testDeviceConnectionAction } from "@/lib/actions/devices";
import type { DeviceProbeResult } from "@/lib/device/real";
import { Thermometer, Wifi, WifiOff, Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

export function LiveMonitor({ ipAddress }: { ipAddress: string }) {
  const [result, setResult] = useState<DeviceProbeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const res = await testDeviceConnectionAction(ipAddress);
    inFlight.current = false;
    if ("success" in res) {
      setResult(res);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [ipAddress]);

  useEffect(() => {
    poll();
    if (!running) return;
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll, running]);

  const reachable = result?.reachable ?? false;

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors",
          reachable ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]" : "bg-[var(--surface-2)] text-[var(--muted)]"
        )}
      >
        <span className="flex items-center gap-1.5">
          {reachable ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {loading ? "Checking..." : reachable ? "Live · Receiving data" : "Device not reachable"}
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              reachable ? "bg-[var(--status-ok-dot)] animate-pulse-dot" : "bg-[var(--muted)]"
            )}
          />
        </span>
        <span>{ipAddress}</span>
      </div>

      <CardContent>
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
                reachable ? "bg-brand-50 text-brand-600" : "bg-[var(--surface-2)] text-[var(--muted)]"
              )}
            >
              <Thermometer className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold tabular-nums tracking-tight">
                {result?.reachable && result.temperatureC != null ? `${result.temperatureC}°C` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}`
                  : "Waiting for first reading..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? "Pause" : "Resume"}
            </Button>
            <Button size="sm" variant="ghost" onClick={poll} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {result && !result.reachable && (
          <p className="mt-4 rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">{result.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
