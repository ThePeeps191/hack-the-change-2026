"use client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { CAMPUS_CENTER } from "@/lib/config";
import { tick } from "@/lib/feedback";

type MLMap = maplibregl.Map;

// MapLibre 6 loads its worker by URL, which the bundler can't resolve, so we
// serve a copy from /public. Re-copy it if you bump maplibre-gl:
//   cp node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs public/maplibre/worker-<version>.js
maplibregl.setWorkerUrl("/maplibre/worker-6.16.0.js");

export type GlobeMarker = { id: string; lat: number; lng: number; color: string; label: string; icon?: string; hue?: number };

// A pin with a hue gets a light tint of it and its icon in a deep shade.
function tint(el: HTMLElement, hue?: number) {
  if (hue == null) {
    delete el.dataset.tint;
    return;
  }
  el.dataset.tint = "";
  el.style.setProperty("--h", String(hue));
}

// Always the light map, even when the phone is in dark mode: streets and
// buildings read better, and the white-ringed pins are made for it.
const STYLE = "https://tiles.openfreemap.org/styles/positron";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Globe projection, a soft daylight atmosphere and 3D buildings. Re-applied
// whenever the style (re)loads.
function dress(map: MLMap) {
  map.setProjection({ type: "globe" });
  map.setSky({
    "sky-color": "#4f8fdc",
    "horizon-color": "#b9d6f3",
    "fog-color": "#f6f6f2",
    "sky-horizon-blend": 0.6,
    "horizon-fog-blend": 0.6,
    "fog-ground-blend": 0.7,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 6, 1, 9, 0],
  });
  if (map.getSource("openmaptiles") && !map.getLayer("amble-3d")) {
    // Draw the 3D blocks above every road and flat building layer (some
    // styles put a label layer before the roads, so "first symbol" isn't
    // enough), but still under the labels that come after them.
    const layers = map.getStyle().layers;
    const ground = (l: (typeof layers)[number]) => ["transportation", "building", "aeroway"].includes((l as { "source-layer"?: string })["source-layer"] ?? "") && l.type !== "symbol";
    const lastGround = layers.reduce((at, l, i) => (ground(l) ? i : at), -1);
    const firstSymbol = layers.slice(lastGround + 1).find((l) => l.type === "symbol")?.id;
    map.addLayer(
      {
        id: "amble-3d",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#f3f1ea",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 0.82],
        },
      },
      firstSymbol,
    );
  }
}

function markerEl(m: GlobeMarker, onPick: (id: string) => void) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", m.label);
  el.className = "amble-marker";
  el.style.setProperty("--c", m.color);
  const label = `<span class="amble-marker-label">${m.label.replace(/[<>&]/g, "")}</span>`;
  el.innerHTML = m.icon
    ? `<span class="amble-pin"><span class="amble-pin-face">${m.icon}</span><span class="amble-pin-tip"></span></span>${label}`
    : `<span class="amble-marker-dot"></span>${label}`;
  if (m.icon) el.dataset.pin = "";
  tint(el, m.hue);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onPick(m.id);
  });
  return el;
}

