"use client";

import { CHART, SCENES, type SceneId } from "./scenes";
import type { ChartView } from "./map-stage";

/* ------------------------------------------------------------------
   Instrument panel. Bottom-left: position readout, like a plotter.
   Top-right: legend chips for whichever layers the scene has lit.
   Both fade out whenever an editorial band covers the chart.
   ------------------------------------------------------------------ */

function toDM(value: number, axis: "lat" | "lon"): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg}°${min.toFixed(2).padStart(5, "0")}′ ${hemi}`;
}

const LEGENDS: { key: keyof (typeof SCENES)["hero"]["layers"]; label: string; color: string }[] = [
  { key: "bedding", label: "Cultch placed", color: CHART.cultch },
  { key: "coverage", label: "Survey soundings", color: CHART.coverage },
];

const TIER_LEGEND = [
  { label: `${CHART.densityBins[0]}–${CHART.densityBins[1]} oysters/m²`, color: CHART.tiers.low },
  { label: `${CHART.densityBins[1]}–${CHART.densityBins[2]} oysters/m²`, color: CHART.tiers.med },
  { label: `≥ ${CHART.densityBins[2]} oysters/m²`, color: CHART.tiers.high },
];

export function Hud({
  view,
  scene,
  snapshotDate,
  visible,
}: {
  view: ChartView | null;
  scene: SceneId;
  snapshotDate?: string;
  visible: boolean;
}) {
  const layers = SCENES[scene].layers;
  const showTiers = !!layers.density || !!layers.css;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* position readout */}
      <div className="story-hud absolute bottom-6 left-4 hidden rounded-sm px-4 py-3 sm:block lg:left-8">
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
        <div className="mt-1.5 text-[10px] opacity-70">
          CV CARBON SURVEY · STATIC SNAPSHOT{snapshotDate ? ` · ${snapshotDate}` : ""} · IMAGERY ©
          ESRI/MAXAR
        </div>
      </div>

      {/* legend — desktop only; on phones the cards carry the meaning
          and the chips would collide with the narrative column */}
      {(showTiers || LEGENDS.some((l) => layers[l.key])) && (
        <div className="story-hud absolute right-4 top-20 hidden rounded-sm px-4 py-3 sm:block lg:right-8">
          <div className="space-y-2">
            {LEGENDS.filter((l) => layers[l.key]).map((l) => (
              <div key={l.label} className="flex items-center gap-2.5">
                <span className="story-swatch" style={{ background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
            {showTiers &&
              TIER_LEGEND.map((t) => (
                <div key={t.label} className="flex items-center gap-2.5">
                  <span className="story-swatch" style={{ background: t.color }} />
                  <span>{t.label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
