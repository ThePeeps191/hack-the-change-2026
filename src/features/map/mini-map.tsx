import type { ReactNode } from "react";

// A schematic map: plots points by lat/lng inside their bounding box. Stand-in
// until the real map (Google Maps JS) lands, so screens can use it today.
export type Pin = { id: string; lat: number; lng: number; node: ReactNode; label?: string };

export function MiniMap({ pins, className = "" }: { pins: Pin[]; className?: string }) {
  if (pins.length === 0) return null;
  // Equirectangular with a cos(lat) correction, fitted into a square with a
  // margin so labels near the edge stay inside.
  const k = Math.cos((pins[0].lat * Math.PI) / 180);
  const xs = pins.map((p) => p.lng * k);
  const ys = pins.map((p) => p.lat);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.002) * 1.5;
  const x = (lng: number) => 50 + ((lng * k - cx) / span) * 100;
  const y = (lat: number) => 50 - ((lat - cy) / span) * 100;

  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-card border border-line bg-[color-mix(in_oklab,var(--color-accent-soft)_60%,var(--color-surface))] ${className}`}>
      <svg className="absolute inset-0 size-full opacity-40" aria-hidden>
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0v32" fill="none" stroke="var(--color-line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {pins.map((p) => (
        <div key={p.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x(p.lng)}%`, top: `${y(p.lat)}%` }}>
          <div className="flex flex-col items-center gap-1">
            <div className="pointer-events-auto">{p.node}</div>
            {p.label && <span className="pointer-events-none rounded-chip bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-card">{p.label}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
