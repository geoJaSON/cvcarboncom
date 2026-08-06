"use client";

import type { Feature } from "geojson";
import {
  AttributionControl,
  Map as MaplibreMap,
  setWorkerUrl,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LayerSpecification,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* MapLibre's default worker is spawned from a bundler-transformed
   module, which Turbopack breaks silently — every GeoJSON source then
   hangs forever unloaded. Serve the library's own pristine worker
   (copied into public/maplibre/ by the sync-maplibre-worker script,
   which predev/prebuild run automatically). */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
import { useEffect, useRef, useState } from "react";
import { CHART, FALLBACK_BOUNDS, SCENES, type SceneId } from "./scenes";
import type { BBox, StoryData, StoryFeatureCollection } from "./use-story-data";

export type ChartView = { lat: number; lon: number; zoom: number };

type MapStageProps = {
  data: StoryData;
  activeScene: SceneId;
  reducedMotion: boolean;
  onView?: (view: ChartView) => void;
};

/* ------------------------------------------------------------------
   The chart itself: one non-interactive MapLibre canvas pinned behind
   the scroll. Scenes drive it; it never drives itself.
   ------------------------------------------------------------------ */
export function MapStage({ data, activeScene, reducedMotion, onView }: MapStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const sweepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  /* ---- boot ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      interactive: false,
      attributionControl: false,
      center: [-91.8, 29.7],
      zoom: 7.2,
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
              // Pull the imagery toward the brand: desaturated, dimmed,
              // sitting on an abyss floor like a chart at night.
              "raster-saturation": -0.55,
              "raster-brightness-max": 0.85,
              "raster-opacity": 0.85,
            },
          },
        ],
      },
    });

    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      mapRef.current = map;
      setReady(true);
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__storyMap = map;
      }
    });

    if (onView) {
      map.on("move", () => {
        const c = map.getCenter();
        onView({ lat: c.lat, lon: c.lng, zoom: map.getZoom() });
      });
    }

    return () => {
      if (sweepTimer.current) clearInterval(sweepTimer.current);
      mapRef.current = null;
      map.remove();
    };
    // The map is created exactly once; onView is stable in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- sources + layers, added as snapshot files arrive ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    ensureGraticule(map, data.manifest?.bounds?.overall ?? FALLBACK_BOUNDS);

    if (data.layers.coverage) {
      ensureSource(map, "coverage", data.layers.coverage);
      ensureLayer(map, {
        id: "coverage",
        type: "circle",
        source: "coverage",
        layout: { visibility: "none" },
        paint: {
          "circle-color": CHART.coverage,
          "circle-blur": 0.5,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["get", "n"],
            1,
            0.12,
            50,
            0.3,
            400,
            0.5,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            1.7,
            9,
            3,
            12,
            6,
          ],
        },
      });
    }

    if (data.layers.density) {
      ensureSource(map, "density", hexify(data.layers.density));
      ensureLayer(map, {
        id: "density",
        type: "fill-extrusion",
        source: "density",
        layout: { visibility: "none" },
        paint: {
          "fill-extrusion-color": [
            "step",
            ["get", "v"],
            CHART.densityRamp[0],
            CHART.densityBins[0],
            CHART.tiers.low,
            CHART.densityBins[1],
            CHART.tiers.med,
            CHART.densityBins[2],
            CHART.tiers.high,
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["get", "v"],
            0,
            40,
            600,
            9000,
          ],
          "fill-extrusion-opacity": 0.82,
        },
      });
    }

    if (data.layers.cssTiers) {
      ensureSource(map, "css", data.layers.cssTiers);
      ensureLayer(map, {
        id: "css-fill",
        type: "fill",
        source: "css",
        layout: { visibility: "none" },
        paint: {
          "fill-color": tierColor(),
          "fill-opacity": 0.42,
        },
      });
      ensureLayer(map, {
        id: "css-line",
        type: "line",
        source: "css",
        layout: { visibility: "none" },
        paint: {
          "line-color": tierColor(),
          "line-width": 1.1,
          "line-opacity": 0.85,
        },
      });
    }

    if (data.layers.bedding) {
      ensureSource(map, "bedding", data.layers.bedding);
      ensureLayer(map, {
        id: "bedding-glow",
        type: "line",
        source: "bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.16,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 8, 13, 14],
          "line-blur": 3,
        },
      });
      ensureLayer(map, {
        id: "bedding",
        type: "line",
        source: "bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.95,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2.4, 13, 4.5],
        },
      });
    }
  }, [ready, data]);

  /* ---- scene changes ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const scene = SCENES[activeScene];
    if (sweepTimer.current) {
      clearInterval(sweepTimer.current);
      sweepTimer.current = null;
    }

    /* camera — retry with minimal padding rather than silently freeze
       when the padded fit doesn't fit (short landscape viewports) */
    const bounds = resolveBounds(scene.view, data);
    const camera =
      map.cameraForBounds(toLngLatBounds(bounds), {
        padding: scenePadding(),
        bearing: scene.bearing,
      }) ??
      map.cameraForBounds(toLngLatBounds(bounds), { padding: 24, bearing: scene.bearing });
    if (camera) {
      const target = {
        center: camera.center,
        zoom: (camera.zoom ?? 7) + (scene.zoomBias ?? 0),
        pitch: scene.pitch,
        bearing: scene.bearing,
      };
      if (reducedMotion) {
        map.jumpTo(target);
      } else {
        map.easeTo({ ...target, duration: 2400, essential: true });
      }
    }

    /* layer visibility */
    setVisible(map, "graticule", !!scene.layers.graticule);
    setVisible(map, "coverage", !!scene.layers.coverage);
    setVisible(map, "density", !!scene.layers.density);
    setVisible(map, "css-fill", !!scene.layers.css);
    setVisible(map, "css-line", !!scene.layers.css);
    setVisible(map, "bedding", !!scene.layers.bedding);
    setVisible(map, "bedding-glow", !!scene.layers.bedding);

    /* reef tier filter — latest survey year only, or fills stack up */
    if (scene.layers.css && map.getLayer("css-fill") && data.layers.cssTiers) {
      const tiers = scene.cssTiers ?? ["low", "med", "high"];
      const latest = Math.max(
        ...data.layers.cssTiers.features.map((f) => Number(f.properties?.year ?? 0)),
      );
      const filter: FilterSpecification = [
        "all",
        ["==", ["get", "year"], latest],
        ["in", ["get", "tier"], ["literal", tiers]],
      ];
      map.setFilter("css-fill", filter);
      map.setFilter("css-line", filter);
    }

    /* cultch sweep — replay placements year by year */
    if (scene.layers.bedding && map.getLayer("bedding") && data.layers.bedding) {
      const years = beddingYears(data.layers.bedding);
      if (!scene.beddingSweep || reducedMotion || years.length === 0) {
        map.setFilter("bedding", null);
        map.setFilter("bedding-glow", null);
      } else {
        let i = 0;
        const apply = () => {
          const upTo = years[Math.min(i, years.length - 1)];
          const f: FilterSpecification = ["<=", ["get", "year"], upTo];
          map.setFilter("bedding", f);
          map.setFilter("bedding-glow", f);
          i += 1;
          if (i >= years.length && sweepTimer.current) {
            clearInterval(sweepTimer.current);
            sweepTimer.current = null;
          }
        };
        apply();
        sweepTimer.current = setInterval(apply, 700);
      }
    }
  }, [activeScene, ready, data, reducedMotion]);

  /* MapLibre stamps its own positioning classes onto the element it
     mounts in, so the fixed-position frame must be a separate parent.
     `inert` keeps the (non-interactive) chart's internals — attribution
     links included — out of the tab order; the imagery credit is
     surfaced as text in the HUD instead. */
  return (
    <div className="story-map" aria-hidden="true" inert>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function ensureSource(map: MaplibreMap, id: string, fc: StoryFeatureCollection) {
  const existing = map.getSource(id) as GeoJSONSource | undefined;
  if (existing) existing.setData(fc);
  else map.addSource(id, { type: "geojson", data: fc });
}

function ensureLayer(map: MaplibreMap, layer: LayerSpecification) {
  if (!map.getLayer(layer.id)) map.addLayer(layer);
}

function setVisible(map: MaplibreMap, id: string, visible: boolean) {
  if (map.getLayer(id)) {
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }
}

function tierColor(): ExpressionSpecification {
  return [
    "match",
    ["get", "tier"],
    "low",
    CHART.tiers.low,
    "med",
    CHART.tiers.med,
    "high",
    CHART.tiers.high,
    CHART.tiers.low,
  ];
}

function resolveBounds(view: string, data: StoryData): BBox {
  const bounds = data.manifest?.bounds;
  if (bounds) {
    const named = (bounds as Record<string, BBox | undefined>)[view];
    if (named) return named;
    if (bounds.overall) return bounds.overall;
  }
  return FALLBACK_BOUNDS;
}

function toLngLatBounds(b: BBox): LngLatBoundsLike {
  return [
    [b[0], b[1]],
    [b[2], b[3]],
  ];
}

/** Room for the narrative column — cards ride left on wide screens,
    bottom on small ones. Clamped to the viewport so short landscape
    phones never ask for more padding than there is map. */
function scenePadding() {
  if (typeof window === "undefined") return 60;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w >= 1024) {
    return {
      top: 90,
      bottom: 90,
      left: Math.min(500, Math.round(w * 0.4)),
      right: 80,
    };
  }
  const bottom = Math.min(300, Math.round(h * 0.35));
  return { top: Math.min(70, Math.round(h * 0.1)), bottom, left: 30, right: 30 };
}

