import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";

export default async function DevicesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const devices = await prisma.device.findMany({ orderBy: { createdAt: "asc" } });
  const mine = devices.filter((d) => d.ownerId === session.user.id);
  const available = devices.filter((d) => d.ownerId !== session.user.id);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Device</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Manage your Skinergy scanning device.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">My Device</h2>
        {mine.length === 0 ? (
          <EmptyState icon={Cpu} title="No device paired" description="Connect an available device below to get started." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {mine.map((d) => (
              <DeviceCard
                key={d.id}
                device={{
                  id: d.id,
                  name: d.name,
                  serial: d.serial,
                  status: d.status,
                  connection: d.connection,
                  battery: d.battery,
                  signal: d.signal,
                  ipAddress: d.ipAddress,
                  lastConnected: d.lastConnected,
                  isMine: true,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Available Devices</h2>
        <p className="mb-3 -mt-2 text-xs text-[var(--muted)]">
          Other Skinergy devices on the network — useful for hospitals managing multiple scanners.
        </p>
        {available.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No other devices available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {available.map((d) => (
              <DeviceCard
                key={d.id}
                device={{
                  id: d.id,
                  name: d.name,
                  serial: d.serial,
                  status: d.status,
                  connection: d.connection,
                  battery: d.battery,
                  signal: d.signal,
                  ipAddress: d.ipAddress,
                  lastConnected: d.lastConnected,
                  isMine: false,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
