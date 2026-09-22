"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Wifi, Battery, SignalHigh, Clock, Activity, Pencil, RadioTower, CheckCircle2, XCircle } from "lucide-react";
import { connectDevice, disconnectDevice, renameDevice, testDeviceConnectionAction } from "@/lib/actions/devices";
import type { DeviceProbeResult } from "@/lib/device/real";
import { formatRelativeDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface DeviceVM {
  id: string;
  name: string;
  serial: string;
  status: string;
  connection: string;
  battery: number;
  signal: string;
  ipAddress: string;
  lastConnected: Date | null;
  isMine: boolean;
}

export function DeviceCard({ device }: { device: DeviceVM }) {
  const [pending, startTransition] = useTransition();
  const [renameOpen, setRenameOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [name, setName] = useState(device.name);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<DeviceProbeResult | null>(null);
  const router = useRouter();
  const connected = device.status === "connected";

  async function runProbe() {
    setProbing(true);
    setProbeResult(null);
    const res = await testDeviceConnectionAction(device.ipAddress);
    setProbing(false);
    if ("success" in res) setProbeResult(res);
  }

  function toggle() {
    startTransition(async () => {
      if (connected) await disconnectDevice(device.id);
      else await connectDevice(device.id);
      router.refresh();
    });
  }

  function saveRename() {
    startTransition(async () => {
      await renameDevice(device.id, name);
      setRenameOpen(false);
      router.refresh();
    });
  }

  return (
    <Card className="animate-fade-in">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">{device.name}</p>
            <p className="text-xs text-[var(--muted)]">{device.serial}</p>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              connected ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]" : "bg-[var(--surface-2)] text-[var(--muted)]"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-[var(--status-ok-dot)] animate-pulse-dot" : "bg-[var(--muted)]")} />
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat icon={Wifi} label="Connection" value={device.connection.toUpperCase()} />
          <Stat icon={Battery} label="Battery" value={`${device.battery}%`} />
          <Stat icon={SignalHigh} label="Signal" value={device.signal} />
          <Stat icon={Clock} label="Last connected" value={device.lastConnected ? formatRelativeDay(device.lastConnected) : "Never"} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" variant={connected ? "outline" : "primary"} onClick={toggle} loading={pending}>
            {connected ? "Disconnect" : "Connect"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRenameOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Rename
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDiagOpen(true)}>
            <Activity className="h-3.5 w-3.5" />
            Diagnostics
          </Button>
        </div>
      </CardContent>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename device">
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename} loading={pending}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={diagOpen} onClose={() => setDiagOpen(false)} title="Device diagnostics" description={device.name}>
        <div className="space-y-2 text-sm">
          <DiagRow label="IP address" value={device.ipAddress} />
          <DiagRow label="Firmware" value="v2.4.1" />
          <DiagRow label="Sensor calibration" value="OK — last calibrated 12 days ago" />
          <DiagRow label="Thermal sensor" value="Nominal" />
          <DiagRow label="Connectivity test" value={connected ? "Passed" : "Not connected"} />
          <DiagRow label="Storage" value="38.2 MB / 512 MB used" />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <RadioTower className="h-3.5 w-3.5" />
                Live connection test
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Only works if this computer is on the device&apos;s own Wi-Fi network.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={runProbe} loading={probing}>
              Test now
            </Button>
          </div>

          {probeResult && (
            <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  probeResult.reachable ? "text-[var(--status-ok-fg)]" : "text-[var(--status-danger-fg)]"
                )}
              >
                {probeResult.reachable ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {probeResult.reachable ? "Device reached" : "Not reachable"}
              </p>
              {probeResult.reachable ? (
                <>
                  <DiagRow label="Responded on" value={probeResult.path ?? "—"} />
                  <DiagRow
                    label="Temperature parsed"
                    value={probeResult.temperatureC != null ? `${probeResult.temperatureC}°C` : "Not found in response"}
                  />
                  {probeResult.rawResponse && (
                    <div>
                      <p className="mb-1 text-xs text-[var(--muted)]">Raw response (first 500 chars):</p>
                      <pre className="max-h-32 overflow-auto rounded-xl bg-[var(--surface-2)] p-2 text-[11px] whitespace-pre-wrap break-all">
                        {probeResult.rawResponse}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[var(--muted)]">{probeResult.error}</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-2.5">
      <Icon className="h-3.5 w-3.5 text-[var(--muted)]" />
      <p className="mt-1 text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
