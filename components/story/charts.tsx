"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { EPA } from "./factors";
import { fmtCompact, fmtInt, latestSeason, type StoryManifest } from "./use-story-data";

/* ------------------------------------------------------------------
   Perspective graphics. All values flow from the snapshot manifest —
   a missing bake renders nothing, never a wrong number.

   Color rules (validated against both band surfaces):
   - The tier stack is ORDERED magnitude, so it wears a sequential
     verdigris ramp (light→dark), not the map's categorical tier hues —
     those fail contrast/separation checks on the pearl surface.
   - Single-series marks use one brand hue; identity lives in labels
     and legends, never color alone. Text wears ink/mist, not mark color.
   ------------------------------------------------------------------ */

/* Sequential ramp, low → high density (light → dark). */
const RAMP = { low: "#8fc2b2", med: "#3f9680", high: "#1d5f4e" } as const;
const BAR = "#23705d"; // verdigris-600 — single-series marks on pearl

/* Physical yardsticks for the perspective tiles. */
const EMPIRE_STATE_SHORT_TONS = 365_000; // commonly cited total weight
const HOUSTON_NYC_MILES = 1_630; // driving distance
const MANHATTAN_ACRES = 14_600;

/* ---- Reef acres by tier, per survey year (stacked bars) ---- */
export function SeasonStack({ manifest }: { manifest: StoryManifest | null }) {
  const rows = manifest?.stats?.css_by_year;
  if (!rows || rows.length === 0) return null;

  const W = 440;
  const H = 240;
  const plotTop = 34;
  const plotBottom = H - 26;
  const max = Math.max(...rows.map((r) => r.low_acres + r.med_acres + r.high_acres));
  const barW = 64;
  const step = W / rows.length;
  const scale = (v: number) => (v / max) * (plotBottom - plotTop);

  return (
    <figure>
      <figcaption className="eyebrow">Reef at density, acres surveyed</figcaption>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/60">
        {(
          [
            ["high", "≥ 244 / m²"],
            ["med", "119–244 / m²"],
            ["low", "20–119 / m²"],
          ] as const
        ).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="story-swatch" style={{ background: RAMP[k], borderColor: "rgba(10,29,43,0.2)" }} />
            {label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label={`Surveyed reef acres by density tier: ${rows
          .map((r) => `${r.year}: ${fmtInt(r.low_acres + r.med_acres + r.high_acres)} acres`)
          .join("; ")}`}
      >
        {rows.map((r, i) => {
          const total = r.low_acres + r.med_acres + r.high_acres;
          const x = i * step + (step - barW) / 2;
          /* headline tier sits on the baseline for stable comparison */
          const segs = [
            { key: "high", v: r.high_acres, color: RAMP.high },
            { key: "med", v: r.med_acres, color: RAMP.med },
            { key: "low", v: r.low_acres, color: RAMP.low },
          ];
          let y = plotBottom;
          return (
            <g key={r.year}>
              {segs.map((s, j) => {
                const h = scale(s.v);
                y -= h;
                const isTop = j === segs.length - 1;
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, h - 2) /* 2px surface gap between segments */}
                    rx={isTop ? 4 : 0}
                    fill={s.color}
                  >
                    <title>{`${r.year} · ${s.key} tier: ${fmtInt(s.v)} acres`}</title>
                  </rect>
                );
              })}
              <text
                x={x + barW / 2}
                y={y - 10}
                textAnchor="middle"
                className="fill-ink font-display"
                fontSize="17"
              >
                {fmtCompact(total)}
              </text>
              <text
                x={x + barW / 2}
                y={plotBottom + 18}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="0.1em"
                className="fill-ink/55"
                style={{ fontFamily: "var(--font-chart)" }}
              >
                {r.year}
              </text>
            </g>
          );
        })}
        <line x1="0" y1={plotBottom} x2={W} y2={plotBottom} stroke="#0a1d2b" strokeOpacity="0.18" />
      </svg>
      <ChartTable
        caption="Surveyed reef acres by density tier and year"
        head={["Year", "≥244/m²", "119–244/m²", "20–119/m²"]}
        rows={rows.map((r) => [r.year, r.high_acres, r.med_acres, r.low_acres])}
      />
    </figure>
  );
}

