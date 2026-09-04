"use client";

import { useState } from "react";
import {
  CHART,
  MAP_TARGETS,
  mapTarget,
  type LayerKey,
  type MapTarget,
  type SceneMap,
} from "./scenes";
import { vintageColor, type ChartView } from "./map-stage";
import { fmtCompact } from "./use-story-data";

/* ------------------------------------------------------------------
   Mission instrumentation. The chart still owns the spectacle; this
   layer tells the visitor what the camera is doing, lets them retarget
   authored flights, and keeps every animation anchored to real survey
   geography rather than decorative motion.
   ------------------------------------------------------------------ */

function toDM(value: number, axis: "lat" | "lon"): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg}°${min.toFixed(2).padStart(5, "0")}′ ${hemi}`;
}

const LEGENDS: { key: LayerKey; label: string; color: string }[] = [
  { key: "bedding", label: "Cultch placed", color: CHART.cultch },
  { key: "caseBedding", label: "Cultch placed", color: CHART.cultch },
  { key: "saveBedding", label: "Cultch placed", color: CHART.cultch },
  { key: "coverage", label: "Survey soundings", color: CHART.coverage },
  { key: "caseDredges", label: "Dredge tow, photographed", color: "#ffffff" },
];

const TIER_LEGEND = [
  { label: `~6 MT CO2e per Acre`, color: CHART.tiers.low },
  { label: `~12 MT CO2e per Acre`, color: CHART.tiers.med },
  { label: `~19 MT CO2e per Acre`, color: CHART.tiers.high },
];

/* Polling substrate classes, worst bottom first - chapter five's key. */
const SUBSTRATE_LEGEND = [
  { label: "Mud", color: CHART.substrate.mud },
  { label: "Clay", color: CHART.substrate.firm },
  { label: "Buried shell", color: CHART.substrate.buried },
  { label: "Scattered shell", color: CHART.substrate.scat },
  { label: "Solid reef", color: CHART.substrate.reef },
];

export function Hud({
  view,
  scenes,
  scene,
  snapshotDate,
  visible,
  targetId,
  carbonYears,
  carbonAreaFilter,
  carbonAreaNet,
  showSaveTarget = false,
  showLegend: legendEnabled = true,
  targets,
  onTarget,
  onCarbonAreaFilter,
}: {
  view: ChartView | null;
  /* Supplied by the caller for the same reason the chart takes it: the
     legend and the flight deck follow whichever storymap is running. */
  scenes: SceneMap;
  scene: string;
  snapshotDate?: string;
  visible: boolean;
  targetId: string | null;
  /** Vintages in carbon_columns.geojson, oldest first - the carbon
      scene's legend follows the data like the columns do. */
  carbonYears?: number[];
  /** Opt-in link between the selected map target, the 3D columns, and
      the net figure in the carbon chapter card. */
  carbonAreaFilter: boolean;
  carbonAreaNet?: number | null;
  /** The ?adams chapter is up - list its lease in the flight deck. */
  showSaveTarget?: boolean;
  /** Drop the swatch legend outright. The partnerships storymap runs
      the same layers but argues its case in prose, so it asks for the
      flight deck without the key. */
  showLegend?: boolean;
  /** Override the flight deck outright. A storymap that visits a
      different set of places passes its own list; omit it and the deck
      is the house list, minus anything still gated. */
  targets?: readonly MapTarget[];
  onTarget: (id: string) => void;
  onCarbonAreaFilter: (enabled: boolean) => void;
}) {
  /* The rail is useful but it sits over the chart; let the visitor fold
     it down to the header strip and keep the compass. */
  const [targetsOpen, setTargetsOpen] = useState(true);
  const layers = scenes[scene]?.layers ?? {};
  const showTiers = !!layers.css;
  const showCarbon = !!layers.carbon && !!carbonYears?.length;
  const showSubstrate = !!layers.case || !!layers.save;
  const showErrant = !!layers.saveBedding;
  const showLegend =
    legendEnabled &&
    (showTiers || showCarbon || showSubstrate || LEGENDS.some((legend) => layers[legend.key]));
  const canTarget = !!layers.counties;
  /* The field-save lease stays off the public flight deck; it flies
     only for readers who arrived with the chapter's URL flag. */
  const railTargets =
    targets ??
    MAP_TARGETS.filter((candidate) => showSaveTarget || candidate.id !== "lease-32024");
  const target = mapTarget(targetId);
  const compassBearing = view?.bearing ?? 0;

  return (
    /* pointer-events-none is unconditional: this root spans the whole
       viewport above the narrative (z-20 > z-10), so with default
       hit-testing it silently shields every band control and the close
       CTAs beneath it. The flight deck opts back in via
       .story-target-panel { pointer-events: auto }. */
    <div
      className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${
        visible ? "story-hud-visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* A light targeting reticle makes the authored orbit legible without
          pretending that the chart is a weapons interface. */}
      {canTarget && (
        <div className="story-reticle pointer-events-none absolute" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <span>{target ? `${target.name.toUpperCase()} ${target.suffix.toUpperCase()}` : "AREA TARGET"}</span>
        </div>
      )}

      {/* position readout + imagery credit */}


      {/* flight deck + legend */}
      {(canTarget || showLegend) && (
        <div className="absolute right-4 top-20 hidden w-64 flex-col gap-3 lg:flex lg:right-8">
          {canTarget && (
            <aside className="story-hud story-target-panel rounded-sm p-3" aria-label="Map area targets">
              <div
                className={`flex items-center justify-between ${
                  targetsOpen ? "mb-2 border-b border-white/10 pb-2" : ""
                }`}
              >
                <button
                  type="button"
                  className="story-target-toggle"
                  aria-expanded={targetsOpen}
                  aria-controls="story-target-list"
                  onClick={() => setTargetsOpen((open) => !open)}
                >
                  <i className={targetsOpen ? "is-open" : ""} aria-hidden="true" />
                  <span>AREAS</span>
                </button>
                <div className="story-compass" aria-hidden="true">
                  <span>N</span>
                  <i style={{ transform: `rotate(${compassBearing}deg)` }} />
                </div>
              </div>
              {showCarbon && targetsOpen && (
                <div className="story-area-filter">
                  <span className="min-w-0">
                    <strong>Filter net</strong>
                    <small aria-live="polite">
                      {carbonAreaFilter
                        ? `${target?.name ?? "Selected area"} · ${fmtCompact(carbonAreaNet)} MT`
                        : "All areas"}
                    </small>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={carbonAreaFilter}
                    aria-label="Filter net carbon and 3D columns by the selected area"
                    className="story-area-switch"
                    onClick={() => onCarbonAreaFilter(!carbonAreaFilter)}
                  >
                    <i aria-hidden="true" />
                  </button>
                </div>
              )}
              <div id="story-target-list" hidden={!targetsOpen} className="space-y-1">
                {railTargets.map((candidate, index) => {
                  const active = candidate.id === targetId;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      aria-pressed={active}
                      className={`story-target-button group w-full ${active ? "is-active" : ""}`}
                      onClick={() => onTarget(candidate.id)}
                    >
                      <span className="story-target-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 text-left">
                        <strong>{candidate.name}</strong>
                        <small>
                          {candidate.suffix} · {candidate.state}
                        </small>
                      </span>
                      <span className="story-target-dot" />
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {showLegend && (
            <div className="story-hud pointer-events-none rounded-sm px-4 py-3" aria-hidden="true">
              <div className="space-y-2">
                {LEGENDS.filter((legend) => layers[legend.key]).map((legend) => (
                  <div key={legend.label} className="flex items-center gap-2.5">
                    <span className="story-swatch" style={{ background: legend.color }} />
                    <span>{legend.label}</span>
                  </div>
                ))}
                {showTiers &&
                  TIER_LEGEND.map((tier) => (
                    <div key={tier.label} className="flex items-center gap-2.5">
                      <span className="story-swatch" style={{ background: tier.color }} />
                      <span>{tier.label}</span>
                    </div>
                  ))}
                {showCarbon &&
                  carbonYears?.map((year, i) => (
                    <div key={year} className="flex items-center gap-2.5">
                      <span className="story-swatch" style={{ background: vintageColor(i) }} />
                      <span>{year} vintage · net MT CO2e</span>
                    </div>
                  ))}
                {showSubstrate &&
                  SUBSTRATE_LEGEND.map((entry) => (
                    <div key={entry.label} className="flex items-center gap-2.5">
                      <span className="story-swatch" style={{ background: entry.color }} />
                      <span>{entry.label}</span>
                    </div>
                  ))}
                {showErrant && (
                  <div className="flex items-center gap-2.5">
                    <span className="story-swatch" style={{ background: CHART.alert }} />
                    <span>The errant load</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
