"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EMAIL } from "@/lib/site";
import "./story.css";
import { CreditsBand, LostBand, ProofBand, TrajectoryBand, WorkBand } from "./bands";
import { Hud } from "./hud";
import { MapStage, type ChartView } from "./map-stage";
import type { SceneId } from "./scenes";
import { fmtCompact, fmtInt, useStoryData } from "./use-story-data";

/* ------------------------------------------------------------------
   The brief itself. One fixed chart behind everything; the narrative
   scrolls over it. Transparent sections expose the chart and carry a
   data-scene attribute — when one crosses the center of the viewport
   its scene is applied to the map. Opaque editorial bands carry the
   NEXT act's scene, so the camera repositions while covered.
   ------------------------------------------------------------------ */

export default function Experience() {
  const data = useStoryData();
  const [scene, setScene] = useState<SceneId>("hero");
  const [hudVisible, setHudVisible] = useState(true);
  const [view, setView] = useState<ChartView | null>(null);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewThrottle = useRef(0);

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
            if (next) setScene(next);
            setHudVisible(el.dataset.covered !== "true");
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* The map fires per animation frame during a 2.4 s ease; the HUD only
     needs ~8 updates a second, and each setView re-renders this tree. */
  const onView = useCallback((v: ChartView) => {
    const now = performance.now();
    if (now - viewThrottle.current < 120) return;
    viewThrottle.current = now;
    setView(v);
  }, []);

  const snapshotDate = data.manifest?.snapshot_date;
  const s = data.manifest?.stats;

  return (
    <div ref={rootRef} className="story-root relative">
      <MapStage data={data} activeScene={scene} reducedMotion={reducedMotion} onView={onView} />
      <Hud view={view} scene={scene} snapshotDate={snapshotDate} visible={hudVisible} />

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
              The reef is going back in the water.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist/85 sm:text-lg">
              Plotted below, from our own survey database: the shell we placed, the acres we
              measured, and the carbon the reef is holding — on the water where it happened.
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
              An estimated 85 percent of the world&rsquo;s oyster reef is gone — the most
              degraded marine habitat on Earth. On this coast the reefs didn&rsquo;t collapse;
              they were <strong>mined</strong>, dredged up for shell until flat mud was all
              that was left for the next generation of oysters to land on.
            </p>
          </ChapterCard>
        </ChartStep>

        <div data-scene="bedding" data-covered="true">
          <LostBand />
        </div>

        {/* ---- Chapter two — the work ---- */}
        <ChartStep scene="bedding" tall>
          <ChapterCard eyebrow="Chapter two — the work" title="Shell goes back in the water">
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
              The glow is our survey record: continuous bottom soundings plus dredge tows and
              point samples, all geolocated, all repeatable. This is not an artist&rsquo;s
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
          <ChapterCard eyebrow="Chapter three — the proof" title="Counted, not modeled">
            <p>
              Each column is measured oyster density — animals counted by hand on the culling
              board, binned at the survey convention of 20, 119, and 244 oysters per square
              meter. Where the columns turn shell-gold, the reef is at commercial density.
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

        <div data-scene="close" data-covered="true">
          <TrajectoryBand manifest={data.manifest} />
          <CreditsBand manifest={data.manifest} />
        </div>

        {/* ---- Close ---- */}
        <section
          data-scene="close"
          className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <p className="eyebrow text-steel-400">The invitation</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
            Come see it from the boat.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist/85">
            The chart behind this page is live water we work every week. If what your
            organization needs is carbon with a paper trail — or a coast with its reefs back —
            let&rsquo;s talk.
          </p>
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
  stats: { value: number | undefined | null; label: string; compact?: boolean }[];
}) {
  return (
    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-t border-white/10 pt-6">
      {stats.map((stat) => (
        <div key={stat.label}>
          <CountUp value={stat.value} compact={stat.compact} />
          <p className="story-chart-note mt-1.5 normal-case tracking-normal">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Fraunces numeral that counts up the first time it becomes visible.
    Renders an em dash until the snapshot supplies a value. */
function CountUp({ value, compact = false }: { value: number | undefined | null; compact?: boolean }) {
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
  return (
    <span ref={ref} className="font-display text-3xl text-white">
      {value == null ? "—" : compact ? fmtCompact(shown) : fmtInt(shown)}
    </span>
  );
}