/* ---- Credits issued per vintage (single-series bars) ---- */
export function VintageBars({ manifest }: { manifest: StoryManifest | null }) {
  const rows = manifest?.stats?.credits?.by_vintage;
  if (!rows || rows.length === 0) return null;

  const W = 440;
  const H = 240;
  const plotTop = 34;
  const plotBottom = H - 26;
  const max = Math.max(...rows.map((r) => r.count));
  const barW = 64;
  const step = W / rows.length;

  return (
    <figure>
      <figcaption className="eyebrow">Credits issued, per vintage</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-9 h-auto w-full"
        role="img"
        aria-label={`Carbon credits by vintage year: ${rows
          .map((r) => `${r.year}: ${fmtInt(r.count)}`)
          .join("; ")}`}
      >
        {rows.map((r, i) => {
          const h = (r.count / max) * (plotBottom - plotTop);
          const x = i * step + (step - barW) / 2;
          return (
            <g key={r.year}>
              <rect x={x} y={plotBottom - h} width={barW} height={h} rx={4} fill={BAR}>
                <title>{`Vintage ${r.year}: ${fmtInt(r.count)} credits`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={plotBottom - h - 10}
                textAnchor="middle"
                className="fill-ink font-display"
                fontSize="17"
              >
                {fmtCompact(r.count)}
              </text>
              <text
                x={x + barW / 2}
                y={plotBottom + 18}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="0.1em"
                className="fill-ink/55"
                style={{ fontFamily: "var(--font-chart)" }}
              >
                {r.year}
              </text>
            </g>
          );
        })}
        <line x1="0" y1={plotBottom} x2={W} y2={plotBottom} stroke="#0a1d2b" strokeOpacity="0.18" />
      </svg>
      <ChartTable
        caption="Serialized carbon credits by vintage year"
        head={["Vintage", "Credits"]}
        rows={rows.map((r) => [r.year, r.count])}
      />
    </figure>
  );
}

/* ---- Gross → net waterfall (dark ledger band) ---- */
export function NetWaterfall({ manifest }: { manifest: StoryManifest | null }) {
  const gross = manifest?.stats?.gross_mt_total;
  const net = manifest?.stats?.net_mt_total;
  if (gross == null || net == null || gross <= 0 || net <= 0 || net > gross) return null;
  const deduction = gross - net;

  const W = 640;
  const H = 250;
  const plotTop = 40;
  const plotBottom = H - 28;
  const span = plotBottom - plotTop;
  const barW = 120;
  const step = W / 3;
  const y = (v: number) => plotBottom - (v / gross) * span;

  const cols = [
    { x: 0 * step + (step - barW) / 2, label: "Measured uptake", value: gross },
    { x: 1 * step + (step - barW) / 2, label: "− our operations", value: deduction },
    { x: 2 * step + (step - barW) / 2, label: "Net, credited", value: net },
  ];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-2xl"
        role="img"
        aria-label={`Carbon accounting: ${fmtInt(gross)} metric tons measured, minus ${fmtInt(deduction)} for our own operational emissions, equals ${fmtInt(net)} net metric tons credited.`}
      >
        <defs>
          {/* hatch marks the subtracted portion as removed, not stored */}
          <pattern id="story-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#d6c5aa" strokeWidth="1.6" />
          </pattern>
        </defs>

        {/* gross */}
        <rect x={cols[0].x} y={y(gross)} width={barW} height={span} rx={4} fill="#6b9cb8">
          <title>{`Measured uptake: ${fmtInt(gross)} MT CO₂e`}</title>
        </rect>

        {/* deduction floats where it leaves the gross column */}
        <rect
          x={cols[1].x}
          y={y(gross)}
          width={barW}
          height={y(net) - y(gross)}
          rx={4}
          fill="url(#story-hatch)"
          stroke="#d6c5aa"
          strokeWidth="1.4"
        >
          <title>{`Our operational emissions, subtracted: ${fmtInt(deduction)} MT CO₂e`}</title>
        </rect>

        {/* net */}
        <rect x={cols[2].x} y={y(net)} width={barW} height={plotBottom - y(net)} rx={4} fill="#2f8a74">
          <title>{`Net carbon credited: ${fmtInt(net)} MT CO₂e`}</title>
        </rect>

        {/* connectors */}
        <line x1={cols[0].x + barW} y1={y(gross)} x2={cols[1].x} y2={y(gross)} stroke="#c5d8e3" strokeOpacity="0.4" strokeDasharray="4 4" />
        <line x1={cols[1].x + barW} y1={y(net)} x2={cols[2].x} y2={y(net)} stroke="#c5d8e3" strokeOpacity="0.4" strokeDasharray="4 4" />

        {cols.map((c, i) => (
          <g key={c.label}>
            <text
              x={c.x + barW / 2}
              y={(i === 1 ? y(gross) : y(c.value)) - 12}
              textAnchor="middle"
              className="fill-pearl font-display"
              fontSize="19"
            >
              {fmtCompact(c.value)}
            </text>
            <text
              x={c.x + barW / 2}
              y={plotBottom + 19}
              textAnchor="middle"
              fontSize="11"
              letterSpacing="0.1em"
              fill="#c5d8e3"
              fillOpacity="0.75"
              style={{ fontFamily: "var(--font-chart)" }}
            >
              {c.label}
            </text>
          </g>
        ))}
        <line x1="0" y1={plotBottom} x2={W} y2={plotBottom} stroke="#c5d8e3" strokeOpacity="0.25" />
      </svg>
      <ChartTable
        caption="Gross to net carbon accounting in metric tons CO₂e"
        head={["Measured uptake", "Our operations (subtracted)", "Net credited"]}
        rows={[[gross, deduction, net]]}
      />
    </figure>
  );
}

