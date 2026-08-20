"use client";

import type { Feature, FeatureCollection, Polygon } from "geojson";
import {
  AttributionControl,
  Map as MaplibreMap,
  Marker,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LayerSpecification,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./maplibre-worker";
import { useEffect, useRef, useState } from "react";
import { CHESAPEAKE_OUTLINE } from "./chesapeake-outline";
import { SOUTHWEST_LA_OUTLINE } from "./southwest-la-outline";
import { CHART, FALLBACK_BOUNDS, SCENES, mapTarget, type SceneId } from "./scenes";
import type { BBox, StoryData, StoryFeatureCollection } from "./use-story-data";
import { VENTURE_POIS, type VenturePoi } from "./venture-pois";

/* Every authored region outline rides in one source; a targetId filter
   picks which one is lit. */
const REGIONAL_OUTLINES: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [...CHESAPEAKE_OUTLINE.features, ...SOUTHWEST_LA_OUTLINE.features],
};

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
  /** Index into SaveManifest.photos while a placement is lit; null otherwise. */
  photo?: number | null;
};

type MapStageProps = {
  data: StoryData;
  activeScene: SceneId;
  targetId?: string | null;
  showVenturePois?: boolean;
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
  targetId,
  showVenturePois = false,
  reducedMotion,
  onView,
  onStageState,
}: MapStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const sweepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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
      if (photoTimer.current) clearInterval(photoTimer.current);
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

    ensureSource(
      map,
      "regional-targets",
      REGIONAL_OUTLINES,
      "OpenStreetMap contributors, Chesapeake Bay relation 11884052",
    );
    ensureLayer(map, {
      id: "regional-target-fill",
      type: "fill",
      source: "regional-targets",
      layout: { visibility: "none" },
      paint: { "fill-color": CHART.tiers.med, "fill-opacity": 0.09 },
    });
    ensureLayer(map, {
      id: "regional-target-glow",
      type: "line",
      source: "regional-targets",
      layout: { visibility: "none" },
      paint: {
        "line-color": CHART.tiers.med,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 7, 10, 12],
        "line-opacity": 0.2,
        "line-blur": 4,
      },
    });
    ensureLayer(map, {
      id: "regional-target-line",
      type: "line",
      source: "regional-targets",
      layout: { visibility: "none" },
      paint: {
        "line-color": CHART.tiers.med,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.5, 10, 2.5],
        "line-opacity": 0.95,
      },
    });

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

    if (data.layers.carbon) {
      ensureSource(map, "carbon", hexify(prepareCarbon(data.layers.carbon)));
      ensureLayer(map, {
        id: "carbon",
        type: "fill-extrusion",
        source: "carbon",
        layout: { visibility: "none" },
        paint: {
          "fill-extrusion-color": carbonYearColor(data.layers.carbon),
          "fill-extrusion-base": carbonHeight("_base01", 1),
          "fill-extrusion-height": carbonHeight("_top01", 1),
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

    /* Chapter five — one lease at survey resolution. Boundary under
       cultch under soundings, all added last so they ride above the
       program layers at close zoom. */
    if (data.layers.caseBoundary) {
      ensureSource(map, "case-boundary", data.layers.caseBoundary);
      ensureLayer(map, {
        id: "case-boundary-fill",
        type: "fill",
        source: "case-boundary",
        layout: { visibility: "none" },
        paint: { "fill-color": CHART.tiers.med, "fill-opacity": 0.05 },
      });
      ensureLayer(map, {
        id: "case-boundary-glow",
        type: "line",
        source: "case-boundary",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 16, 14],
          "line-opacity": 0.2,
          "line-blur": 4,
        },
      });
      ensureLayer(map, {
        id: "case-boundary-line",
        type: "line",
        source: "case-boundary",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 16, 2.5],
          "line-opacity": 0.95,
        },
      });
    }

    if (data.layers.caseBedding) {
      ensureSource(map, "case-bedding", prepareBedding(data.layers.caseBedding));
      ensureLayer(map, {
        id: "case-bedding-glow",
        type: "line",
        source: "case-bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.14,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 16, 12],
          "line-blur": 3,
        },
      });
      ensureLayer(map, {
        id: "case-bedding",
        type: "line",
        source: "case-bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.9,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.6, 16, 4],
        },
      });
    }

    if (data.layers.casePolling) {
      ensureSource(map, "case-polling", prepareCoverage(data.layers.casePolling));
      for (const id of ["case-polling-before", "case-polling-after"] as const) {
        ensureLayer(map, {
          id,
          type: "circle",
          source: "case-polling",
          layout: { visibility: "none" },
          paint: {
            "circle-color": substrateColor(),
            "circle-blur": 0.25,
            "circle-opacity": 0.9,
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2.2, 14, 3.6, 16, 6.5],
          },
        });
      }
    }

    /* The field-save chapter (?32024) — same anatomy as chapter five,
       plus a pair of alert layers holding only the errant barge load. */
    if (data.layers.saveBoundary) {
      ensureSource(map, "save-boundary", data.layers.saveBoundary);
      ensureLayer(map, {
        id: "save-boundary-fill",
        type: "fill",
        source: "save-boundary",
        layout: { visibility: "none" },
        paint: { "fill-color": CHART.tiers.med, "fill-opacity": 0.05 },
      });
      ensureLayer(map, {
        id: "save-boundary-glow",
        type: "line",
        source: "save-boundary",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 16, 14],
          "line-opacity": 0.2,
          "line-blur": 4,
        },
      });
      ensureLayer(map, {
        id: "save-boundary-line",
        type: "line",
        source: "save-boundary",
        layout: { visibility: "none" },
        paint: {
          "line-color": CHART.tiers.med,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 16, 2.5],
          "line-opacity": 0.95,
        },
      });
    }

    if (data.layers.saveBedding) {
      ensureSource(map, "save-bedding", prepareBedding(data.layers.saveBedding));
      ensureLayer(map, {
        id: "save-bedding-glow",
        type: "line",
        source: "save-bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.14,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 16, 12],
          "line-blur": 3,
        },
      });
      ensureLayer(map, {
        id: "save-bedding",
        type: "line",
        source: "save-bedding",
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.9,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.6, 16, 4],
        },
      });
      /* Load 10 alone, in the alert color the rest of the chart never
         wears. The cultch layers exclude it via NOT_ERR at scene time. */
      /* The lit placement while the inset shows its photo. Same source,
         drawn above the cultch lines so the highlight reads on top. */
      ensureLayer(map, {
        id: "save-bedding-focus-glow",
        type: "line",
        source: "save-bedding",
        filter: photoFilter(null),
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.cultch,
          "line-opacity": 0.34,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 10, 16, 20],
          "line-blur": 5,
        },
      });
      ensureLayer(map, {
        id: "save-bedding-focus",
        type: "line",
        source: "save-bedding",
        filter: photoFilter(null),
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.95,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.6, 16, 6],
        },
      });
      ensureLayer(map, {
        id: "save-bedding-err-glow",
        type: "line",
        source: "save-bedding",
        filter: IS_ERR,
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.alert,
          "line-opacity": 0.3,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 8, 16, 16],
          "line-blur": 4,
        },
      });
      ensureLayer(map, {
        id: "save-bedding-err",
        type: "line",
        source: "save-bedding",
        filter: IS_ERR,
        layout: { visibility: "none", "line-cap": "round" },
        paint: {
          "line-color": CHART.alert,
          "line-opacity": 0.95,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.2, 16, 5],
        },
      });
    }

    if (data.layers.savePolling) {
      ensureSource(map, "save-polling", prepareCoverage(data.layers.savePolling));
      for (const id of ["save-polling-before", "save-polling-after"] as const) {
        ensureLayer(map, {
          id,
          type: "circle",
          source: "save-polling",
          layout: { visibility: "none" },
          paint: {
            "circle-color": substrateColor(),
            "circle-blur": 0.25,
            "circle-opacity": 0.9,
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2.2, 14, 3.6, 16, 6.5],
          },
        });
      }
    }
  }, [ready, data]);

  /* ---- invitation-only POIs, enabled by the story URL ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !showVenturePois) return;

    const markers = VENTURE_POIS.map((poi) =>
      new Marker({ element: ventureMarkerElement(poi), anchor: "bottom" })
        .setLngLat(poi.coordinates)
        .addTo(map),
    );

    return () => markers.forEach((marker) => marker.remove());
  }, [ready, showVenturePois]);

  /* ---- scene changes ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const scene = SCENES[activeScene];
    clearStoryTimers(sweepTimer, cameraTimer);
    map.stop();

    const activeTarget = targetId ?? scene.targetId ?? null;
    const selectedTarget = mapTarget(activeTarget);
    const activeGeoid =
      selectedTarget && "geoid" in selectedTarget ? selectedTarget.geoid : null;
    const activeRegion =
      selectedTarget != null && "tag" in selectedTarget && selectedTarget.tag === "REGION";
    const bounds =
      resolveTargetBounds(data.layers.counties, activeTarget) ?? resolveBounds(scene.view, data);

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
    setVisible(map, "county-target-fill", !!scene.layers.counties && !!activeGeoid);
    setVisible(map, "county-target-glow", !!scene.layers.counties && !!activeGeoid);
    setVisible(map, "county-target-line", !!scene.layers.counties && !!activeGeoid);
    setVisible(map, "regional-target-fill", !!scene.layers.counties && activeRegion);
    setVisible(map, "regional-target-glow", !!scene.layers.counties && activeRegion);
    setVisible(map, "regional-target-line", !!scene.layers.counties && activeRegion);
    setVisible(map, "coverage-glow", !!scene.layers.coverage);
    setVisible(map, "coverage", !!scene.layers.coverage);
    setVisible(map, "carbon", !!scene.layers.carbon);
    setVisible(map, "css-fill", !!scene.layers.css);
    setVisible(map, "css-line", !!scene.layers.css);
    setVisible(map, "bedding", !!scene.layers.bedding);
    setVisible(map, "bedding-glow", !!scene.layers.bedding);
    setVisible(map, "case-boundary-fill", !!scene.layers.case);
    setVisible(map, "case-boundary-glow", !!scene.layers.case);
    setVisible(map, "case-boundary-line", !!scene.layers.case);
    setVisible(map, "case-polling-before", !!scene.layers.case);
    setVisible(map, "case-polling-after", !!scene.layers.case);
    setVisible(map, "case-bedding", !!scene.layers.caseBedding);
    setVisible(map, "case-bedding-glow", !!scene.layers.caseBedding);
    setVisible(map, "save-boundary-fill", !!scene.layers.save);
    setVisible(map, "save-boundary-glow", !!scene.layers.save);
    setVisible(map, "save-boundary-line", !!scene.layers.save);
    setVisible(map, "save-polling-before", !!scene.layers.save);
    setVisible(map, "save-polling-after", !!scene.layers.save);
    setVisible(map, "save-bedding", !!scene.layers.saveBedding);
    setVisible(map, "save-bedding-glow", !!scene.layers.saveBedding);
    /* The alert layers wait for the error sweep to land the load;
       every other scene that draws the bedding shows them at once. */
    const errVisible = !!scene.layers.saveBedding && !(scene.saveErrorSweep && !reducedMotion);
    setVisible(map, "save-bedding-err", errVisible);
    setVisible(map, "save-bedding-err-glow", errVisible);
    /* The focus pair only ever lights during a photo cycle; clear the filter
       so a scene change never leaves an orphaned placement lit. */
    if (photoTimer.current) {
      clearInterval(photoTimer.current);
      photoTimer.current = null;
    }
    for (const id of ["save-bedding-focus", "save-bedding-focus-glow"] as const) {
      if (map.getLayer(id)) {
        setVisible(map, id, !!scene.savePhotoCycle);
        map.setFilter(id, photoFilter(null));
      }
    }
    setVisible(map, "scan-line-glow", false);
    setVisible(map, "scan-line", false);

    const targetFilter: FilterSpecification = [
      "==",
      ["get", "GEOID"],
      activeGeoid ?? "__none__",
    ];
    for (const id of ["county-target-fill", "county-target-glow", "county-target-line"]) {
      if (map.getLayer(id)) map.setFilter(id, targetFilter);
    }

    const regionFilter: FilterSpecification = [
      "==",
      ["get", "targetId"],
      activeRegion && activeTarget ? activeTarget : "__none__",
    ];
    for (const id of ["regional-target-fill", "regional-target-glow", "regional-target-line"]) {
      if (map.getLayer(id)) map.setFilter(id, regionFilter);
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
    if (map.getLayer("carbon")) {
      map.setPaintProperty("carbon", "fill-extrusion-base", carbonHeight("_base01", 1));
      map.setPaintProperty("carbon", "fill-extrusion-height", carbonHeight("_top01", 1));
    }
    if (map.getLayer("case-polling-before")) {
      /* Wipe scenes fly in still showing the old survey; the wipe itself
         swaps it for the resurvey once on station. Reduced motion (and
         every non-wipe scene) cuts straight to the scene's phase. */
      const phase = scene.casePhase ?? "after";
      if (scene.caseWipe && !reducedMotion) {
        map.setFilter("case-polling-before", PHASE_BEFORE);
        map.setFilter("case-polling-after", PHASE_NONE);
      } else {
        map.setFilter("case-polling-before", phase === "before" ? PHASE_BEFORE : PHASE_NONE);
        map.setFilter("case-polling-after", phase === "after" ? PHASE_AFTER : PHASE_NONE);
      }
    }
    if (map.getLayer("case-bedding")) {
      /* Sweep scenes arrive over bare bottom; the placements replay there. */
      const start: FilterSpecification | null =
        scene.caseBeddingSweep && !reducedMotion ? ["<=", ["get", "_storyOrder"], 0] : null;
      map.setFilter("case-bedding", start);
      map.setFilter("case-bedding-glow", start);
    }
    if (map.getLayer("save-polling-before")) {
      const phase = scene.savePhase ?? "after";
      if (scene.saveWipe && !reducedMotion) {
        map.setFilter("save-polling-before", PHASE_BEFORE);
        map.setFilter("save-polling-after", PHASE_NONE);
      } else {
        map.setFilter("save-polling-before", phase === "before" ? PHASE_BEFORE : PHASE_NONE);
        map.setFilter("save-polling-after", phase === "after" ? PHASE_AFTER : PHASE_NONE);
      }
    }
    if (map.getLayer("save-bedding")) {
      /* The cultch layers never draw the errant load — it belongs to the
         alert layers. Sweeps start empty; static scenes show every
         correct load at once. A prior scene's pulse may have left the
         alert opacity anywhere, so put it back. */
      const animated = (scene.saveErrorSweep || scene.saveBeddingSweep) && !reducedMotion;
      const start: FilterSpecification = animated
        ? ["all", NOT_ERR, ["<=", ["get", "_storyOrder"], -1]]
        : NOT_ERR;
      map.setFilter("save-bedding", start);
      map.setFilter("save-bedding-glow", start);
      map.setPaintProperty("save-bedding-err", "line-opacity", 0.95);
      map.setPaintProperty("save-bedding-err-glow", "line-opacity", 0.3);
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
        /* No cycling without motion, but the inset should still have a
           placement to sit beside: light the first photographed load and
           leave it there. */
        if (scene.savePhotoCycle && (data.saveManifest?.photos?.length ?? 0) > 0) {
          for (const id of ["save-bedding-focus", "save-bedding-focus-glow"] as const) {
            if (map.getLayer(id)) map.setFilter(id, photoFilter(0));
          }
          onStageState?.({ status: "ON STATION", progress: 1, photo: 0 });
          return;
        }
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

      if (scene.carbonGrow && map.getLayer("carbon") && data.layers.carbon) {
        animateLayer(
          sweepTimer,
          2600,
          (progress) => {
            /* Base and top scale together so the vintage slabs rise as
               one column instead of detaching. */
            map.setPaintProperty("carbon", "fill-extrusion-base", carbonHeight("_base01", progress));
            map.setPaintProperty("carbon", "fill-extrusion-height", carbonHeight("_top01", progress));
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setPaintProperty("carbon", "fill-extrusion-base", carbonHeight("_base01", 1));
            map.setPaintProperty("carbon", "fill-extrusion-height", carbonHeight("_top01", 1));
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

      if (scene.caseBeddingSweep && map.getLayer("case-bedding") && data.layers.caseBedding) {
        animateLayer(
          sweepTimer,
          3200,
          (progress) => {
            const filter: FilterSpecification = ["<=", ["get", "_storyOrder"], progress];
            map.setFilter("case-bedding", filter);
            map.setFilter("case-bedding-glow", filter);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("case-bedding", null);
            map.setFilter("case-bedding-glow", null);
            finish();
          },
        );
        return;
      }

      if (scene.saveErrorSweep && map.getLayer("save-bedding") && data.layers.saveBedding) {
        /* The errant load alone. An earlier cut replayed the placements
           ahead of it and landed this one "tenth", which the record does
           not support — the loads before it are not part of the mistake,
           so drawing them only invited the reader to count. Hold the rest
           back, fade this one up in the alert color, and leave it
           breathing until the reader scrolls on to the correction. */
        const hideRest: FilterSpecification = ["all", NOT_ERR, ["==", ["get", "err"], "__none__"]];
        map.setFilter("save-bedding", hideRest);
        map.setFilter("save-bedding-glow", hideRest);
        setVisible(map, "save-bedding-err", true);
        setVisible(map, "save-bedding-err-glow", true);
        animateLayer(
          sweepTimer,
          900,
          (progress) => {
            map.setPaintProperty("save-bedding-err", "line-opacity", progress * 0.95);
            map.setPaintProperty("save-bedding-err-glow", "line-opacity", progress * 0.3);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            const landed = performance.now();
            sweepTimer.current = setInterval(() => {
              if (!map.getLayer("save-bedding-err")) return;
              const pulse = 0.62 + 0.33 * Math.sin(((performance.now() - landed) / 1000) * 4.4);
              map.setPaintProperty("save-bedding-err", "line-opacity", pulse);
              map.setPaintProperty("save-bedding-err-glow", "line-opacity", pulse * 0.42);
            }, 80);
            /* Deliberately not VERIFIED — the chart is showing a mistake. */
            onStageState?.({ status: "ON STATION", progress: 1 });
          },
        );
        return;
      }

      if (scene.saveBeddingSweep && map.getLayer("save-bedding") && data.layers.saveBedding) {
        animateLayer(
          sweepTimer,
          3200,
          (progress) => {
            const filter: FilterSpecification = [
              "all",
              NOT_ERR,
              ["<=", ["get", "_storyOrder"], progress],
            ];
            map.setFilter("save-bedding", filter);
            map.setFilter("save-bedding-glow", filter);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("save-bedding", NOT_ERR);
            map.setFilter("save-bedding-glow", NOT_ERR);
            /* Replay done: walk the photographed placements so the inset has
               something to sit beside. Held on each one long enough to read
               the caption, and looped — the reader controls how long they
               stay on this scene, so there is no natural end. */
            const shots = data.saveManifest?.photos?.length ?? 0;
            if (scene.savePhotoCycle && shots > 0) {
              let at = 0;
              const light = () => {
                for (const id of ["save-bedding-focus", "save-bedding-focus-glow"] as const) {
                  if (map.getLayer(id)) map.setFilter(id, photoFilter(at));
                }
                onStageState?.({ status: "ON STATION", progress: 1, photo: at });
              };
              light();
              photoTimer.current = setInterval(() => {
                at = (at + 1) % shots;
                light();
              }, PHOTO_DWELL_MS);
            }
            finish();
          },
        );
        return;
      }

      if (scene.saveWipe && map.getLayer("save-polling-after") && data.layers.savePolling) {
        setVisible(map, "scan-line-glow", true);
        setVisible(map, "scan-line", true);
        animateLayer(
          sweepTimer,
          3600,
          (progress) => {
            const scanLongitude = bounds[0] + (bounds[2] - bounds[0]) * progress;
            map.setFilter("save-polling-before", [
              "all",
              PHASE_BEFORE,
              [">", ["get", "_storyLongitude"], scanLongitude],
            ]);
            map.setFilter("save-polling-after", [
              "all",
              PHASE_AFTER,
              ["<=", ["get", "_storyLongitude"], scanLongitude],
            ]);
            setScanLine(map, bounds, progress);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("save-polling-before", PHASE_NONE);
            map.setFilter("save-polling-after", PHASE_AFTER);
            setVisible(map, "scan-line-glow", false);
            setVisible(map, "scan-line", false);
            finish();
          },
        );
        return;
      }

      if (scene.caseWipe && map.getLayer("case-polling-after") && data.layers.casePolling) {
        setVisible(map, "scan-line-glow", true);
        setVisible(map, "scan-line", true);
        animateLayer(
          sweepTimer,
          3600,
          (progress) => {
            const scanLongitude = bounds[0] + (bounds[2] - bounds[0]) * progress;
            map.setFilter("case-polling-before", [
              "all",
              PHASE_BEFORE,
              [">", ["get", "_storyLongitude"], scanLongitude],
            ]);
            map.setFilter("case-polling-after", [
              "all",
              PHASE_AFTER,
              ["<=", ["get", "_storyLongitude"], scanLongitude],
            ]);
            setScanLine(map, bounds, progress);
            onStageState?.({ status: "ACQUIRING", progress });
          },
          () => {
            map.setFilter("case-polling-before", PHASE_NONE);
            map.setFilter("case-polling-after", PHASE_AFTER);
            setVisible(map, "scan-line-glow", false);
            setVisible(map, "scan-line", false);
            finish();
          },
        );
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
      clearStoryTimers(sweepTimer, cameraTimer, photoTimer);
      map.stop();
    };
  }, [activeScene, targetId, ready, data, reducedMotion, onStageState]);

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

/* Case-study polling: which survey pass a sounding belongs to. Typed as
   expressions so they compose under ["all", ...] and stand alone as filters. */
const PHASE_BEFORE: ExpressionSpecification = ["==", ["get", "phase"], "before"];
const PHASE_AFTER: ExpressionSpecification = ["==", ["get", "phase"], "after"];
const PHASE_NONE: ExpressionSpecification = ["==", ["get", "phase"], "__none__"];

/* The field-save bedding splits along the err flag the bake stamped on
   the errant load: cultch layers draw NOT_ERR, alert layers draw IS_ERR. */
/** How long each photographed placement stays lit before the cycle moves on. */
const PHOTO_DWELL_MS = 4200;

const IS_ERR: ExpressionSpecification = ["to-boolean", ["get", "err"]];

/** The one placement carrying photo `index`, or nothing when index is null. */
function photoFilter(index: number | null): FilterSpecification {
  return ["==", ["get", "photo"], index ?? -1];
}
const NOT_ERR: ExpressionSpecification = ["!", ["to-boolean", ["get", "err"]]];

function substrateColor(): ExpressionSpecification {
  return [
    "match",
    ["get", "s"],
    "mud",
    CHART.substrate.mud,
    "firm",
    CHART.substrate.firm,
    "buried",
    CHART.substrate.buried,
    "scat",
    CHART.substrate.scat,
    "reef",
    CHART.substrate.reef,
    CHART.substrate.firm,
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

function resolveTargetBounds(
  counties: StoryFeatureCollection | null,
  targetId: string | null,
): BBox | null {
  const target = mapTarget(targetId);
  if (!target) return null;
  if ("bounds" in target) return target.bounds;
  return resolveCountyBounds(counties, target.geoid);
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

function ventureMarkerElement(poi: VenturePoi): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "story-venture-poi";

  const label = document.createElement("div");
  label.className = "story-venture-poi-label";

  const name = document.createElement("strong");
  name.textContent = poi.name;
  label.append(name);

  const address = document.createElement("span");
  address.textContent = poi.address;
  label.append(address);

  if (poi.hours) {
    const hours = document.createElement("small");
    hours.textContent = poi.hours;
    label.append(hours);
  }

  const pin = document.createElement("i");
  pin.setAttribute("aria-hidden", "true");
  root.append(label, pin);
  return root;
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

/* Banked carbon extrudes to a shared ceiling: _base01/_top01 are a
   cell's cumulative tonnage normalized against the tallest column
   (stamped by prepareCarbon), so vintage slabs stack without gaps at
   any animation progress. */
const CARBON_MAX_HEIGHT = 12000;

function carbonHeight(prop: "_base01" | "_top01", progress: number): ExpressionSpecification {
  return ["*", ["get", prop], CARBON_MAX_HEIGHT * Math.max(0, Math.min(1, progress))];
}

/* Vintages oldest → newest wear steel, verdigris, then shell-gold —
   the newest season catches the light at the top of the stack. Ramp
   picks stay legible on the dark satellite; the navy steps would sink.
   Built from the data, so a new season needs no code change. */
const VINTAGE_RAMP_PICKS = [1, 2, 4, 3, 0] as const;

function carbonYearColor(fc: StoryFeatureCollection): ExpressionSpecification {
  const years = Array.from(
    new Set(
      fc.features.map((f) => Number((f.properties as { year?: unknown } | null)?.year)),
    ),
  )
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);
  const expr: unknown[] = ["match", ["get", "year"]];
  years.forEach((year, i) => {
    expr.push(year, vintageColor(i));
  });
  expr.push(vintageColor(years.length));
  return expr as ExpressionSpecification;
}

export function vintageColor(index: number): string {
  const pick = VINTAGE_RAMP_PICKS[Math.min(index, VINTAGE_RAMP_PICKS.length - 1)];
  return CHART.densityRamp[pick];
}

/* Stamp each (cell, vintage) slab with its cumulative base/top as a
   share of the 95th-percentile column, clamped at 1 — tonnage is
   heavily skewed (a few cells hold whole leases), and normalizing
   against the raw maximum flattens the median column into a tile.
   The handful of clamped outliers max out honestly at the ceiling.
   Cached per collection like the other prepare passes. */
const carbonCache = new WeakMap<StoryFeatureCollection, StoryFeatureCollection>();

function prepareCarbon(fc: StoryFeatureCollection): StoryFeatureCollection {
  const cached = carbonCache.get(fc);
  if (cached) return cached;
  const cellTop = new Map<string, number>();
  for (const f of fc.features) {
    if (f.geometry.type !== "Point") continue;
    const key = f.geometry.coordinates.join(",");
    const top = Number((f.properties as { top?: unknown } | null)?.top ?? 0);
    cellTop.set(key, Math.max(cellTop.get(key) ?? 0, top));
  }
  const tops = Array.from(cellTop.values()).sort((a, b) => a - b);
  const cap = tops.length ? tops[Math.min(tops.length - 1, Math.floor(tops.length * 0.95))] : 0;
  const prepared: StoryFeatureCollection = {
    type: "FeatureCollection",
    features: fc.features.map((f) => {
      const p = f.properties as { base?: number; top?: number } | null;
      return {
        ...f,
        properties: {
          ...f.properties,
          _base01: cap > 0 ? Math.min((p?.base ?? 0) / cap, 1) : 0,
          _top01: cap > 0 ? Math.min((p?.top ?? 0) / cap, 1) : 0,
        },
      };
    }),
  };
  carbonCache.set(fc, prepared);
  return prepared;
}

type IntervalRef = { current: ReturnType<typeof setInterval> | null };
type TimeoutRef = { current: ReturnType<typeof setTimeout> | null };

function clearStoryTimers(intervalRef: IntervalRef, timeoutRef: TimeoutRef, extra?: IntervalRef) {
  if (intervalRef.current) clearInterval(intervalRef.current);
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  if (extra?.current) clearInterval(extra.current);
  intervalRef.current = null;
  timeoutRef.current = null;
  if (extra) extra.current = null;
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
   Carbon cells arrive as grid-aggregated points (one per ~2 km cell
   and vintage); each becomes a hexagonal prism for the extrusion
   layer — co-located vintages stack via fill-extrusion-base.
   Longitudes are stretched by 1/cos(lat) so cells stay round on the
   water instead of squashing at higher latitudes.
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
