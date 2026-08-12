"use client";

import { useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { BandShell } from "./bands";
import { ACRE_M2, EPA, FISH_LB_PER_ACRE_YEAR } from "./factors";
import {
  fmtCompact,
  fmtInt,
  type CaseStudyManifest,
  type StoryFeatureCollection,
  type StoryManifest,
} from "./use-story-data";

/* ------------------------------------------------------------------
   The worksheet. Everything above this band is our record; this is the
   one place the visitor's own number goes on it.

   Every ratio here is read out of the snapshot — tons per acre, cultch
   per ton — so the arithmetic tracks the survey database instead of a
   sales figure someone typed once. No manifest, no band.
   ------------------------------------------------------------------ */

const MIN_TONS = 100;
const MAX_TONS = 100_000;
const SLIDER_STEPS = 1000;
const PRESETS = [500, 2_500, 10_000, 50_000];

/** Round to a figure a person would actually say out loud. */
function snapTons(value: number): number {
  const clamped = Math.min(MAX_TONS, Math.max(MIN_TONS, value));
  if (clamped < 1_000) return Math.round(clamped / 10) * 10;
  if (clamped < 10_000) return Math.round(clamped / 50) * 50;
  return Math.round(clamped / 100) * 100;
}

const toSlider = (tons: number) =>
  Math.round((Math.log(tons / MIN_TONS) / Math.log(MAX_TONS / MIN_TONS)) * SLIDER_STEPS);

const fromSlider = (position: number) =>
  snapTons(MIN_TONS * Math.pow(MAX_TONS / MIN_TONS, position / SLIDER_STEPS));

export function SizerBand({
  manifest,
  caseManifest,
  caseBoundary,
}: {
  manifest: StoryManifest | null;
  caseManifest: CaseStudyManifest | null;
  caseBoundary: StoryFeatureCollection | null;
}) {
  const [tons, setTons] = useState(2_500);
  /* The number field holds its own text while it is being typed, or
     every keystroke below 100 would be clamped out from under the
     cursor. It re-syncs to `tons` on blur and on any slider move. */
  const [draft, setDraft] = useState<string | null>(null);

  const s = manifest?.stats;
  const surveyedAcres = s?.css_acres?.total;
  const netMt = s?.net_mt_total;
  const cultchTons = s?.bedding_short_tons;

  const mtPerAcre = netMt && surveyedAcres ? netMt / surveyedAcres : null;
  const cultchPerMt = cultchTons && netMt ? cultchTons / netMt : null;

  const leaseRings = useMemo(() => projectLease(caseBoundary), [caseBoundary]);

  if (mtPerAcre == null) return null;

  const acres = tons / mtPerAcre;
  const fishLb = acres * FISH_LB_PER_ACRE_YEAR;
  const cars = tons * EPA.passenger_cars_year;
  const leaseAcres = caseManifest?.acres ?? null;
  const leaseCount = leaseAcres ? acres / leaseAcres : null;
  const latestVintage = s?.credits?.by_vintage?.at(-1);
  const vintageShare = latestVintage?.count ? tons / latestVintage.count : null;

  const commit = (value: number) => {
    setTons(snapTons(value));
    setDraft(null);
  };

  return (
    <BandShell>
      <SectionHeading
        eyebrow="Size it"
        title="Put your number on the chart"
        intro={
          <p>
            Everything above this line is our record. Set a tonnage below and it becomes
            yours — the acres of bottom it represents, the rock and shell that went over the
            side to build them, and the fishery those acres produce every year after. The
            ratios are read straight off the survey snapshot on this page.
          </p>
        }
      />

      <Reveal className="mt-14">
        <div className="rounded-lg border border-navy/10 bg-white p-7 sm:p-9">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-14">
            {/* ---- controls + figures ---- */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <label
                    htmlFor="sizer-tons"
                    className="story-note-ink"
                  >
                    Metric tons CO₂e
                  </label>
                  <div className="mt-2 flex items-baseline gap-2">
                    <input
                      id="sizer-tons"
                      type="number"
                      inputMode="numeric"
                      min={MIN_TONS}
                      max={MAX_TONS}
                      value={draft ?? String(tons)}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        const next = Number(event.target.value);
                        if (Number.isFinite(next) && next >= MIN_TONS && next <= MAX_TONS) {
                          setTons(next);
                        }
                      }}
                      onBlur={() => {
                        const next = Number(draft ?? tons);
                        commit(Number.isFinite(next) && next > 0 ? next : tons);
                      }}
                      className="story-tons-input"
                    />
                    <span className="font-display text-lg text-steel">t CO₂e</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={tons === preset}
                      onClick={() => commit(preset)}
                      className={`story-preset ${tons === preset ? "is-active" : ""}`}
                    >
                      {fmtCompact(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={SLIDER_STEPS}
                step={1}
                value={toSlider(tons)}
                onChange={(event) => commit(fromSlider(Number(event.target.value)))}
                className="story-range mt-7 w-full"
                aria-label="Purchase size in metric tons of CO₂e"
                aria-valuetext={`${fmtInt(tons)} metric tons`}
              />
              <div className="story-range-ticks mt-2" aria-hidden="true">
                <span>{fmtCompact(MIN_TONS)}</span>
                <span>{fmtCompact(MAX_TONS)}</span>
              </div>

              <dl className="mt-9 grid gap-x-8 gap-y-7 border-t border-navy/10 pt-8 sm:grid-cols-2">
                <Figure
                  value={fmtInt(Math.round(acres))}
                  unit="acres"
                  label="of surveyed reef at commercial density"
                />
                {cultchPerMt != null && (
                  <Figure
                    value={fmtInt(Math.round(tons * cultchPerMt))}
                    unit="short tons"
                    label="of shell, limestone and rock over the side"
                  />
                )}
                <Figure
                  value={fmtCompact(Math.round(fishLb))}
                  unit="lb / year"
                  label="of added fish and crustacean production, recurring"
                />
                {leaseCount != null && caseManifest && (
                  <Figure
                    value={
                      /* Two decimals under 1×, or a 100 t buy reads "0.0". */
                      leaseCount >= 10
                        ? fmtInt(Math.round(leaseCount))
                        : leaseCount.toFixed(leaseCount < 1 ? 2 : 1)
                    }
                    unit="×"
                    label={`leases the size of ${caseManifest.lease_number}, the one in chapter five`}
                  />
                )}
              </dl>

              <p className="mt-8 text-sm leading-relaxed text-ink/60">
                Roughly {fmtInt(Math.round(cars))} cars off the road for a year
                {vintageShare != null && latestVintage
                  ? `, and ${vintageShare < 0.01 ? "under 1" : (vintageShare * 100).toFixed(vintageShare < 0.1 ? 1 : 0)}% of the ${latestVintage.year} vintage`
                  : ""}
                .
              </p>
            </div>

            {/* ---- the footprint, drawn against real water ---- */}
            <div>
              <p className="story-note-ink">Your footprint, to scale</p>
              <FootprintPlot acres={acres} lease={leaseRings} />
              <div className="mt-4 space-y-2 text-xs text-ink/60">
                <span className="flex items-center gap-2">
                  <span
                    className="story-swatch"
                    style={{ background: "rgba(35,112,93,0.18)", borderColor: "#23705d" }}
                  />
                  Your {fmtInt(Math.round(acres))} acres
                </span>
                {leaseRings.length > 0 && caseManifest && (
                  <span className="flex items-center gap-2">
                    <span
                      className="story-swatch"
                      style={{ background: "rgba(13,42,68,0.08)", borderColor: "#0d2a44" }}
                    />
                    Lease {caseManifest.lease_number}, {fmtInt(caseManifest.acres)} acres
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-10 border-t border-navy/10 pt-6 text-xs leading-relaxed text-ink/45">
            Derived from this page&rsquo;s own snapshot: {fmtInt(netMt)} net MT CO₂e measured
            across {fmtInt(surveyedAcres)} surveyed acres ({mtPerAcre.toFixed(1)} MT per acre)
            {cultchPerMt != null
              ? `, and ${fmtInt(cultchTons)} short tons of cultch placed against those tons (${cultchPerMt.toFixed(2)} short tons per credited ton)`
              : ""}
            . Fishery production per Peterson et al. (2003); car equivalence per the EPA
            Greenhouse Gas Equivalencies Calculator. Acreage shown is the reef your tonnage
            represents at the program&rsquo;s measured ratio, not a parcel deeded to you.
            {s?.credits?.total != null
              ? ` ${fmtInt(s.credits.total)} serialized credits have been issued to date.`
              : ""}
          </p>
        </div>
      </Reveal>
    </BandShell>
  );
}

function Figure({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-display text-3xl text-verdigris-600 sm:text-4xl">{value}</span>
        <span className="ml-2 font-display text-base text-steel">{unit}</span>
        <p className="prose-cv mt-2 text-[0.9375rem]" aria-hidden="true">
          {label}
        </p>
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------
   Footprint plot — the buyer's acreage as a square, with the actual
   case-study lease drawn at the same scale inside it. Both shapes and
   the scale bar share one metres-per-unit viewBox, so the comparison
   holds at every slider position.
   ------------------------------------------------------------------ */

type Ring = [number, number][];

const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LON = 111_320;
const SCALE_BAR_STEPS = [50, 100, 200, 250, 500, 1_000, 2_000, 2_500, 5_000, 10_000];

/** Flat-earth projection about the lease's own centre — exact enough
    across a hundred acres, and it keeps the plot dependency-free. */
function projectLease(fc: StoryFeatureCollection | null): Ring[] {
  if (!fc) return [];
  const rings: Ring[] = [];
  for (const feature of fc.features) {
    const geometry = feature.geometry;
    if (geometry.type === "Polygon") {
      for (const ring of geometry.coordinates) rings.push(ring as Ring);
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) rings.push(ring as Ring);
      }
    }
  }
  if (rings.length === 0) return [];

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      west = Math.min(west, lon);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      north = Math.max(north, lat);
    }
  }
  const lon0 = (west + east) / 2;
  const lat0 = (south + north) / 2;
  const metresPerDegLon = M_PER_DEG_LON * Math.cos((lat0 * Math.PI) / 180);

  return rings.map((ring) =>
    ring.map(
      ([lon, lat]) =>
        [(lon - lon0) * metresPerDegLon, -(lat - lat0) * M_PER_DEG_LAT] as [number, number],
    ),
  );
}

function FootprintPlot({ acres, lease }: { acres: number; lease: Ring[] }) {
  const side = Math.sqrt(Math.max(1, acres) * ACRE_M2);
  const leaseReach = lease.reduce(
    (reach, ring) =>
      ring.reduce((r, [x, y]) => Math.max(r, Math.abs(x), Math.abs(y)), reach),
    0,
  );
  const half = Math.max(side / 2, leaseReach) * 1.18;
  const scaleBar =
    [...SCALE_BAR_STEPS].reverse().find((step) => step <= half) ?? SCALE_BAR_STEPS[0];

  return (
    <div className="mt-3">
      <svg
        viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
        className="h-auto w-full rounded-lg border border-navy/10 bg-pearl"
        role="img"
        aria-label={`A square of ${fmtInt(Math.round(acres))} acres${
          lease.length > 0 ? ", drawn at the same scale as the outline of lease 30260" : ""
        }.`}
      >
        <rect
          x={-side / 2}
          y={-side / 2}
          width={side}
          height={side}
          fill="rgba(35,112,93,0.16)"
          stroke="#23705d"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
        {lease.map((ring, i) => (
          <path
            key={i}
            d={`M${ring.map(([x, y]) => `${x},${y}`).join("L")}Z`}
            fill="rgba(13,42,68,0.08)"
            stroke="#0d2a44"
            strokeWidth={1.75}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="block border-x border-b border-ink/40"
          style={{ width: `${(scaleBar / (half * 2)) * 100}%`, height: "0.3rem" }}
          aria-hidden="true"
        />
        <span className="story-note-ink">
          {scaleBar >= 1_000 ? `${scaleBar / 1_000} km` : `${scaleBar} m`}
        </span>
      </div>
    </div>
  );
}
