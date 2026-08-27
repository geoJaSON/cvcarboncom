import type { BBox } from "./use-story-data";

/* ------------------------------------------------------------------
   Scenes are the vocabulary shared by the scroll narrative and the
   chart. A section declares which scene it wants; the map stage owns
   how to get there. Camera targets are named bboxes resolved against
   the snapshot manifest at runtime, so the chart follows the data -
   the fallbacks below only matter before a snapshot is baked.
   ------------------------------------------------------------------ */

export type LayerKey =
  | "graticule"
  | "counties"
  | "bedding"
  | "coverage"
  | "carbon"
  | "css"
  | "case"
  | "caseBedding"
  | "caseDredges"
  | "save"
  | "saveBedding";

export type SceneId =
  | "hero"
  | "venture"
  | "lost"
  | "bedding"
  | "coverage"
  | "carbon"
  | "return"
  | "case-before"
  | "case-work"
  | "case-after"
  | "save-island"
  | "save-error"
  | "save-fixed"
  | "save-after"
  | "close";

export type Scene = {
  id: SceneId;
  /** Key into manifest.bounds; "overall" always exists once baked. */
  view: string;
  pitch: number;
  bearing: number;
  /** Extra zoom applied after fitBounds, to push in or pull back. */
  zoomBias?: number;
  /** Authored area target used for the scene's flight. */
  targetId?: string;
  /** Flight and on-station camera choreography, in milliseconds/degrees. */
  flightDuration?: number;
  orbitDegrees?: number;
  orbitDuration?: number;
  layers: Partial<Record<LayerKey, boolean>>;
  /** Replay the year-by-year cultch sweep when this scene activates. */
  beddingSweep?: boolean;
  /** Sweep the aggregated survey footprint across the target area. */
  coverageSweep?: boolean;
  /** Grow the banked-carbon columns from the chart floor. */
  carbonGrow?: boolean;
  /** Replay the available surveyed-reef vintages. */
  cssPlayback?: boolean;
  /** Which density tiers of reef polygons to show. */
  cssTiers?: ("low" | "med" | "high")[];
  /** Which survey pass of the case-study lease to sound. */
  casePhase?: "before" | "after";
  /** Replay the lease's cultch placements in deployment order. */
  caseBeddingSweep?: boolean;
  /** Scan-line wipe that resurveys the lease: before points swap to after. */
  caseWipe?: boolean;
  /** Step through the resurvey's photographed dredge tows, lighting each
      in turn so the inset can show what came up in the basket. */
  casePhotoCycle?: boolean;
  /** Which survey pass of the field-save lease to sound. */
  savePhase?: "before" | "after";
  /** Fade the errant load up alone on top of the poled reef and hold it
      pulsing in the alert color. The loads placed before it are not part
      of the mistake and stay hidden. */
  saveErrorSweep?: boolean;
  /** Replay every correctly-placed load; the errant one stays lit. */
  saveBeddingSweep?: boolean;
  /** Step through the placements that have a field photo, lighting each in
      turn so the inset can show the work on that load. */
  savePhotoCycle?: boolean;
  /** Scan-line wipe to the save lease's resurvey. */
  saveWipe?: boolean;
};

