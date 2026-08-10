"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EMAIL } from "@/lib/site";
import "./story.css";
import {
  CaseStudyBand,
  CoBenefitsBand,
  CreditsBand,
  LostBand,
  PermanenceBand,
  ProofBand,
  TrajectoryBand,
  WorkBand,
} from "./bands";
import { GalleryBand } from "./gallery";
import { Hud } from "./hud";
import { MapStage, type ChartView, type StageState } from "./map-stage";
import { SCENES, type SceneId } from "./scenes";
import { SequenceBand } from "./sequence";
import { SizerBand } from "./sizer";
import { fmtCompact, fmtInt, latestSeason, useStoryData } from "./use-story-data";

/* ------------------------------------------------------------------
   The brief itself. One fixed chart behind everything; the narrative
   scrolls over it. Transparent sections expose the chart and carry a
   data-scene attribute — when one crosses the center of the viewport
   its scene is applied to the map. Opaque editorial bands carry the
   NEXT act's scene, so the camera repositions while covered.
   ------------------------------------------------------------------ */

export default function Experience({ showVenturePois = false }: { showVenturePois?: boolean }) {
  const data = useStoryData();
  const [scene, setScene] = useState<SceneId>("hero");
  const [hudVisible, setHudVisible] = useState(true);
  const [view, setView] = useState<ChartView | null>(null);
  const [manualTarget, setManualTarget] = useState<string | null>(null);
  const [stageState, setStageState] = useState<StageState>({
    status: "STANDBY",
    progress: 0,
  });
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewThrottle = useRef(0);
  const hasCaseStudy = data.caseManifest != null;

  /* Scene trigger: the section straddling the viewport's center wins.
     Opaque bands (data-covered) also fade the HUD out while they hold
     the viewport — the HUD stacks above them, so it must yield. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = root.querySelectorAll<HTMLElement>("[data-scene]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const next = el.dataset.scene as SceneId;
            if (next) {
              setScene(next);
              setManualTarget(null);
            }
            setHudVisible(el.dataset.covered !== "true");
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // Chapter five's sections mount once the case-study pack loads, so
    // the observer must be rebuilt when they appear.
  }, [hasCaseStudy]);

  /* The map fires per animation frame during a 2.4 s ease; the HUD only
     needs ~8 updates a second, and each setView re-renders this tree. */
  const onView = useCallback((v: ChartView) => {
    const now = performance.now();
    if (now - viewThrottle.current < 120) return;
    viewThrottle.current = now;
    setView(v);
  }, []);

  const onStageState = useCallback((next: StageState) => {
    setStageState(next);
  }, []);

  const activeTarget = manualTarget ?? SCENES[scene].targetId ?? null;

  const snapshotDate = data.manifest?.snapshot_date;
  const season = latestSeason(data.manifest);
  const s = data.manifest?.stats;
  const cs = data.caseManifest;
  /* Reef acreage created on the lease: the sounding share that flipped
     to solid reef, applied to the lease's acres and floored — claim
     down, never up. (106 ac × 73.2% → 77.) */
  const newReefAcres =
    cs?.acres != null && cs.after.pct_reef != null && cs.before.pct_reef != null
      ? Math.floor((cs.acres * (cs.after.pct_reef - cs.before.pct_reef)) / 100)
      : null;

  return (
    <div ref={rootRef} className="story-root relative">
      <MapStage
        data={data}
        activeScene={scene}
        targetId={activeTarget}
        showVenturePois={showVenturePois}
        reducedMotion={reducedMotion}
        onView={onView}
        onStageState={onStageState}
      />
      <Hud
        view={view}
        scene={scene}
        snapshotDate={snapshotDate}
        season={season}
        visible={hudVisible}
        targetId={activeTarget}
        stageState={stageState}
        onTarget={setManualTarget}
      />

      {/* Way home — the site chrome is hidden on this route. */}
      <Link
        href="/"
        className="story-chart-note fixed left-4 top-5 z-30 rounded-sm px-2 py-1 transition-colors hover:text-white lg:left-8"
      >
        ← cvcarbon.eco
      </Link>

      <div className="relative z-10">
        {/* ---- Hero ---- */}
        <section
          data-scene="hero"
          className="relative flex min-h-screen items-center justify-center px-6"
        >
          <div className="story-titleblock relative max-w-2xl rounded-sm px-8 py-10 text-center sm:px-14 sm:py-14">
            <p className="story-chart-note">
              CV Carbon · Field operations brief · Shared by invitation
            </p>
            <h1 className="mt-7 font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              We are bringing the reef back!
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist/85 sm:text-lg">
              Plotted below, from our own survey database: the cultch (shells, recycled
              concrete, crushed limestone) we placed, the acres we measured, and the carbon the
              reef is holding — on the water where it happened.
            </p>
            <p className="story-chart-note mt-9">
              Chart № {snapshotDate ?? "PRE-RELEASE"} · Soundings in oysters per square meter
            </p>
          </div>
          <div className="story-scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2">
            <svg viewBox="0 0 16 24" className="h-6 w-4 text-mist/70" aria-hidden="true">
              <path
                d="M8 2v16M3 13l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        {/* ---- Chapter one — what was lost ---- */}
        <ChartStep scene="lost">
          <ChapterCard
            eyebrow="Chapter one — what was lost"
            title="An engine of the coast, dismantled"
          >
            <p>
              An estimated 85 percent of the Atlantic and Gulf Coasts&rsquo; oyster reef is
              gone — the most degraded marine habitat on Earth. A major cause of the collapse
              of our oyster reefs was <strong>shell mining</strong>. For more than 100 years,
              shells were mined from our bays, leaving a muddy landscape incapable of
              regenerating the lost reef on its own.
            </p>
            <p className="story-chart-note !mt-4 normal-case tracking-normal">
              zu Ermgassen et al. 2012, Proceedings of the Royal Society B 279: 3393–3400
            </p>
          </ChapterCard>
        </ChartStep>

        <div data-scene="bedding" data-covered="true">
          <LostBand />
        </div>

        {/* ---- Chapter two — the work ---- */}
        <ChartStep scene="bedding" tall>
          <ChapterCard eyebrow="Chapter two — the work" title="Shell and other cultch materials go back in the water">
            <p>
              Every gold trace on this chart is a cultch placement, GPS-logged from the barge
              that made it — the hard bottom this coast lost, going back in at working scale.
            </p>
            <CardStats
              stats={[
                { value: s?.bedding_short_tons, label: "short tons placed" },
                { value: s?.bedding_placements, label: "logged placements" },
              ]}
            />
          </ChapterCard>
        </ChartStep>

        <div data-scene="coverage" data-covered="true">
          <WorkBand manifest={data.manifest} />
        </div>

        {/* ---- Chapter three — the proof ---- */}
        <ChartStep scene="coverage" tall>
          <ChapterCard eyebrow="Chapter three — the proof" title="We sound every acre we claim">
            <p>
              Our strength is our data: continuous bottom soundings plus dredge tows and
              point samples, all geolocated, all repeatable. We have compiled the world&rsquo;s largest dataset of ground-truthed substrate data. This is not an artist&rsquo;s
              rendering of a reef — it is the reef&rsquo;s paper trail.
            </p>
            <CardStats
              stats={[
                { value: s?.polling_points, label: "bottom soundings", compact: true },
                { value: s?.dredge_samples, label: "dredge tows" },
                { value: s?.point_samples, label: "point samples" },
              ]}
            />
          </ChapterCard>
        </ChartStep>

        <ChartStep scene="density" tall>
          <ChapterCard eyebrow="Chapter three — the proof" title="Hand counted and independently verified, not modeled">
            <p>
              Each column is measured carbon capture and sequestration — oysters are counted by hand on the board, binned at the survey convention of 20, 119, and 244 oysters per square
              meter. Where the columns turn shell-gold, the reef is at maximum carbon capture. Results are independently verified by a disinterested third party agency.
            </p>
          </ChapterCard>
        </ChartStep>

        <div data-scene="return" data-covered="true">
          <ProofBand />
        </div>

        {/* ---- Chapter four — the return ---- */}
        <ChartStep scene="return" tall>
          <ChapterCard
            eyebrow="Chapter four — the return"
            title="Acres back at commercial density"
          >
            <p>
              The shaded areas are surveyed reef at or above 20 oysters per square meter —
              habitat doing everything a reef does: feeding a fishery, buffering a shoreline,
              and holding carbon in shell and sediment.
            </p>
            <CardStats
              stats={[
                { value: s?.css_acres?.total, label: "acres at density" },
                { value: s?.css_acres?.high, label: "acres at ≥244/m²" },
              ]}
            />
          </ChapterCard>
        </ChartStep>

        {/* ---- Chapter five — the case study (lights up with its data pack) ---- */}
        {cs && (
          <>
            <div data-scene="case-before" data-covered="true">
              <CaseStudyBand manifest={cs} />
            </div>

            <ChartStep scene="case-before" tall>
              <ChapterCard
                eyebrow="Chapter five — the case study"
                title={`${cs.location}, before the shell`}
              >
                <p>
                  Lease {cs.lease_number}: {fmtInt(cs.acres)} acres in {cs.county} Parish.
                  Months of soundings before the work found what a mined coast leaves behind —
                  bare clay bottom and mud, with almost nothing for a larva to land on.
                </p>
                <CardStats
                  stats={[
                    { value: cs.before.points, label: "soundings on the lease" },
                    {
                      value: cs.before.pct_unproductive,
                      label: "mud or bare clay bottom",
                      decimals: 1,
                      suffix: "%",
                    },
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="case-work" tall>
              <ChapterCard eyebrow="Chapter five — the work" title="One month of shell">
                <p>
                  {cs.bedding.materials.join(" and ")} went over the side in {fmtInt(cs.bedding.placements)}{" "}
                  logged placements — replayed here in the order the barge made them.
                </p>
                <CardStats
                  stats={[
                    { value: cs.bedding.placements, label: "placements, May–Jun 2025" },
                    // Tonnage joins once the confirmed figure lands in the bake —
                    // no tile beats a dash on a sales page.
                    ...(cs.bedding.short_tons != null
                      ? [{ value: cs.bedding.short_tons, label: "short tons placed" }]
                      : []),
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="case-after" tall>
              <ChapterCard eyebrow="Chapter five — the return" title="Resurveyed: solid reef">
                <p>
                  Six months on, the survey boat crossed the same bottom at more than twice the
                  sounding density. Where the chart turns shell-gold, the substrate now rings
                  hard — {newReefAcres != null ? `${fmtInt(newReefAcres)} acres of ` : ""}new
                  reef, created in a single season, where before there was none.
                </p>
                <CardStats
                  stats={[
                    ...(newReefAcres != null
                      ? [{ value: newReefAcres, label: "acres of new reef created" }]
                      : []),
                    { value: cs.after.points, label: "soundings, Dec 2025" },
                    {
                      value: cs.after.pct_reef,
                      label: "of the lease reads solid reef",
                      decimals: 1,
                      suffix: "%",
                    },
                  ]}
                />
              </ChapterCard>
            </ChartStep>
          </>
        )}

        <div data-scene="close" data-covered="true">
          {/* Same water, different day — mounts only once its photos exist. */}
          {data.sequence && <SequenceBand sequence={data.sequence} />}
          <TrajectoryBand manifest={data.manifest} />
          <CreditsBand manifest={data.manifest} />
          <PermanenceBand />
          <CoBenefitsBand manifest={data.manifest} />
          {data.gallery && <GalleryBand gallery={data.gallery} />}
          {/* Last thing before the ask: the visitor's own number. */}
          <SizerBand
            manifest={data.manifest}
            caseManifest={data.caseManifest}
            caseBoundary={data.layers.caseBoundary}
          />
        </div>

        {/* ---- Close ---- */}
        <section
          data-scene="close"
          className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <p className="eyebrow text-steel-400">The ask</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
            Buy the ton that builds the reef.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist/85">
            Credits are available now, by the ton or by the batch, retired in your name with a
            certificate that points back to the water on this chart. And the chart is live
            water we work every week — so before you sign anything, come see it from the boat.
            What you take home is made to be passed along: a certificate, a serial, and this
            chart — evidence you can put in front of the people you answer to.
          </p>
          {showVenturePois && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-mist/85">
              Two of the marked sites — Calcasieu Pass and Port Sulphur — share this working
              coast with the reefs on this chart.
            </p>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={EMAIL.href}
              className="inline-flex items-center gap-2.5 rounded-full bg-verdigris px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-verdigris-600"
            >
              Message Us
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Contact
            </Link>
            <a
              href="https://portal.cvcarbon.eco/registry"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Registry
            </a>
          </div>
          <p className="story-chart-note absolute bottom-6">
            Unlisted brief · not indexed · © {new Date().getFullYear()} CV Carbon
          </p>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* pieces                                                              */
/* ------------------------------------------------------------------ */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** A transparent scroll section that exposes the chart. `tall` buys
    the scene more dwell time. */
function ChartStep({
  scene,
  tall = false,
  children,
}: {
  scene: SceneId;
  tall?: boolean;
  children: React.ReactNode;
}) {
  /* Below lg the camera reserves the bottom of the frame for the card
     (scenePadding), so anchor it there; on wide screens it rides the
     left rail, vertically centered. */
  return (
    <section
      data-scene={scene}
      className={`relative flex ${tall ? "min-h-[150vh]" : "min-h-[120vh]"} items-end pb-16 lg:items-center lg:pb-0 px-4 sm:px-6 lg:px-10`}
    >
      {children}
    </section>
  );
}

function ChapterCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="story-card w-full max-w-md rounded-lg p-7 sm:p-9">
      <p className="story-chart-note">{eyebrow}</p>
      <h2 className="mt-4 font-display text-2xl leading-tight text-white sm:text-3xl">{title}</h2>
      <div className="prose-cv mt-5 text-[0.9375rem] !text-mist/85 [&_strong]:!text-white">
        {children}
      </div>
    </div>
  );
}

function CardStats({
  stats,
}: {
  stats: {
    value: number | undefined | null;
    label: string;
    compact?: boolean;
    decimals?: number;
    suffix?: string;
  }[];
}) {
  return (
    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-t border-white/10 pt-6">
      {stats.map((stat) => (
        <div key={stat.label}>
          <CountUp
            value={stat.value}
            compact={stat.compact}
            decimals={stat.decimals}
            suffix={stat.suffix}
          />
          <p className="story-chart-note mt-1.5 normal-case tracking-normal">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Fraunces numeral that counts up the first time it becomes visible.
    Renders an em dash until the snapshot supplies a value. */
function CountUp({
  value,
  compact = false,
  decimals,
  suffix,
}: {
  value: number | undefined | null;
  compact?: boolean;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || value == null) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
          setProgress(1);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1500);
          setProgress(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const shown = value == null ? null : value * progress;
  const text =
    shown == null
      ? "—"
      : decimals != null
        ? shown.toFixed(decimals)
        : compact
          ? fmtCompact(shown)
          : fmtInt(shown);
  return (
    <span ref={ref} className="font-display text-3xl text-white">
      {text}
      {value != null && suffix ? suffix : null}
    </span>
  );
}