// A 3D globe that drag-rotates with quiet detent ticks, like an alarm-time
// picker. It opens on the whole Earth and dives down to campus.
export default function GlobeMap({
  markers,
  selected,
  onSelect,
  focus,
  className = "",
  intro = true,
  here = null,
  fit = false,
}: {
  markers: GlobeMarker[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  focus?: { lat: number; lng: number } | null;
  className?: string;
  intro?: boolean;
  // Your own position, drawn as a pulsing blue dot. Stays on this phone.
  here?: { lat: number; lng: number } | null;
  // Frame every marker when the map opens, instead of just campus.
  fit?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const pins = useRef(new Map<string, maplibregl.Marker>());
  const pick = useRef(onSelect);
  const you = useRef<maplibregl.Marker | null>(null);
  const loaded = useRef(false);
  const framed = useRef(false);
  const latest = useRef(markers);
  useEffect(() => {
    latest.current = markers;
  }, [markers]);

  // The camera that shows every marker, or null when there's one or none.
  function frame(m: MLMap) {
    const pts = latest.current;
    if (!fit || pts.length < 2) return null;
    const lngs = pts.map((p) => p.lng);
    const lats = pts.map((p) => p.lat);
    const cam = m.cameraForBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 70, bottom: 50, left: 40, right: 40 }, maxZoom: 15.4 },
    );
    return cam ? { center: cam.center, zoom: cam.zoom ?? 13, pitch: 45, bearing: -24 } : null;
  }
  useEffect(() => {
    pick.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE,
      center: [CAMPUS_CENTER.lng + 40, CAMPUS_CENTER.lat - 20],
      zoom: 0.35,
      attributionControl: { compact: true },
      maxPitch: 70,
    });
    map.current = m;
    m.on("style.load", () => dress(m));
    m.once("load", () => {
      box.current?.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
      loaded.current = true;
      const framedCam = frame(m);
      if (framedCam) framed.current = true;
      const target = framedCam ?? { center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat] as [number, number], zoom: 15.4, pitch: 56, bearing: -24 };
      // The whole-Earth dive plays once per visit; after that we open on campus.
      let seen = false;
      try {
        seen = sessionStorage.getItem("amble:globe-intro") === "1";
        sessionStorage.setItem("amble:globe-intro", "1");
      } catch {}
      if (reduced() || !intro || seen) m.jumpTo(target);
      else setTimeout(() => m.flyTo({ ...target, duration: 3400, curve: 1.4, essential: false }), 350);
    });

    // Detent ticks while the person drags, spins or zooms.
    let anchor = m.getCenter();
    let zoomAnchor = m.getZoom();
    let last = 0;
    const onMove = (e: { originalEvent?: Event }) => {
      if (!e.originalEvent) return; // ignore our own fly-to animations
      const now = performance.now();
      const p = m.project(anchor);
      const { width, height } = m.getContainer().getBoundingClientRect();
      const moved = Math.hypot(p.x - width / 2, p.y - height / 2);
      const zoomed = Math.abs(m.getZoom() - zoomAnchor);
      if ((moved > 42 || zoomed > 0.35) && now - last > 45) {
        tick(0.5);
        last = now;
        anchor = m.getCenter();
        zoomAnchor = m.getZoom();
      }
    };
    const reset = () => {
      anchor = m.getCenter();
      zoomAnchor = m.getZoom();
    };
    m.on("move", onMove);
    m.on("movestart", reset);

    const ro = new ResizeObserver(() => m.resize());
    ro.observe(box.current);

    const placed = pins.current;
    return () => {
      ro.disconnect();
      placed.clear();
      m.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- create the map once; intro only matters then

  // If the markers arrive after the map has opened, frame them once.
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current || framed.current) return;
    const cam = frame(m);
    if (!cam) return;
    framed.current = true;
    m.flyTo({ ...cam, duration: reduced() ? 0 : 1400, essential: false });
  }, [markers]); // eslint-disable-line react-hooks/exhaustive-deps -- frame is stable enough; run when markers land

  // The "you are here" dot.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!here) {
      you.current?.remove();
      you.current = null;
      return;
    }
    if (!you.current) {
      const el = document.createElement("span");
      el.className = "amble-you";
      el.setAttribute("aria-label", "You are here");
      el.setAttribute("role", "img");
      you.current = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([here.lng, here.lat]).addTo(m);
    } else you.current.setLngLat([here.lng, here.lat]);
  }, [here]);

  // Keep markers in sync.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const keep = new Set(markers.map((k) => k.id));
    for (const [id, mk] of pins.current) {
      if (!keep.has(id)) {
        mk.remove();
        pins.current.delete(id);
      }
    }
    for (const k of markers) {
      const existing = pins.current.get(k.id);
      if (existing) {
        existing.setLngLat([k.lng, k.lat]);
        existing.getElement().style.setProperty("--c", k.color);
        tint(existing.getElement(), k.hue);
        continue;
      }
      const mk = new maplibregl.Marker({ element: markerEl(k, (id) => pick.current?.(id)), anchor: "center" }).setLngLat([k.lng, k.lat]).addTo(m);
      pins.current.set(k.id, mk);
    }
  }, [markers]);

  useEffect(() => {
    for (const [id, mk] of pins.current) mk.getElement().toggleAttribute("data-selected", id === selected);
  }, [selected, markers]);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    m.flyTo({ center: [focus.lng, focus.lat], zoom: Math.max(m.getZoom(), 16), pitch: 58, duration: reduced() ? 0 : 1600, essential: false });
  }, [focus]);

  return (
    <div
      ref={box}
      className={`size-full ${className}`}
      style={{ background: "radial-gradient(120% 90% at 50% 100%, var(--color-sky-bottom), var(--color-sky-top))" }}
    />
  );
}