export const SCENES: Record<SceneId, Scene> = {
  hero: {
    id: "hero",
    view: "overall",
    pitch: 0,
    bearing: 0,
    flightDuration: 3000,
    orbitDegrees: 4,
    orbitDuration: 3200,
    layers: { graticule: true },
  },
  /* Invitation-only opener. The reef extent is the one baked view that
     holds both of the prospect's Louisiana sites at once - Calcasieu
     Pass at the western edge, Plaquemines at the eastern - so their
     pins stand on shaded survey rather than on empty water. No
     targetId: the reticle stays off their facilities. */
  venture: {
    id: "venture",
    view: "css",
    pitch: 26,
    bearing: -6,
    zoomBias: -0.25,
    flightDuration: 3200,
    orbitDegrees: 8,
    orbitDuration: 4800,
    layers: { graticule: true, counties: true, css: true },
    cssTiers: ["low", "med", "high"],
  },
  lost: {
    id: "lost",
    view: "overall",
    pitch: 0,
    bearing: 0,
    zoomBias: -0.4,
    flightDuration: 2800,
    layers: { graticule: true },
  },
  bedding: {
    id: "bedding",
    view: "bedding",
    pitch: 48,
    bearing: -16,
    zoomBias: 0.2,
    targetId: "plaquemines",
    flightDuration: 3000,
    orbitDegrees: 18,
    orbitDuration: 4200,
    layers: { graticule: true, counties: true, bedding: true },
    beddingSweep: true,
  },
  coverage: {
    id: "coverage",
    view: "coverage",
    pitch: 38,
    bearing: 12,
    zoomBias: 0.2,
    targetId: "terrebonne",
    flightDuration: 2900,
    orbitDegrees: -14,
    orbitDuration: 4000,
    layers: { graticule: true, counties: true, coverage: true },
    coverageSweep: true,
  },
  carbon: {
    id: "carbon",
    /* carbon_columns.geojson ships no baked bounds entry; the css view
       frames the same water the results stand on. */
    view: "css",
    pitch: 52,
    bearing: -24,
    zoomBias: 0.35,
    targetId: "plaquemines",
    flightDuration: 3000,
    orbitDegrees: 24,
    orbitDuration: 4600,
    layers: { graticule: true, counties: true, carbon: true },
    carbonGrow: true,
  },
  return: {
    id: "return",
    view: "css",
    pitch: 42,
    bearing: 18,
    zoomBias: 0.25,
    targetId: "terrebonne",
    flightDuration: 3000,
    orbitDegrees: -18,
    orbitDuration: 4400,
    layers: { graticule: true, counties: true, css: true },
    cssPlayback: true,
    cssTiers: ["low", "med", "high"],
  },
  /* Chapter five - the coast-wide argument told again on two adjoining
     leases. Same camera target throughout; only the survey data changes. */
  "case-before": {
    id: "case-before",
    view: "overall",
    pitch: 30,
    bearing: -8,
    targetId: "bay-boudreau",
    flightDuration: 3400,
    orbitDegrees: 10,
    orbitDuration: 4600,
    layers: { graticule: true, counties: true, case: true },
    casePhase: "before",
  },
  "case-work": {
    id: "case-work",
    view: "overall",
    pitch: 50,
    bearing: -24,
    zoomBias: 0.1,
    targetId: "bay-boudreau",
    flightDuration: 2600,
    layers: { graticule: true, counties: true, case: true, caseBedding: true },
    casePhase: "before",
    caseBeddingSweep: true,
  },
  "case-after": {
    id: "case-after",
    view: "overall",
    pitch: 36,
    bearing: 10,
    targetId: "bay-boudreau",
    flightDuration: 2600,
    orbitDegrees: -12,
    orbitDuration: 5200,
    layers: { graticule: true, counties: true, case: true, caseDredges: true },
    casePhase: "after",
    caseWipe: true,
    casePhotoCycle: true,
  },
  /* Bonus chapter, behind the ?adams flag - the field save. One lease,
     one camera target; the drama is in the data layers, not the flight. */
  "save-island": {
    id: "save-island",
    view: "overall",
    pitch: 32,
    bearing: 14,
    targetId: "lease-32024",
    flightDuration: 3400,
    orbitDegrees: -10,
    orbitDuration: 4600,
    layers: { graticule: true, counties: true, save: true },
    savePhase: "before",
  },
  "save-error": {
    id: "save-error",
    view: "overall",
    pitch: 52,
    bearing: -18,
    zoomBias: 0.15,
    targetId: "lease-32024",
    flightDuration: 2600,
    layers: { graticule: true, counties: true, save: true, saveBedding: true },
    savePhase: "before",
    saveErrorSweep: true,
  },
  "save-fixed": {
    id: "save-fixed",
    view: "overall",
    pitch: 46,
    bearing: 8,
    zoomBias: 0.1,
    targetId: "lease-32024",
    flightDuration: 2600,
    layers: { graticule: true, counties: true, save: true, saveBedding: true },
    savePhase: "before",
    saveBeddingSweep: true,
    savePhotoCycle: true,
  },
  "save-after": {
    id: "save-after",
    view: "overall",
    pitch: 34,
    bearing: -6,
    targetId: "lease-32024",
    flightDuration: 2600,
    orbitDegrees: 12,
    orbitDuration: 5200,
    layers: { graticule: true, counties: true, save: true },
    savePhase: "after",
    saveWipe: true,
  },
  close: {
    id: "close",
    view: "overall",
    pitch: 0,
    bearing: 0,
    flightDuration: 3400,
    layers: { graticule: true, counties: true, bedding: true, css: true },
    cssTiers: ["low", "med", "high"],
  },
};

