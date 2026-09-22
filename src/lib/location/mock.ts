export type FacilityType = "hospital" | "pharmacy" | "burn_specialist" | "doctor";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  openNow?: boolean;
}

// Default center: Cairo, Egypt — used when geolocation permission isn't
// granted. Facility coordinates are mock data clustered around this point;
// swap this module for a real Places API without touching callers.
export const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

export const MOCK_FACILITIES: Facility[] = [
  { id: "f1", name: "Cairo General Hospital", type: "hospital", lat: 30.061, lng: 31.249, address: "Corniche El Nil, Cairo", phone: "+20 2 2574 8200", openNow: true },
  { id: "f2", name: "Nile Burn & Reconstructive Center", type: "burn_specialist", lat: 30.033, lng: 31.222, address: "Dokki, Giza", phone: "+20 2 3336 1190", openNow: true },
  { id: "f3", name: "El Salam Pharmacy", type: "pharmacy", lat: 30.048, lng: 31.24, address: "Downtown, Cairo", openNow: true },
  { id: "f4", name: "Dr. Yasmin Fouad — Dermatology & Wound Care", type: "doctor", lat: 30.055, lng: 31.229, address: "Zamalek, Cairo", phone: "+20 2 2735 4410" },
  { id: "f5", name: "As-Salam International Hospital", type: "hospital", lat: 29.977, lng: 31.263, address: "Maadi, Cairo", phone: "+20 2 2524 0250", openNow: true },
  { id: "f6", name: "Seif Pharmacy 24h", type: "pharmacy", lat: 30.04, lng: 31.235, address: "Garden City, Cairo", openNow: true },
  { id: "f7", name: "Dr. Amr Salah — Plastic & Burn Surgery", type: "burn_specialist", lat: 30.07, lng: 31.34, address: "Heliopolis, Cairo", phone: "+20 2 2418 9922" },
  { id: "f8", name: "Ain Shams University Hospital", type: "hospital", lat: 30.081, lng: 31.29, address: "Abbassia, Cairo", phone: "+20 2 2483 7444" },
];

export function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function getNearbyFacilities(origin: { lat: number; lng: number }) {
  return MOCK_FACILITIES.map((f) => ({
    ...f,
    distanceKm: Math.round(haversineDistanceKm(origin, f) * 10) / 10,
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function directionsUrl(facility: Facility, origin?: { lat: number; lng: number }) {
  const dest = `${facility.lat},${facility.lng}`;
  const base = "https://www.google.com/maps/dir/?api=1";
  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : "";
  return `${base}${originParam}&destination=${dest}`;
}
