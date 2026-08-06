import type { BBox } from "./use-story-data";

/* ------------------------------------------------------------------
   Scenes are the vocabulary shared by the scroll narrative and the
   chart. A section declares which scene it wants; the map stage owns
   how to get there. Camera targets are named bboxes resolved against
   the snapshot manifest at runtime, so the chart follows the data —
   the fallbacks below only matter before a snapshot is baked.
   ------------------------------------------------------------------ */

export type LayerKey = "graticule" | "bedding" | "coverage" | "density" | "css";

export type SceneId =
  | "hero"
  | "lost"
  | "bedding"
  | "coverage"
  | "density"
  | "return"
  | "close";

export type Scene = {
  id: SceneId;
  /** Key into manifest.bounds; "overall" always exists once baked. */
  view: string;
  pitch: number;
  bearing: number;
  /** Extra zoom applied after fitBounds, to push in or pull back. */
  zoomBias?: number;
  layers: Partial<Record<LayerKey, boolean>>;
  /** Replay the year-by-year cultch sweep when this scene activates. */
  beddingSweep?: boolean;
  /** Which density tiers of reef polygons to show. */
  cssTiers?: ("low" | "med" | "high")[];
};

export const SCENES: Record<SceneId, Scene> = {
  hero: {
    id: "hero",
    view: "overall",
    pitch: 0,
    bearing: 0,
    layers: { graticule: true },
  },
  lost: {
    id: "lost",
    view: "overall",
    pitch: 0,
    bearing: 0,
    zoomBias: -0.4,
    layers: { graticule: true },
  },
  bedding: {
    id: "bedding",
    view: "bedding",
    pitch: 38,
    bearing: -12,
    zoomBias: 0.4,
    layers: { graticule: true, bedding: true },
    beddingSweep: true,
  },
  coverage: {
    id: "coverage",
    view: "coverage",
    pitch: 0,
    bearing: 0,
    zoomBias: 0.3,
    layers: { graticule: true, coverage: true },
  },
  density: {
    id: "density",
    view: "density",
    pitch: 52,
    bearing: -17,
    zoomBias: 0.7,
    layers: { graticule: true, density: true },
  },
  return: {
    id: "return",
    view: "css",
    pitch: 30,
    bearing: -8,
    zoomBias: 0.5,
    layers: { graticule: true, css: true },
    cssTiers: ["low", "med", "high"],
  },
  close: {
    id: "close",
    view: "overall",
    pitch: 0,
    bearing: 0,
    layers: { graticule: true, bedding: true, css: true },
    cssTiers: ["low", "med", "high"],
  },
};

/* Louisiana public oyster grounds — placeholder chart extent used only
   until manifest.json ships real per-layer bounds. */
export const FALLBACK_BOUNDS: BBox = [-93.95, 29.15, -89.6, 30.35];

/* ------------------------------------------------------------------
   Symbology. Every color is a site token so the chart and the
   editorial bands read as one document.
   ------------------------------------------------------------------ */

export const CHART = {
  cultch: "#d6c5aa", // sand — shell returned to the water
  coverage: "#c5d8e3", // mist — sonar-ping survey cells
  graticule: "#c5d8e3",
  tiers: {
    low: "#3e7191", // steel   — 20–119 oysters / m²
    med: "#2f8a74", // verdigris — 119–244 oysters / m²
    high: "#d6c5aa", // sand    — ≥ 244 oysters / m²
  },
  /** Low → high oyster density, navy floor to shell-gold peak. */
  densityRamp: ["#16405f", "#3e7191", "#2f8a74", "#5ea183", "#d6c5aa"],
  /** Density bin edges in oysters per square meter (survey convention). */
  densityBins: [20, 119, 244],
} as const;