function beddingYears(fc: StoryFeatureCollection): number[] {
  const years = new Set<number>();
  for (const f of fc.features) {
    const y = f.properties?.year;
    if (typeof y === "number") years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

/* Graticule — the chart's quarter-degree grid, drawn over the extent
   of the data with a margin so camera moves never run off it. */
function ensureGraticule(map: MaplibreMap, extent: BBox) {
  const step = 0.25;
  const pad = 2;
  const [w, s, e, n] = [
    Math.floor((extent[0] - pad) / step) * step,
    Math.floor((extent[1] - pad) / step) * step,
    Math.ceil((extent[2] + pad) / step) * step,
    Math.ceil((extent[3] + pad) / step) * step,
  ];

  const features: Feature[] = [];
  for (let x = w; x <= e; x += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [x, s],
          [x, n],
        ],
      },
    });
  }
  for (let y = s; y <= n; y += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [w, y],
          [e, y],
        ],
      },
    });
  }

  ensureSource(map, "graticule", { type: "FeatureCollection", features });
  ensureLayer(map, {
    id: "graticule",
    type: "line",
    source: "graticule",
    layout: { visibility: "none" },
    paint: {
      "line-color": CHART.graticule,
      "line-opacity": 0.09,
      "line-width": 1,
    },
  });
}

/* ------------------------------------------------------------------
   Density cells arrive as grid-aggregated points ({v, n} per ~2 km
   cell); each becomes a hexagonal prism for the extrusion
   layer. Longitudes are stretched by 1/cos(lat) so cells stay round
   on the water instead of squashing at higher latitudes.
   ------------------------------------------------------------------ */
function hexify(points: StoryFeatureCollection): StoryFeatureCollection {
  const R = 0.011; // matches the ~0.02° bake grid — chunky, readable columns
  const features: Feature[] = [];

  for (const f of points.features) {
    if (f.geometry.type !== "Point") continue;
    const [lon, lat] = f.geometry.coordinates;
    const rLon = R / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    const ring: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      ring.push([lon + rLon * Math.cos(a), lat + R * Math.sin(a)]);
    }
    ring.push(ring[0]);
    features.push({
      type: "Feature",
      properties: f.properties,
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }

  return { type: "FeatureCollection", features };
}