/** A short, authored flight deck rather than a directory of every
 * county-equivalent or coastal region. */
export const MAP_TARGETS = [
  {
    id: "plaquemines",
    geoid: "22075",
    name: "Plaquemines",
    suffix: "Parish",
    state: "LA",
  },
  {
    id: "terrebonne",
    geoid: "22109",
    name: "Terrebonne",
    suffix: "Parish",
    state: "LA",
  },
  {
    id: "st-bernard",
    geoid: "22087",
    name: "St. Bernard",
    suffix: "Parish",
    state: "LA",
  },
  {
    id: "galveston",
    geoid: "48167",
    name: "Galveston",
    suffix: "County",
    state: "TX",
  },
  {
    id: "southwest-la",
    name: "Southwest",
    suffix: "Louisiana",
    state: "LA",
    /* Calcasieu Lake and Pass west to Marsh Island east; outline in
       southwest-la-outline.ts. */
    bounds: [-93.75, 29.2, -91.3, 30.15] as BBox,
    tag: "REGION",
  },
  {
    id: "chesapeake-bay",
    name: "Chesapeake",
    suffix: "Bay",
    state: "MD · VA",
    bounds: [-77.2, 36.75, -75.35, 39.7] as BBox,
    tag: "REGION",
  },
  {
    id: "bay-boudreau",
    name: "Bay Boudreau",
    suffix: "Leases 30260 · 36166",
    state: "LA",
    /* View extent baked by scripts/bake_bay_boudreau.py (both leases +
       soundings). */
    bounds: [-89.37762, 29.97878, -89.35413, 29.99817] as BBox,
    tag: "CASE STUDY",
  },
  {
    id: "lease-32024",
    name: "Lease 32024",
    suffix: "Adams Bay",
    state: "LA",
    /* View extent baked by scripts/bake_lease_save.py (lease + soundings).
       Listed in the flight deck only when the ?adams chapter is up. */
    bounds: [-89.62892, 29.37404, -89.61488, 29.3884] as BBox,
    tag: "FIELD SAVE",
  },
] as const;

export function mapTarget(id: string | null | undefined) {
  return MAP_TARGETS.find((target) => target.id === id) ?? null;
}

/* Louisiana public oyster grounds - placeholder chart extent used only
   until manifest.json ships real per-layer bounds. */
export const FALLBACK_BOUNDS: BBox = [-93.95, 29.15, -89.6, 30.35];

/* ------------------------------------------------------------------
   Symbology. Every color is a site token so the chart and the
   editorial bands read as one document.
   ------------------------------------------------------------------ */

export const CHART = {
  cultch: "#d6c5aa", // sand - shell returned to the water
  coverage: "#c5d8e3", // mist - sonar-ping survey cells
  graticule: "#c5d8e3",
  /** The one thing on the chart that is wrong on purpose: the errant
      barge load in the field-save chapter. Nothing else may wear it. */
  alert: "#e2694e",
  tiers: {
    low: "#3e7191", // steel   - 20–119 oysters / m²
    med: "#2f8a74", // verdigris - 119–244 oysters / m²
    high: "#d6c5aa", // sand    - ≥ 244 oysters / m²
  },
  /** Low → high oyster density, navy floor to shell-gold peak. */
  densityRamp: ["#16405f", "#3e7191", "#2f8a74", "#5ea183", "#d6c5aa"],
  /** Density bin edges in oysters per square meter (survey convention). */
  densityBins: [20, 119, 244],
  /** Polling substrate classes - cool, bare bottom up to shell-gold reef. */
  substrate: {
    mud: "#16405f", // navy  - mud
    firm: "#3e7191", // steel - firm/hard bottom
    buried: "#8fb0c4", // haze  - buried shell
    scat: "#c5d8e3", // mist  - scattered shell
    reef: "#d6c5aa", // sand  - solid reef
  },
} as const;
