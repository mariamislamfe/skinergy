import { cn } from "@/lib/utils";

/**
 * Renders the captured burn photo when a scan has one. Otherwise falls back
 * to an abstract, data-driven visualization instead of a fabricated photo: a
 * thermal-style gradient whose intensity reflects the redness index.
 */
export function ScanVisual({
  rednessIdx,
  temperatureC,
  imageUrl,
  className,
  animated = false,
}: {
  rednessIdx: number | null;
  temperatureC: number | null;
  imageUrl?: string | null;
  className?: string;
  animated?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/5", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Burn scan" className="h-full w-full object-cover" />
      </div>
    );
  }

  // Stays within the brand red family (hue ~357) throughout — only
  // saturation/lightness shift with redness — so this never drifts into
  // blue/green/orange the way a full thermal hue-rotation would.
  const intensity = Math.min(1, Math.max(0, (rednessIdx ?? 30) / 100));
  const lightness = 60 - intensity * 38; // medium red (low) -> deep red (high), always dark enough for white text
  const saturation = 55 + intensity * 30;

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl",
        className
      )}
      style={{
        background: `radial-gradient(ellipse at center, hsl(357 ${saturation}% ${lightness + 8}% / 0.95), hsl(357 ${saturation + 10}% ${lightness - 12}% / 0.97) 70%)`,
      }}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:repeating-linear-gradient(45deg,white_0,white_1px,transparent_1px,transparent_8px)]" />
      {animated && (
        <div className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-white/0 via-white/40 to-white/0 animate-scan-sweep" />
      )}
      <div className="relative flex flex-col items-center text-white drop-shadow-md">
        {temperatureC != null && <span className="text-2xl font-semibold">{temperatureC.toFixed(1)}°C</span>}
        {rednessIdx != null && <span className="text-xs opacity-80">Redness index {rednessIdx.toFixed(0)}</span>}
      </div>
    </div>
  );
}
