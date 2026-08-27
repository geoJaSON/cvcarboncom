"use client";

import { memo, useMemo } from "react";
import type { FeatureCollection, Geometry, Position } from "geojson";
import { CHART } from "./scenes";
import { ChartTable } from "./charts";
import { CHESAPEAKE_OUTLINE } from "./chesapeake-outline";
import { GULF_STATE_OUTLINES } from "./gulf-state-outlines";
import { fmtInt, type StoryFeatureCollection, type StoryManifest } from "./use-story-data";

/* ------------------------------------------------------------------
   The ledger, year by year - every surveyed vintage drawn as its own
   map strip at one shared scale, so growth reads as the chart filling
   in. Rendered straight from css_tiers.geojson, which the map stage
   has already fetched: a re-baked snapshot updates these strips with
   no code change, and a missing file renders nothing.

   Two encodings share each strip, because most surveyed patches are
   genuinely smaller than a pixel at strip scale: patches big enough
   to shade are drawn as true fills (ink proportional to area), and
   every smaller patch becomes one fixed-size speck - position-true,
   deduplicated on a coarse grid so dense reef reads as texture, not
   as inflated acreage. The figure note says so; exact acreage lives
   in each strip's header and the table twin.

   The program works two coasts an ocean apart, so one frame would
   shrink both to dust: each strip is the Gulf at full width with a
   Chesapeake Bay inset that lights up the season Maryland enters the
   ledger. Rings route to a side by longitude - nothing straddles the
   split, there is only ocean between them.

   The strips wear the map's own tier hues (CHART.tiers) rather than
   the pearl-band ramp in charts.tsx - they are the stage's data drawn
   small, and matching the stage and HUD legend outranks re-stepping
   the ramp. Tier identity never rides on color alone: the tiers are
   ordered magnitude with a legend, and the table twin carries exact
   figures.
   ------------------------------------------------------------------ */

const TIER_ORDER = ["low", "med", "high"] as const;
type Tier = (typeof TIER_ORDER)[number];

const STRIP_W = 1000;
/** West of this longitude is the Gulf; east is the Chesapeake. */
const COAST_SPLIT = -80;
/** Inset geometry: gap between the Gulf frame and the Chesapeake box. */
const INSET_W = 112;
const INSET_GAP = 16;
/** Dedupe tolerance for coincident points, in viewBox units - small
    enough that fills keep essentially all of their true area. */
const MIN_STEP = 0.1;
/** Speck side length and the grid specks deduplicate on. */
const DOT_SIZE = 1.4;
const DOT_GRID = 1.6;
/** Graticule spacing in degrees, matching the map stage's grid. */
const GRID_STEP = 0.25;

type Bounds = { minLon: number; maxLon: number; minLat: number; maxLat: number };

type Frame = Bounds & {
  x: (lon: number) => number;
  y: (lat: number) => number;
  w: number;
  h: number;
  ox: number;
  oy: number;
};

/** One tier on one side of one strip: area-true fills plus the speck
    layer for patches too small to shade. */
type TierPaths = { fill: string; dots: string };

type YearPaths = {
  year: number;
  gulf: Partial<Record<Tier, TierPaths>>;
  ches: Partial<Record<Tier, TierPaths>>;
};

type Board = {
  w: number;
  h: number;
  graticule: string;
  states: string;
  stateLabels: { name: string; x: number }[];
  counties: string;
  chesOutline: string;
  chesBox: { x: number; y: number; w: number; h: number } | null;
  years: YearPaths[];
};

const GULF_STATE_LABELS = [
  { name: "TEXAS", lon: -94.85 },
  { name: "LOUISIANA", lon: -91.55 },
  { name: "MISSISSIPPI", lon: -89.05 },
] as const;

