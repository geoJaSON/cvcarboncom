"use client";

import { useState } from "react";
import { CHART, MAP_TARGETS, SCENES, mapTarget, type SceneId } from "./scenes";
import { fmtInt, type StorySeason } from "./use-story-data";
import { vintageColor, type ChartView, type StageState } from "./map-stage";

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

function heading(value: number | undefined): string {
  if (value == null) return "—";
  return `${Math.round((value + 360) % 360).toString().padStart(3, "0")}°`;
}

const LEGENDS: { key: keyof (typeof SCENES)["hero"]["layers"]; label: string; color: string }[] = [
  { key: "bedding", label: "Cultch placed", color: CHART.cultch },
  { key: "caseBedding", label: "Cultch placed", color: CHART.cultch },
  { key: "saveBedding", label: "Cultch placed", color: CHART.cultch },
  { key: "coverage", label: "Survey soundings", color: CHART.coverage },
];

const TIER_LEGEND = [
  { label: `~6 MT CO2e per Acre`, color: CHART.tiers.low },
  { label: `~12 MT CO2e per Acre`, color: CHART.tiers.med },
  { label: `~19 MT CO2e per Acre`, color: CHART.tiers.high },
];

/* Polling substrate classes, worst bottom first — chapter five's key. */
const SUBSTRATE_LEGEND = [
  { label: "Mud", color: CHART.substrate.mud },
  { label: "Clay", color: CHART.substrate.firm },
  { label: "Scattered shell", color: CHART.substrate.scat },
  { label: "Solid reef", color: CHART.substrate.reef },
];

export function Hud({
  view,
  scene,
  snapshotDate,
  season,
  visible,
  targetId,
  stageState,
  carbonYears,
  showSaveTarget = false,
  onTarget,
}: {
  view: ChartView | null;
  scene: SceneId;
  snapshotDate?: string;
  season: StorySeason | null;
  visible: boolean;
  targetId: string | null;
  stageState: StageState;
  /** Vintages in carbon_columns.geojson, oldest first — the carbon
      scene's legend follows the data like the columns do. */
  carbonYears?: number[];
  /** The ?32024 chapter is up — list its lease in the flight deck. */
  showSaveTarget?: boolean;
  onTarget: (id: string) => void;
}) {
  /* The rail is useful but it sits over the chart; let the visitor fold
     it down to the header strip and keep the compass. */
  const [targetsOpen, setTargetsOpen] = useState(true);
  const layers = SCENES[scene].layers;
  const showTiers = !!layers.css;
  const showCarbon = !!layers.carbon && !!carbonYears?.length;
  const showSubstrate = !!layers.case || !!layers.save;
  const showErrant = !!layers.saveBedding;
  const showLegend =
    showTiers || showCarbon || showSubstrate || LEGENDS.some((legend) => layers[legend.key]);
  const canTarget = !!layers.counties;
  /* The field-save lease stays off the public flight deck; it flies
     only for readers who arrived with the chapter's URL flag. */
  const railTargets = MAP_TARGETS.filter(
    (candidate) => showSaveTarget || candidate.id !== "lease-32024",
  );
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

      {/* position + acquisition readout */}
      <div
        className="story-hud pointer-events-none absolute bottom-6 left-4 hidden min-w-[31rem] rounded-sm px-4 py-3 sm:block lg:left-8"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex gap-6">
            <span>
              LAT <span className="story-hud-value">{view ? toDM(view.lat, "lat") : "——"}</span>
            </span>
            <span>
              LON <span className="story-hud-value">{view ? toDM(view.lon, "lon") : "——"}</span>
            </span>
            <span>
              Z <span className="story-hud-value">{view ? view.zoom.toFixed(1) : "—"}</span>
            </span>
          </div>
          <div className="flex gap-4 border-l border-white/10 pl-4">
            <span>
              HDG <span className="story-hud-value">{heading(view?.bearing)}</span>
            </span>
            <span>
              PITCH <span className="story-hud-value">{view ? `${Math.round(view.pitch)}°` : "—"}</span>
            </span>
          </div>
        </div>
        <div className="story-status mt-2.5 flex items-center gap-3">
          <span className={`story-status-light ${stageState.status === "VERIFIED" ? "is-verified" : ""}`} />
          <span className="story-hud-value min-w-[5.8rem]">{stageState.status}</span>
          <span className="story-status-track flex-1">
            <span style={{ width: `${Math.round(stageState.progress * 100)}%` }} />
          </span>
          {stageState.vintage && <span>VINTAGE {stageState.vintage}</span>}
          {target && (
            <span>
              {target.state}
              {"geoid" in target
                ? ` · GEOID ${target.geoid}`
                : ` · ${"tag" in target ? target.tag : "REGION"}`}
            </span>
          )}
        </div>
        {/* The chart is baked, but the fleet is not — say so, or a dated
            snapshot reads as an archive instead of an operation. */}
        <div className="mt-1.5 text-[10px] opacity-70">
          CV CARBON SURVEY ·{" "}
          {season ? (
            <>
              {season.year} SEASON {season.inProgress ? "IN PROGRESS" : "COMPLETE"} ·{" "}
              <span className="story-hud-value">{fmtInt(season.polling)}</span> SOUNDINGS LOGGED
            </>
          ) : (
            "STATIC SNAPSHOT"
          )}
        </div>
        <div className="text-[10px] opacity-70">
          IMAGERY © ESRI/MAXAR · BOUNDARIES US CENSUS/TIGER 2025
          {snapshotDate ? ` · SNAPSHOT ${snapshotDate}` : ""}
        </div>
      </div>

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
                  <span>AREA TARGETS</span>
                </button>
                <div className="story-compass" aria-hidden="true">
                  <span>N</span>
                  <i style={{ transform: `rotate(${compassBearing}deg)` }} />
                </div>
              </div>
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
              {targetsOpen && (
                <p className="mt-2 border-t border-white/10 pt-2 text-[9px] leading-relaxed opacity-55">
                  SELECT TO FLY · CAMERA RETURNS TO BRIEF ON SCROLL
                </p>
              )}
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
