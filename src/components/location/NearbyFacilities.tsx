"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  Hospital,
  Pill,
  Stethoscope,
  Navigation,
  LocateFixed,
  Loader2,
} from "lucide-react";
import {
  DEFAULT_CENTER,
  getNearbyFacilities,
  directionsUrl,
  type FacilityType,
} from "@/lib/location/mock";

const TYPE_CONFIG: Record<FacilityType, { label: string; icon: typeof Hospital; tone: string }> = {
  hospital: { label: "Hospital", icon: Hospital, tone: "bg-brand-100 text-brand-700" },
  pharmacy: { label: "Pharmacy", icon: Pill, tone: "bg-brand-50 text-brand-600" },
  burn_specialist: { label: "Burn Specialist", icon: Stethoscope, tone: "bg-brand-100 text-brand-700" },
  doctor: { label: "Doctor", icon: Stethoscope, tone: "bg-brand-50 text-brand-600" },
};

export function NearbyFacilities() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [filter, setFilter] = useState<FacilityType | "all">("all");

  function requestLocation() {
    setPermission("requesting");
    if (!navigator.geolocation) {
      setPermission("denied");
      setOrigin(DEFAULT_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermission("granted");
      },
      () => {
        setPermission("denied");
        setOrigin(DEFAULT_CENTER);
      },
      { timeout: 8000 }
    );
  }

  const effectiveOrigin = origin ?? DEFAULT_CENTER;
  const facilities = getNearbyFacilities(effectiveOrigin).filter((f) => filter === "all" || f.type === filter);

  if (permission === "idle") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MapPin className="h-7 w-7" />
          </div>
          <h2 className="text-base font-semibold">Find nearby medical help</h2>
          <p className="mt-1.5 max-w-sm text-sm text-[var(--muted)]">
            Allow location access to find the nearest hospitals, burn centers, doctors, and pharmacies.
          </p>
          <Button className="mt-5" onClick={requestLocation}>
            <LocateFixed className="h-4 w-4" />
            Use my location
          </Button>
          <button
            onClick={() => {
              setOrigin(DEFAULT_CENTER);
              setPermission("denied");
            }}
            className="mt-3 text-xs text-[var(--muted)] hover:underline"
          >
            Continue without location
          </button>
        </CardContent>
      </Card>
    );
  }

  if (permission === "requesting") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <p className="mt-3 text-sm text-[var(--muted)]">Requesting your location...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {permission === "denied" && (
        <p className="rounded-xl bg-[var(--status-warn-bg)] px-3.5 py-2.5 text-sm text-[var(--status-warn-fg)]">
          Using an approximate location. Enable location access for more accurate distances.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        {(Object.keys(TYPE_CONFIG) as FacilityType[]).map((t) => (
          <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)} label={TYPE_CONFIG[t].label} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {facilities.map((f) => {
          const cfg = TYPE_CONFIG[f.type];
          const Icon = cfg.icon;
          return (
            <Card key={f.id} className="animate-fade-in">
              <CardContent className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-[var(--muted)]">{cfg.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{f.address}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-600">{f.distanceKm} km</span>
                    <a
                      href={directionsUrl(f, origin ?? undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-[var(--foreground)] hover:text-brand-600"
                    >
                      <Navigation className="h-3 w-3" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active ? "bg-brand-500 text-white" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