/* ---- EPA equivalents strip (dark band) ---- */
export function EquivalentsStrip({ manifest }: { manifest: StoryManifest | null }) {
  const net = manifest?.stats?.net_mt_total;
  if (net == null || net <= 0) return null;

  const items = [
    { value: net * EPA.passenger_cars_year, label: "cars off the road for a year" },
    { value: net * EPA.homes_electricity_year, label: "US homes powered for a year" },
    { value: net * EPA.tree_seedlings_10yr, label: "tree seedlings grown 10 years" },
    { value: net * EPA.gasoline_gallons, label: "gallons of gasoline avoided" },
  ];

  return (
    <div>
      <p className="story-chart-note">{fmtInt(net)} MT CO₂e is roughly —</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 80}>
            <div className="border-l border-steel/40 pl-4">
              <span className="font-display text-2xl text-white lg:text-3xl">
                {fmtCompact(Math.round(it.value))}
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-mist/70">{it.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p
        className="mt-4 text-[10px] uppercase tracking-[0.14em] text-mist/40"
        title="Conversion factors from the EPA Greenhouse Gas Equivalencies Calculator (eGRID2022)."
      >
        EPA equivalency factors
      </p>
    </div>
  );
}

/* ---- Physical-yardstick tiles ---- */
export function PerspectiveTiles({ manifest }: { manifest: StoryManifest | null }) {
  const tons = manifest?.stats?.bedding_short_tons;
  const miles = manifest?.stats?.bedding_track_miles;
  if (tons == null && miles == null) return null;

  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-2">
      {tons != null && (
        <PerspectiveTile
          figure={`${Math.round((tons / EMPIRE_STATE_SHORT_TONS) * 100)}%`}
          text="of the weight of the Empire State Building, placed on the seafloor as new reef foundation"
        />
      )}
      {miles != null && miles > HOUSTON_NYC_MILES && (
        <PerspectiveTile
          figure={`${fmtInt(miles)} mi`}
          text="of GPS-logged placement track — farther than driving Houston to New York City"
        />
      )}
    </div>
  );
}

export function ManhattanTile({ manifest }: { manifest: StoryManifest | null }) {
  const acres = manifest?.stats?.css_acres?.total;
  if (acres == null || acres <= 0) return null;
  const ratio = acres / MANHATTAN_ACRES;
  return (
    <PerspectiveTile
      figure={`${ratio >= 2 ? ratio.toFixed(1) : ratio.toFixed(2)}×`}
      text="the land area of Manhattan, now surveyed reef at commercial oyster density"
    />
  );
}

