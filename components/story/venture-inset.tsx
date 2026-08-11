"use client";

import type { Feature, Position } from "geojson";
import {
  AttributionControl,
  Map as MaplibreMap,
  Marker,
  type GeoJSONSource,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./maplibre-worker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHART } from "./scenes";
import { fmtInt, type BBox, type StoryFeatureCollection } from "./use-story-data";

/* ------------------------------------------------------------------
   The pull-back. Opens on the plant site at aerial resolution, then
   flies out until the water around it fills with our cultch tracks and
   surveyed reef. The argument the venture band makes in prose, made
   once without any prose: their site and our work are the same coast.

   It is a second, self-contained MapLibre canvas rather than a borrowed
   scene on the main chart, because the main chart is pinned behind the
   scroll and this band is opaque — a scene change underneath it would
   play to a covered stage. Everything it draws is clipped to the frame
   first, so the second map carries a fraction of the coast-wide pack.
   ------------------------------------------------------------------ */

/** Degrees of padding around the site that the pull-back settles on. */
const CLIP_RADIUS = 0.35;
const START_ZOOM = 15.4;
const FLIGHT_MS = 5200;

export function VentureInset({
  center,
  siteLabel,
  bedding,
  cssTiers,
  reducedMotion,
}: {
  center: [number, number];
  siteLabel: string;
  bedding: StoryFeatureCollection | null;
  cssTiers: StoryFeatureCollection | null;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [flown, setFlown] = useState(false);

  const clip = useMemo<BBox>(
    () => [
      center[0] - CLIP_RADIUS,
      center[1] - CLIP_RADIUS,
      center[0] + CLIP_RADIUS,
      center[1] + CLIP_RADIUS,
    ],
    [center],
  );

  /* Clipping is what makes a second map affordable: the coast-wide
     bedding pack is 4 MB and almost none of it is near this site. */
  const localBedding = useMemo(() => clipToBBox(bedding, clip), [bedding, clip]);
  const localReef = useMemo(() => clipToBBox(cssTiers, clip, latestYear(cssTiers)), [cssTiers, clip]);
  const placements = localBedding?.features.length ?? 0;

  /* ---- boot ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      interactive: false,
      attributionControl: false,
      center,
      zoom: START_ZOOM,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
          },
        },
        layers: [
          { id: "abyss", type: "background", paint: { "background-color": "#061726" } },
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
            paint: {
              "raster-saturation": -0.45,
              "raster-brightness-max": 0.9,
              "raster-opacity": 0.9,
            },
          },
        ],
      },
    });

    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    map.once("style.load", () => {
      mapRef.current = map;
      setReady(true);
    });

    return () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current);
      fadeTimer.current = null;
      mapRef.current = null;
      map.remove();
    };
    // Built once; `center` is a fixed site, not a moving target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- our work, added once the canvas is up ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (localReef) {
      if (map.getSource("inset-reef")) {
        (map.getSource("inset-reef") as GeoJSONSource).setData(localReef);
      } else {
        map.addSource("inset-reef", { type: "geojson", data: localReef });
        map.addLayer({
          id: "inset-reef-fill",
          type: "fill",
          source: "inset-reef",
          paint: { "fill-color": CHART.tiers.med, "fill-opacity": 0 },
        });
      }
    }

    if (localBedding) {
      if (map.getSource("inset-bedding")) {
        (map.getSource("inset-bedding") as GeoJSONSource).setData(localBedding);
      } else {
        map.addSource("inset-bedding", { type: "geojson", data: localBedding });
        map.addLayer({
          id: "inset-bedding-glow",
          type: "line",
          source: "inset-bedding",
          layout: { "line-cap": "round" },
          paint: {
            "line-color": CHART.cultch,
            "line-opacity": 0,
            "line-width": ["interpolate", ["linear"], ["zoom"], 9, 5, 14, 12],
            "line-blur": 3,
          },
        });
        map.addLayer({
          id: "inset-bedding",
          type: "line",
          source: "inset-bedding",
          layout: { "line-cap": "round" },
          paint: {
            "line-color": CHART.cultch,
            "line-opacity": 0,
            "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.6, 14, 4],
          },
        });
      }
    }

    const marker = new Marker({ element: siteMarker(siteLabel), anchor: "bottom" })
      .setLngLat(center)
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [ready, localBedding, localReef, center, siteLabel]);

  /* ---- the flight ---- */
  const pullBack = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = boundsOf([localBedding, localReef], clip, center);
    const camera =
      map.cameraForBounds(toLngLatBounds(bounds), { padding: 28 }) ??
      map.cameraForBounds(toLngLatBounds(bounds), { padding: 8 });

    const paint = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress));
      if (map.getLayer("inset-reef-fill")) {
        map.setPaintProperty("inset-reef-fill", "fill-opacity", 0.45 * t);
      }
      if (map.getLayer("inset-bedding")) {
        map.setPaintProperty("inset-bedding", "line-opacity", 0.95 * t);
        map.setPaintProperty("inset-bedding-glow", "line-opacity", 0.16 * t);
      }
    };

    if (reducedMotion) {
      if (camera) map.jumpTo({ center: camera.center, zoom: camera.zoom ?? 10 });
      paint(1);
      setFlown(true);
      return;
    }

    if (camera) {
      map.flyTo({
        center: camera.center,
        zoom: camera.zoom ?? 10,
        duration: FLIGHT_MS,
        curve: 1.42,
        essential: true,
      });
    }

    /* Our work fades up over the back half of the climb, so the opening
       frame is honestly just their site and nothing of ours. */
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    const started = performance.now();
    paint(0);
    fadeTimer.current = setInterval(() => {
      const elapsed = (performance.now() - started) / FLIGHT_MS;
      paint((elapsed - 0.4) / 0.6);
      if (elapsed >= 1) {
        if (fadeTimer.current) clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        paint(1);
        setFlown(true);
      }
    }, 70);
  }, [center, clip, localBedding, localReef, reducedMotion]);

  /* Runs itself the first time it is actually looked at. */
  useEffect(() => {
    const node = containerRef.current;
    if (!node || !ready || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        pullBack();
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, pullBack]);

  const replay = () => {
    const map = mapRef.current;
    if (!map) return;
    setFlown(false);
    map.jumpTo({ center, zoom: START_ZOOM });
    pullBack();
  };

  return (
    <figure className="story-inset">
      <div className="story-inset-frame">
        <div ref={containerRef} className="h-full w-full" />
        <div className="story-inset-legend" aria-hidden="true">
          <span>
            <i style={{ background: CHART.cultch }} /> Cultch placed
          </span>
          <span>
            <i style={{ background: CHART.tiers.med }} /> Surveyed reef
          </span>
        </div>
        <button type="button" onClick={replay} className="story-inset-replay">
          {flown ? "Run it again" : "Pulling back"}
        </button>
      </div>
      <figcaption className="prose-cv mt-4 text-[0.9375rem]">
        {siteLabel} at the center of the frame, and the water around it.{" "}
        {placements > 0 ? (
          <>
            <strong>{fmtInt(placements)} logged cultch placements</strong> and the surveyed reef
            they built are already in this view.
          </>
        ) : (
          <>The shaded water is surveyed reef at commercial density.</>
        )}{" "}
        Imagery © Esri/Maxar. Everything drawn over it is our own survey record.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function siteMarker(label: string): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "story-inset-poi";
  const name = document.createElement("span");
  name.textContent = label;
  const pin = document.createElement("i");
  pin.setAttribute("aria-hidden", "true");
  root.append(name, pin);
  return root;
}

function latestYear(fc: StoryFeatureCollection | null): number | undefined {
  if (!fc) return undefined;
  const years = fc.features
    .map((f) => Number(f.properties?.year))
    .filter((y) => Number.isFinite(y));
  return years.length ? Math.max(...years) : undefined;
}

function ringBBox(ring: Position[]): BBox {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lon, lat] of ring) {
    w = Math.min(w, lon);
    s = Math.min(s, lat);
    e = Math.max(e, lon);
    n = Math.max(n, lat);
  }
  return [w, s, e, n];
}