/** Outer rings and holes alike - drawn into one path with evenodd fill. */
function polygonRings(geometry: Geometry | null | undefined): Position[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function grow(b: Bounds | null, ring: Position[]): Bounds | null {
  for (const [lon, lat] of ring) {
    if (!b) {
      b = { minLon: lon, maxLon: lon, minLat: lat, maxLat: lat };
      continue;
    }
    if (lon < b.minLon) b.minLon = lon;
    if (lon > b.maxLon) b.maxLon = lon;
    if (lat < b.minLat) b.minLat = lat;
    if (lat > b.maxLat) b.maxLat = lat;
  }
  return b;
}

function pad(b: Bounds, lonFrac: number, latFrac: number): Bounds {
  const padLon = (b.maxLon - b.minLon) * lonFrac;
  const padLat = (b.maxLat - b.minLat) * latFrac;
  return {
    minLon: b.minLon - padLon,
    maxLon: b.maxLon + padLon,
    minLat: b.minLat - padLat,
    maxLat: b.maxLat + padLat,
  };
}

/** Equirectangular frame for bounds, fit inside boxW × boxH (boxH null =
    height follows from the aspect), centered, at offset ox/oy. */
function frameFor(b: Bounds, boxW: number, boxH: number | null, ox = 0, oy = 0): Frame | null {
  const dLon = b.maxLon - b.minLon;
  const dLat = b.maxLat - b.minLat;
  if (!(dLon > 0) || !(dLat > 0)) return null;
  const midLat = ((b.minLat + b.maxLat) / 2) * (Math.PI / 180);
  const aspect = dLat / (dLon * Math.cos(midLat));
  let w = boxW;
  let h = w * aspect;
  if (boxH != null && h > boxH) {
    h = boxH;
    w = h / aspect;
  }
  const x0 = ox + (boxW - w) / 2;
  const y0 = oy + (boxH != null ? (boxH - h) / 2 : 0);
  return {
    ...b,
    w,
    h,
    ox: x0,
    oy: y0,
    x: (lon) => x0 + ((lon - b.minLon) / dLon) * w,
    y: (lat) => y0 + ((b.maxLat - lat) / dLat) * h,
  };
}

/** A ring big enough to shade returns its path; a sub-pixel ring
    returns null so the caller can speck it instead. */
function ringToPath(ring: Position[], fr: Frame): string | null {
  let d = "";
  let lastX = NaN;
  let lastY = NaN;
  let kept = 0;
  for (const [lon, lat] of ring) {
    const px = fr.x(lon);
    const py = fr.y(lat);
    if (kept > 0 && Math.abs(px - lastX) + Math.abs(py - lastY) < MIN_STEP) continue;
    d += `${kept === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    lastX = px;
    lastY = py;
    kept += 1;
  }
  if (kept < 3) return null;
  return `${d}Z`;
}

type ShapeAcc = { fill: string; dots: string; seen: Set<string> };

function addRing(acc: ShapeAcc, ring: Position[], fr: Frame) {
  const d = ringToPath(ring, fr);
  if (d != null) {
    acc.fill += d;
    return;
  }
  const px = fr.x(ring[0][0]);
  const py = fr.y(ring[0][1]);
  const key = `${Math.round(px / DOT_GRID)},${Math.round(py / DOT_GRID)}`;
  if (acc.seen.has(key)) return;
  acc.seen.add(key);
  const half = DOT_SIZE / 2;
  acc.dots += `M${(px - half).toFixed(1)} ${(py - half).toFixed(1)}h${DOT_SIZE}v${DOT_SIZE}h${-DOT_SIZE}Z`;
}

function collectShapes(
  fc: FeatureCollection,
  fr: Frame,
  side: "gulf" | "ches",
  keep: (props: unknown) => boolean,
): TierPaths | null {
  const acc: ShapeAcc = { fill: "", dots: "", seen: new Set() };
  for (const feature of fc.features) {
    if (!keep(feature.properties)) continue;
    for (const ring of polygonRings(feature.geometry)) {
      if (ring.length === 0) continue;
      const onSide = ring[0][0] < COAST_SPLIT ? "gulf" : "ches";
      if (onSide !== side) continue;
      addRing(acc, ring, fr);
    }
  }
  if (!acc.fill && !acc.dots) return null;
  return { fill: acc.fill, dots: acc.dots };
}

/** Outline-only path (counties, bay shoreline): sub-pixel rings drop. */
function outlinePath(
  fc: FeatureCollection,
  fr: Frame,
  side: "gulf" | "ches",
): string {
  let d = "";
  for (const feature of fc.features) {
    for (const ring of polygonRings(feature.geometry)) {
      if (ring.length === 0) continue;
      const onSide = ring[0][0] < COAST_SPLIT ? "gulf" : "ches";
      if (onSide !== side) continue;
      d += ringToPath(ring, fr) ?? "";
    }
  }
  return d;
}

function graticulePath(fr: Frame): string {
  let d = "";
  for (let lon = Math.ceil(fr.minLon / GRID_STEP) * GRID_STEP; lon < fr.maxLon; lon += GRID_STEP) {
    d += `M${fr.x(lon).toFixed(1)} ${fr.oy.toFixed(1)}V${(fr.oy + fr.h).toFixed(1)}`;
  }
  for (let lat = Math.ceil(fr.minLat / GRID_STEP) * GRID_STEP; lat < fr.maxLat; lat += GRID_STEP) {
    d += `M${fr.ox.toFixed(1)} ${fr.y(lat).toFixed(1)}H${(fr.ox + fr.w).toFixed(1)}`;
  }
  return d;
}

function buildBoard(
  cssTiers: StoryFeatureCollection,
  counties: StoryFeatureCollection | null,
): Board | null {
  let gulfBounds: Bounds | null = null;
  let chesBounds: Bounds | null = null;
  const years = new Set<number>();
  for (const feature of cssTiers.features) {
    const year = Number((feature.properties as { year?: unknown } | null)?.year);
    if (Number.isFinite(year)) years.add(year);
    for (const ring of polygonRings(feature.geometry)) {
      if (ring.length === 0) continue;
      if (ring[0][0] < COAST_SPLIT) gulfBounds = grow(gulfBounds, ring);
      else chesBounds = grow(chesBounds, ring);
    }
  }
  if (!gulfBounds && chesBounds) {
    /* A future all-Chesapeake snapshot promotes the bay to the strip. */
    gulfBounds = chesBounds;
    chesBounds = null;
  }
  if (!gulfBounds || years.size === 0) return null;

  const gulfW = chesBounds ? STRIP_W - INSET_W - INSET_GAP : STRIP_W;
  const gulf = frameFor(pad(gulfBounds, 0.03, 0.1), gulfW, null);
  if (!gulf) return null;
  const h = Math.max(120, Math.round(gulf.h));

  let ches: Frame | null = null;
  let chesBox: Board["chesBox"] = null;
  if (chesBounds) {
    chesBox = { x: gulfW + INSET_GAP, y: 0, w: INSET_W, h };
    /* Units reserved under the bay for the inset's label. */
    ches = frameFor(pad(chesBounds, 0.25, 0.12), INSET_W - 8, h - 22, chesBox.x + 4, 4);
  }

  const tierPaths = (year: number, tier: Tier, fr: Frame, side: "gulf" | "ches") =>
    collectShapes(cssTiers, fr, side, (props) => {
      const p = props as { year?: unknown; tier?: unknown } | null;
      return Number(p?.year) === year && p?.tier === tier;
    });

  return {
    w: STRIP_W,
    h,
    graticule: graticulePath(gulf),
    states: outlinePath(GULF_STATE_OUTLINES, gulf, "gulf"),
    stateLabels: GULF_STATE_LABELS.filter(
      ({ lon }) => lon >= gulf.minLon && lon <= gulf.maxLon,
    ).map(({ name, lon }) => ({ name, x: gulf.x(lon) })),
    counties: counties ? outlinePath(counties, gulf, "gulf") : "",
    chesOutline: ches ? outlinePath(CHESAPEAKE_OUTLINE, ches, "ches") : "",
    chesBox,
    years: Array.from(years)
      .sort((a, b) => a - b)
      .map((year) => {
        const paths: YearPaths = { year, gulf: {}, ches: {} };
        for (const tier of TIER_ORDER) {
          const dGulf = tierPaths(year, tier, gulf, "gulf");
          if (dGulf) paths.gulf[tier] = dGulf;
          if (ches) {
            const dChes = tierPaths(year, tier, ches, "ches");
            if (dChes) paths.ches[tier] = dChes;
          }
        }
        return paths;
      }),
  };
}

const NOTE_TEXT = {
  fontFamily: "var(--font-chart)",
} as const;

function TierLayer({ paths, tier }: { paths: TierPaths; tier: Tier }) {
  return (
    <g>
      {paths.fill && (
        <path
          d={paths.fill}
          fill={CHART.tiers[tier]}
          fillOpacity="0.7"
          fillRule="evenodd"
          stroke={CHART.tiers[tier]}
          strokeOpacity="0.8"
          strokeWidth="0.35"
        />
      )}
      {paths.dots && <path d={paths.dots} fill={CHART.tiers[tier]} fillOpacity="0.45" />}
    </g>
  );
}

export const YearBoard = memo(function YearBoard({
  manifest,
  cssTiers,
  counties,
}: {
  manifest: StoryManifest | null;
  cssTiers: StoryFeatureCollection | null;
  counties: StoryFeatureCollection | null;
}) {
  const board = useMemo(
    () => (cssTiers ? buildBoard(cssTiers, counties) : null),
    [cssTiers, counties],
  );
  if (!board) return null;

  const credits = new Map(
    (manifest?.stats?.credits?.by_vintage ?? []).map((r) => [r.year, r.count]),
  );
  const acres = new Map(
    (manifest?.stats?.css_by_year ?? []).map((r) => [
      r.year,
      r.low_acres + r.med_acres + r.high_acres,
    ]),
  );

  return (
    <figure>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-mist/70">
        {(
          [
            ["high", "≥ 244 / m²"],
            ["med", "119–244 / m²"],
            ["low", "20–119 / m²"],
          ] as const
        ).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="story-swatch"
              style={{ background: CHART.tiers[k], borderColor: "rgba(197,216,227,0.25)" }}
            />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-mist/50 sm:ml-auto">
          <svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true">
            <path d="M0 2H28" stroke="currentColor" strokeOpacity="0.8" />
            <path d="M0 6H28" stroke="currentColor" strokeOpacity="0.5" strokeDasharray="3 2" />
          </svg>
          State / surveyed county
        </span>
      </div>
      <div className="mt-4 grid gap-5">
        {board.years.map((y) => {
          const hasChes = TIER_ORDER.some((t) => y.ches[t]);
          const yearCredits = credits.get(y.year);
          const yearAcres = acres.get(y.year);
          return (
            <div key={y.year} className="rounded-lg border border-white/10 bg-navy/40 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="font-display text-2xl text-white">{y.year}</span>
                {(yearCredits != null || yearAcres != null) && (
                  <span className="story-chart-note">
                    {yearCredits != null && <>{fmtInt(yearCredits)} credits</>}
                    {yearCredits != null && yearAcres != null && <> · </>}
                    {yearAcres != null && <>{fmtInt(yearAcres)} acres at density</>}
                  </span>
                )}
              </div>
              <svg
                viewBox={`0 0 ${board.w} ${board.h}`}
                className="mt-3 h-auto w-full"
                role="img"
                aria-label={`${y.year}: ${
                  yearCredits != null ? `${fmtInt(yearCredits)} credits issued against ` : ""
                }${
                  yearAcres != null ? `${fmtInt(yearAcres)} acres of ` : ""
                }reef surveyed at commercial density${
                  hasChes ? ", including the first Chesapeake Bay water" : ""
                }`}
              >
                <defs>
                  <clipPath id={`yb-gulf-${y.year}`}>
                    <rect
                      x="0"
                      y="0"
                      width={board.chesBox ? board.chesBox.x - INSET_GAP : board.w}
                      height={board.h}
                    />
                  </clipPath>
                  {board.chesBox && (
                    <clipPath id={`yb-ches-${y.year}`}>
                      <rect
                        x={board.chesBox.x}
                        y={board.chesBox.y}
                        width={board.chesBox.w}
                        height={board.chesBox.h}
                      />
                    </clipPath>
                  )}
                </defs>

                <g clipPath={`url(#yb-gulf-${y.year})`}>
                  <path
                    d={board.states}
                    fill="#c5d8e3"
                    fillOpacity="0.025"
                    fillRule="evenodd"
                    stroke="#c5d8e3"
                    strokeOpacity="0.42"
                    strokeWidth="1.25"
                  />
                  <path d={board.graticule} fill="none" stroke="#c5d8e3" strokeOpacity="0.09" strokeWidth="1" />
                  {board.counties && (
                    <path
                      d={board.counties}
                      fill="none"
                      stroke="#c5d8e3"
                      strokeOpacity="0.22"
                      strokeWidth="1"
                      strokeDasharray="3 2"
                    />
                  )}
                  {TIER_ORDER.map((tier) =>
                    y.gulf[tier] ? <TierLayer key={tier} paths={y.gulf[tier]} tier={tier} /> : null,
                  )}
                  {board.stateLabels.map((label) => (
                    <text
                      key={label.name}
                      x={label.x}
                      y="13"
                      textAnchor="middle"
                      fontSize="9"
                      letterSpacing="0.16em"
                      fill="#c5d8e3"
                      fillOpacity="0.52"
                      stroke="#071722"
                      strokeOpacity="0.75"
                      strokeWidth="3"
                      paintOrder="stroke"
                      style={NOTE_TEXT}
                    >
                      {label.name}
                    </text>
                  ))}
                  <text
                    x="4"
                    y={board.h - 6}
                    fontSize="9"
                    letterSpacing="0.14em"
                    fill="#c5d8e3"
                    fillOpacity="0.4"
                    style={NOTE_TEXT}
                  >
                    GULF COAST · TX–LA
                  </text>
                </g>

                {board.chesBox && (
                  <g>
                    <rect
                      x={board.chesBox.x}
                      y={board.chesBox.y + 0.5}
                      width={board.chesBox.w - 0.5}
                      height={board.chesBox.h - 1}
                      fill="none"
                      stroke="#c5d8e3"
                      strokeOpacity={hasChes ? 0.3 : 0.15}
                    />
                    <g clipPath={`url(#yb-ches-${y.year})`}>
                      {board.chesOutline && (
                        <path
                          d={board.chesOutline}
                          fill="none"
                          stroke="#c5d8e3"
                          strokeOpacity={hasChes ? 0.3 : 0.15}
                          strokeWidth="1"
                        />
                      )}
                      {TIER_ORDER.map((tier) =>
                        y.ches[tier] ? (
                          <TierLayer key={tier} paths={y.ches[tier]} tier={tier} />
                        ) : null,
                      )}
                    </g>
                    <text
                      x={board.chesBox.x + board.chesBox.w / 2}
                      y={board.h - 6}
                      textAnchor="middle"
                      fontSize="9"
                      letterSpacing="0.14em"
                      fill="#c5d8e3"
                      fillOpacity={hasChes ? 0.4 : 0.25}
                      style={NOTE_TEXT}
                    >
                      CHESAPEAKE · MD
                    </text>
                  </g>
                )}
              </svg>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-mist/40">
        A speck is a surveyed patch too small to shade at this scale · acreage per year in the
        header, not the ink
      </p>
      <ChartTable
        caption="Credits issued and surveyed reef acres, by vintage year"
        head={["Vintage", "Credits issued", "Acres at density"]}
        rows={board.years.map((y) => [
          y.year,
          credits.get(y.year) ?? "-",
          acres.get(y.year) ?? "-",
        ])}
      />
    </figure>
  );
});
