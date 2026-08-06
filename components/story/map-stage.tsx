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

export type ChartView = {
  lat: number;
  lon: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type StageState = {
  status: "STANDBY" | "IN TRANSIT" | "ACQUIRING" | "ON STATION" | "VERIFIED";
  progress: number;
  vintage?: number;
};

type MapStageProps = {
  data: StoryData;
  activeScene: SceneId;
  targetGeoid?: string | null;
  reducedMotion: boolean;
  onView?: (view: ChartView) => void;
  onStageState?: (state: StageState) => void;
};

/* ------------------------------------------------------------------
   The chart itself: one non-interactive MapLibre canvas pinned behind
   the scroll. Scenes drive it; it never drives itself.
   ------------------------------------------------------------------ */
export function MapStage({
  data,
  activeScene,
  targetGeoid,
  reducedMotion,
  onView,
  onStageState,
}: MapStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const sweepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    const emitView = () => {
      if (!onView) return;
      const c = map.getCenter();
      onView({
        lat: c.lat,
        lon: c.lng,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };

    /* `style.load` does not wait for remote raster tiles. The survey
       snapshot and its controls therefore remain available when Esri
       imagery is slow, blocked, or being viewed from a field laptop
       with an intermittent connection. */
    map.once("style.load", () => {
      mapRef.current = map;
      setReady(true);
      emitView();
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__storyMap = map;
      }
    });

    if (onView) map.on("move", emitView);

    return () => {
      if (sweepTimer.current) clearInterval(sweepTimer.current);
      if (cameraTimer.current) clearTimeout(cameraTimer.current);
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

    if (data.layers.counties) {
      ensureSource(
        map,
        "counties",
        data.layers.counties,
        "U.S. Census Bureau TIGERweb, 2025 county equivalents",
      );
      ensureLayer(map, {
        id: "county-fill",
        type: "fill",
        source: "counties",
        layout: { visibility: "none" },
        paint: { "fill-color": CHART.coverage, "fill-opacity": 0.025 },
      });
      ensureLayer(map, {
        id: "county-line",
        type: "line",
        source: "counties",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.coverage,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.7, 11, 1.3],
          "line-opacity": 0.28,
          "line-dasharray": [3, 2],
        },
      });
      ensureLayer(map, {
        id: "county-target-fill",
        type: "fill",
        source: "counties",
        layout: { visibility: "none" },
        paint: { "fill-color": CHART.tiers.med, "fill-opacity": 0.09 },
      });
      ensureLayer(map, {
        id: "county-target-glow",
        type: "line",
        source: "counties",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 7, 11, 12],
          "line-opacity": 0.18,
          "line-blur": 4,
        },
      });
      ensureLayer(map, {
        id: "county-target-line",
        type: "line",
        source: "counties",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 11, 2.5],
          "line-opacity": 0.95,
        },
      });
    }

    ensureScanLine(map);

    if (data.layers.coverage) {
      ensureSource(map, "coverage", prepareCoverage(data.layers.coverage));
      ensureLayer(map, {
        id: "coverage-glow",
        type: "circle",
        source: "coverage",
        layout: { visibility: "none" },
        paint: {
          "circle-color": CHART.coverage,
          "circle-blur": 0.9,
          "circle-opacity": 0.16,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 3, 12, 10],
        },
      });
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
          "fill-extrusion-vertical-gradient": true,
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
      ensureSource(map, "bedding", prepareBedding(data.layers.bedding));
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
    clearStoryTimers(sweepTimer, cameraTimer);
    map.stop();

    const activeTarget = targetGeoid ?? scene.targetGeoid ?? null;
    const bounds =
      resolveCountyBounds(data.layers.counties, activeTarget) ?? resolveBounds(scene.view, data);

    /* camera — retry with minimal padding rather than silently freeze
       when the padded fit doesn't fit (short landscape viewports) */
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
        map.flyTo({
          ...target,
          duration: scene.flightDuration ?? 2800,
          curve: 1.18,
          essential: true,
        });
      }
    }

    /* layer visibility */
    setVisible(map, "graticule", !!scene.layers.graticule);
    setVisible(map, "county-fill", !!scene.layers.counties);
    setVisible(map, "county-line", !!scene.layers.counties);
    setVisible(map, "county-target-fill", !!scene.layers.counties && !!activeTarget);
    setVisible(map, "county-target-glow", !!scene.layers.counties && !!activeTarget);
    setVisible(map, "county-target-line", !!scene.layers.counties && !!activeTarget);
    setVisible(map, "coverage-glow", !!scene.layers.coverage);
    setVisible(map, "coverage", !!scene.layers.coverage);
    setVisible(map, "density", !!scene.layers.density);
    setVisible(map, "css-fill", !!scene.layers.css);
    setVisible(map, "css-line", !!scene.layers.css);
    setVisible(map, "bedding", !!scene.layers.bedding);
    setVisible(map, "bedding-glow", !!scene.layers.bedding);
    setVisible(map, "scan-line-glow", false);
    setVisible(map, "scan-line", false);

    const targetFilter: FilterSpecification = [
      "==",
      ["get", "GEOID"],
      activeTarget ?? "__none__",
    ];
    for (const id of ["county-target-fill", "county-target-glow", "county-target-line"]) {
      if (map.getLayer(id)) map.setFilter(id, targetFilter);
    }

    /* Reset animated layers before a flight begins. */
    if (map.getLayer("bedding")) {
      map.setFilter("bedding", null);
      map.setFilter("bedding-glow", null);
    }
    if (map.getLayer("coverage")) {
      map.setFilter("coverage", null);
      map.setFilter("coverage-glow", null);
    }
    if (map.getLayer("density")) {
      map.setPaintProperty("density", "fill-extrusion-height", densityHeight(1));
    }

    /* reef tier filter — latest survey year only, or fills stack up */
    if (scene.layers.css && map.getLayer("css-fill") && data.layers.cssTiers) {
      const tiers = scene.cssTiers ?? ["low", "med", "high"];
      const latest = Math.max(
        ...data.layers.cssTiers.features.map((f) => Number(f.properties?.year ?? 0)),
      );
      setCssFilter(map, latest, tiers);
    }

    /* cultch sweep — replay placements year by year */
    const latestCssYear =
      scene.layers.css && data.layers.cssTiers
        ? Math.max(
            ...data.layers.cssTiers.features.map((f) => Number(f.properties?.year ?? 0)),
          )
        : undefined;

    const finish = (vintage?: number) =>
      onStageState?.({ status: "VERIFIED", progress: 1, vintage });

    const beginOnStation = () => {
      if (!reducedMotion && scene.orbitDegrees) {
        map.easeTo({
          bearing: scene.bearing + scene.orbitDegrees,
          duration: scene.orbitDuration ?? 4000,
          easing: smoothstep,
          essential: true,
        });
      }

      if (reducedMotion) {
        if (latestCssYear) setCssFilter(map, latestCssYear, scene.cssTiers);
        finish(latestCssYear);
        return;
      }

      if (scene.beddingSweep && map.getLayer("bedding") && data.layers.bedding) {
        animateLayer(
          sweepTimer,
          3300,
          (progress) => {
            const filter: FilterSpecification = ["<=", ["get", "_storyOrder"], progress];
            map.setFilter("bedding", filter);
            map.setFilter("bedding-glow", filter);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("bedding", null);
            map.setFilter("bedding-glow", null);
            finish();
          },
        );
        return;
      }

      if (scene.coverageSweep && map.getLayer("coverage") && data.layers.coverage) {
        setVisible(map, "scan-line-glow", true);
        setVisible(map, "scan-line", true);
        animateLayer(
          sweepTimer,
          3000,
          (progress) => {
            const scanLongitude = bounds[0] + (bounds[2] - bounds[0]) * progress;
            const filter: FilterSpecification = [
              "<=",
              ["get", "_storyLongitude"],
              scanLongitude,
            ];
            map.setFilter("coverage", filter);
            map.setFilter("coverage-glow", filter);
            setScanLine(map, bounds, progress);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("coverage", null);
            map.setFilter("coverage-glow", null);
            setVisible(map, "scan-line-glow", false);
            setVisible(map, "scan-line", false);
            finish();
          },
        );
        return;
      }

      if (scene.densityGrow && map.getLayer("density") && data.layers.density) {
        animateLayer(
          sweepTimer,
          2600,
          (progress) => {
            map.setPaintProperty("density", "fill-extrusion-height", densityHeight(progress));
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setPaintProperty("density", "fill-extrusion-height", densityHeight(1));
            finish();
          },
        );
        return;
      }

      if (scene.cssPlayback && map.getLayer("css-fill") && data.layers.cssTiers) {
        const years = cssYears(data.layers.cssTiers);
        let index = 0;
        const apply = () => {
          const vintage = years[Math.min(index, years.length - 1)];
          setCssFilter(map, vintage, scene.cssTiers);
          onStageState?.({
            status: index === years.length - 1 ? "VERIFIED" : "ACQUIRING",
            progress: years.length <= 1 ? 1 : index / (years.length - 1),
            vintage,
          });
          index += 1;
          if (index >= years.length && sweepTimer.current) {
            clearInterval(sweepTimer.current);
            sweepTimer.current = null;
          }
        };
        apply();
        sweepTimer.current = setInterval(apply, 1250);
        return;
      }

      onStageState?.({ status: "ON STATION", progress: 1, vintage: latestCssYear });
    };

    onStageState?.({ status: reducedMotion ? "ON STATION" : "IN TRANSIT", progress: 0 });
    if (reducedMotion || !camera) {
      beginOnStation();
    } else {
      cameraTimer.current = setTimeout(beginOnStation, (scene.flightDuration ?? 2800) + 120);
    }

    return () => {
      clearStoryTimers(sweepTimer, cameraTimer);
      map.stop();
    };
  }, [activeScene, targetGeoid, ready, data, reducedMotion, onStageState]);

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