function coordsBBox(coordinates: unknown): BBox {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  const visit = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === "number" && typeof c[1] === "number") {
      w = Math.min(w, c[0]);
      s = Math.min(s, c[1]);
      e = Math.max(e, c[0]);
      n = Math.max(n, c[1]);
      return;
    }
    c.forEach(visit);
  };
  visit(coordinates);
  return [w, s, e, n];
}

const overlaps = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

/** Cut a coast-wide collection down to one frame. Polygons are filtered
    ring by ring, because the reef tiers arrive as a handful of enormous
    MultiPolygons whose own bbox spans the whole Gulf — filtering those
    at feature level would keep every last one of them. */
function clipToBBox(
  fc: StoryFeatureCollection | null,
  box: BBox,
  year?: number,
): StoryFeatureCollection | null {
  if (!fc) return null;
  const features: Feature[] = [];

  for (const feature of fc.features) {
    if (year != null && Number(feature.properties?.year) !== year) continue;
    const geometry = feature.geometry;

    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      const polygons =
        geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
      const kept = polygons.filter((polygon) => overlaps(ringBBox(polygon[0]), box));
      if (kept.length === 0) continue;
      features.push({
        ...feature,
        geometry: { type: "MultiPolygon", coordinates: kept },
      });
      continue;
    }

    if (!("coordinates" in geometry)) continue;
    if (overlaps(coordsBBox(geometry.coordinates), box)) features.push(feature);
  }

  if (features.length === 0) return null;
  return { type: "FeatureCollection", features };
}

/** Frame everything we kept, and always the site itself. */
function boundsOf(
  collections: (StoryFeatureCollection | null)[],
  fallback: BBox,
  site: [number, number],
): BBox {
  let w = site[0];
  let s = site[1];
  let e = site[0];
  let n = site[1];
  let found = false;

  for (const fc of collections) {
    if (!fc) continue;
    for (const feature of fc.features) {
      if (!("coordinates" in feature.geometry)) continue;
      const [fw, fs, fe, fn] = coordsBBox(feature.geometry.coordinates);
      if (!Number.isFinite(fw)) continue;
      found = true;
      w = Math.min(w, fw);
      s = Math.min(s, fs);
      e = Math.max(e, fe);
      n = Math.max(n, fn);
    }
  }

  return found ? [w, s, e, n] : fallback;
}

function toLngLatBounds(b: BBox): LngLatBoundsLike {
  return [
    [b[0], b[1]],
    [b[2], b[3]],
  ];
}
