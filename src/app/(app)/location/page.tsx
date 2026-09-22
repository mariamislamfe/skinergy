import { NearbyFacilities } from "@/components/location/NearbyFacilities";

export default function LocationPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">Find Nearby Medical Help</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Hospitals, burn centers, doctors, and pharmacies near you.</p>
      <div className="mt-6">
        <NearbyFacilities />
      </div>
    </div>
  );
}