function ensureSource(
  map: MaplibreMap,
  id: string,
  fc: StoryFeatureCollection,
  attribution?: string,
) {
  const existing = map.getSource(id) as GeoJSONSource | undefined;
  if (existing) existing.setData(fc);
  else map.addSource(id, { type: "geojson", data: fc, attribution });
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

function resolveCountyBounds(
  counties: StoryFeatureCollection | null,
  geoid: string | null,
): BBox | null {
  if (!counties || !geoid) return null;
  const feature = counties.features.find((candidate) => candidate.properties?.GEOID === geoid);
  if (!feature) return null;

  const stored = feature.properties?.bbox;
  if (
    Array.isArray(stored) &&
    stored.length === 4 &&
    stored.every((value) => typeof value === "number")
  ) {
    return stored as BBox;
  }

  if (!("coordinates" in feature.geometry)) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  const visit = (coordinates: unknown): void => {
    if (!Array.isArray(coordinates)) return;
    if (
      coordinates.length >= 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      west = Math.min(west, coordinates[0]);
      south = Math.min(south, coordinates[1]);
      east = Math.max(east, coordinates[0]);
      north = Math.max(north, coordinates[1]);
      return;
    }
    coordinates.forEach(visit);
  };
  visit(feature.geometry.coordinates);
  return Number.isFinite(west) ? [west, south, east, north] : null;
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

function cssYears(fc: StoryFeatureCollection): number[] {
  const years = new Set<number>();
  for (const f of fc.features) {
    const y = f.properties?.year;
    if (typeof y === "number") years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

function setCssFilter(
  map: MaplibreMap,
  year: number,
  tiers: ("low" | "med" | "high")[] = ["low", "med", "high"],
) {
  const filter: FilterSpecification = [
    "all",
    ["==", ["get", "year"], year],
    ["in", ["get", "tier"], ["literal", tiers]],
  ];
  map.setFilter("css-fill", filter);
  map.setFilter("css-line", filter);
}

const DENSITY_HEIGHT: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "v"],
  0,
  40,
  600,
  9000,
];

function densityHeight(progress: number): ExpressionSpecification {
  return ["*", DENSITY_HEIGHT, Math.max(0, Math.min(1, progress))];
}

type IntervalRef = { current: ReturnType<typeof setInterval> | null };
type TimeoutRef = { current: ReturnType<typeof setTimeout> | null };

function clearStoryTimers(intervalRef: IntervalRef, timeoutRef: TimeoutRef) {
  if (intervalRef.current) clearInterval(intervalRef.current);
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  intervalRef.current = null;
  timeoutRef.current = null;
}

function smoothstep(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function animateLayer(
  timerRef: IntervalRef,
  duration: number,
  onFrame: (progress: number) => void,
  onComplete: () => void,
) {
  const started = performance.now();
  onFrame(0);
  timerRef.current = setInterval(() => {
    const raw = Math.min(1, (performance.now() - started) / duration);
    onFrame(smoothstep(raw));
    if (raw >= 1 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      onComplete();
    }
  }, 70);
}

const beddingCache = new WeakMap<StoryFeatureCollection, StoryFeatureCollection>();
const coverageCache = new WeakMap<StoryFeatureCollection, StoryFeatureCollection>();

function prepareBedding(fc: StoryFeatureCollection): StoryFeatureCollection {
  const cached = beddingCache.get(fc);
  if (cached) return cached;
  const denominator = Math.max(1, fc.features.length - 1);
  const prepared: StoryFeatureCollection = {
    ...fc,
    features: fc.features.map((feature, index) => ({
      ...feature,
      properties: { ...feature.properties, _storyOrder: index / denominator },
    })),
  };
  beddingCache.set(fc, prepared);
  return prepared;
}

function prepareCoverage(fc: StoryFeatureCollection): StoryFeatureCollection {
  const cached = coverageCache.get(fc);
  if (cached) return cached;
  const longitudes = fc.features
    .filter((feature) => feature.geometry.type === "Point")
    .map((feature) => (feature.geometry.type === "Point" ? feature.geometry.coordinates[0] : 0));
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const span = Math.max(0.0001, east - west);
  const prepared: StoryFeatureCollection = {
    ...fc,
    features: fc.features.map((feature) => {
      const longitude = feature.geometry.type === "Point" ? feature.geometry.coordinates[0] : west;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          _storySweep: (longitude - west) / span,
          _storyLongitude: longitude,
        },
      };
    }),
  };
  coverageCache.set(fc, prepared);
  return prepared;
}

function ensureScanLine(map: MaplibreMap) {
  ensureSource(map, "scan-line", { type: "FeatureCollection", features: [] });
  ensureLayer(map, {
    id: "scan-line-glow",
    type: "line",
    source: "scan-line",
    layout: { visibility: "none" },
    paint: {
      "line-color": CHART.coverage,
      "line-width": 18,
      "line-opacity": 0.18,
      "line-blur": 8,
    },
  });
  ensureLayer(map, {
    id: "scan-line",
    type: "line",
    source: "scan-line",
    layout: { visibility: "none" },
    paint: { "line-color": CHART.coverage, "line-width": 1.5, "line-opacity": 0.92 },
  });
}

function setScanLine(map: MaplibreMap, bounds: BBox, progress: number) {
  const source = map.getSource("scan-line") as GeoJSONSource | undefined;
  if (!source) return;
  const longitude = bounds[0] + (bounds[2] - bounds[0]) * progress;
  source.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [longitude, bounds[1]],
            [longitude, bounds[3]],
          ],
        },
      },
    ],
  });
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