/* ---- Supply runway: reef restored against water already under lease ---- */
export function RunwayBar({ manifest }: { manifest: StoryManifest | null }) {
  const s = manifest?.stats;
  const rows = [
    {
      key: "acres",
      value: s?.css_acres?.total,
      total: s?.signed_acres,
      valueLabel: "acres of surveyed reef at density",
      totalLabel: "acres under signed lease agreement",
    },
    {
      key: "leases",
      value: s?.leases_in_program,
      total: s?.leases_total,
      valueLabel: "leases enrolled in the program",
      totalLabel: "leases on the coasts we work",
    },
  ].filter(
    (r): r is typeof r & { value: number; total: number } =>
      r.value != null && r.total != null && r.total > 0 && r.value <= r.total,
  );
  if (rows.length === 0) return null;

  const W = 640;
  const ROW_H = 96;
  const BAR_H = 18;
  const H = rows.length * ROW_H;

  return (
    <figure>
      <figcaption className="eyebrow">The runway</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-6 h-auto w-full"
        role="img"
        aria-label={rows
          .map(
            (r) =>
              `${fmtInt(r.value)} of ${fmtInt(r.total)} ${r.valueLabel} (${Math.round((r.value / r.total) * 100)} percent)`,
          )
          .join("; ")}
      >
        {rows.map((r, i) => {
          const top = i * ROW_H;
          const pct = r.value / r.total;
          const fillW = Math.max(3, W * pct);
          /* A 9% fill leaves no room for a label inside it, so the
             percentage rides just past the fill until the bar is nearly
             full and it has to move back inside. */
          const inside = fillW > W - 70;
          return (
            <g key={r.key}>
              <text x="0" y={top + 20} className="fill-ink font-display" fontSize="23">
                {fmtInt(r.value)}
              </text>
              <text x="0" y={top + 40} fontSize="11.5" className="fill-ink/55">
                {r.valueLabel}
              </text>
              <text
                x={W}
                y={top + 20}
                textAnchor="end"
                className="fill-ink/45 font-display"
                fontSize="23"
              >
                {fmtInt(r.total)}
              </text>
              <text x={W} y={top + 40} textAnchor="end" fontSize="11.5" className="fill-ink/45">
                {r.totalLabel}
              </text>
              <rect x="0" y={top + 58} width={W} height={BAR_H} rx={4} className="fill-navy/10" />
              <rect x="0" y={top + 58} width={fillW} height={BAR_H} rx={4} fill={BAR}>
                <title>{`${fmtInt(r.value)} of ${fmtInt(r.total)}`}</title>
              </rect>
              <text
                x={inside ? fillW - 10 : fillW + 10}
                y={top + 58 + BAR_H / 2 + 4}
                textAnchor={inside ? "end" : "start"}
                fontSize="12"
                fontWeight="600"
                fill={inside ? "#f8f6f2" : BAR}
                style={{ fontFamily: "var(--font-chart)" }}
              >
                {`${(pct * 100).toFixed(pct < 0.1 ? 1 : 0)}%`}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartTable
        caption="Restored reef and enrolled leases against the water already under signed agreement"
        head={["Measure", "Today", "Under agreement"]}
        rows={rows.map((r) => [r.valueLabel, r.value, r.total])}
      />
    </figure>
  );
}

/* ---- The season the snapshot caught mid-flight ---- */
export function SeasonTile({ manifest }: { manifest: StoryManifest | null }) {
  const season = latestSeason(manifest);
  if (!season || season.polling <= 0) return null;
  return (
    <PerspectiveTile
      figure={fmtInt(season.polling)}
      text={
        season.inProgress ? (
          <>
            soundings already logged in the {season.year} season — the chart above is a survey
            still running, not a finished report
          </>
        ) : (
          <>
            soundings logged in the {season.year} season, the most recent completed pass over
            this water
          </>
        )
      }
    />
  );
}

function PerspectiveTile({ figure, text }: { figure: string; text: ReactNode }) {
  return (
    <Reveal>
      <div className="h-full rounded-lg border border-navy/10 bg-white p-6">
        <span className="font-display text-3xl text-verdigris-600">{figure}</span>
        <p className="prose-cv mt-2 text-[0.9375rem]">{text}</p>
      </div>
    </Reveal>
  );
}

/* Screen-reader table twin for each chart. */
function ChartTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{typeof c === "number" ? fmtInt(c) : c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
