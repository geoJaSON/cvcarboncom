"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EMAIL } from "@/lib/site";
import "./story.css";
import {
  CaseStudyBand,
  CoBenefitsBand,
  CreditsBand,
  FieldSaveBand,
  LostBand,
  MaterialBand,
  PermanenceBand,
  ProofBand,
  TrajectoryBand,
  WorkBand,
} from "./bands";
import { GalleryBand } from "./gallery";
import { Hud } from "./hud";
import { MapStage, type ChartView } from "./map-stage";
import { PlacementInset, dredgeInsetPhotos, placementInsetPhotos } from "./placement-inset";
import { SCENES, type SceneId } from "./scenes";
import { SequenceBand } from "./sequence";
import { SizerBand } from "./sizer";
import {
  caseLeaseLabel,
  fmtCompact,
  fmtInt,
  fmtList,
  newReefAcres,
  useStoryData,
} from "./use-story-data";
import { VentureBriefBand } from "./venture";

/* ------------------------------------------------------------------
   The brief itself. One fixed chart behind everything; the narrative
   scrolls over it. Transparent sections expose the chart and carry a
   data-scene attribute — when one crosses the center of the viewport
   its scene is applied to the map. Opaque editorial bands carry the
   NEXT act's scene, so the camera repositions while covered.
   ------------------------------------------------------------------ */

export default function Experience({
  showVenturePois = false,
  showFieldSave = false,
}: {
  showVenturePois?: boolean;
  showFieldSave?: boolean;
}) {
  /* Lease boundaries are only ever drawn by the venture inset, and the
     field-save pack only by its bonus chapter — each is fetched only
     when its URL flag switched it on. */
  const data = useStoryData({ leases: showVenturePois, save: showFieldSave });
  const [scene, setScene] = useState<SceneId>("hero");
  const [hudVisible, setHudVisible] = useState(true);
  const [view, setView] = useState<ChartView | null>(null);
  const [manualTarget, setManualTarget] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewThrottle = useRef(0);
  const hasCaseStudy = data.caseManifest != null;
  const hasFieldSave = data.saveManifest != null;

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
    // Chapter five's and the field save's sections mount once their data
    // packs load, so the observer must be rebuilt when they appear.
  }, [hasCaseStudy, hasFieldSave]);

  /* The map fires per animation frame during a 2.4 s ease; the HUD only
     needs ~8 updates a second, and each setView re-renders this tree. */
  const onView = useCallback((v: ChartView) => {
    const now = performance.now();
    if (now - viewThrottle.current < 120) return;
    viewThrottle.current = now;
    setView(v);
  }, []);

  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const onPhoto = useCallback((next: number | null) => {
    setPhotoIndex(next);
  }, []);

  const activeTarget = manualTarget ?? SCENES[scene].targetId ?? null;

  /* The carbon legend lists the vintages actually baked into the
     columns, oldest first — a new season needs no code change. */
  const carbonYears = useMemo(() => {
    const years = new Set<number>();
    for (const f of data.layers.carbon?.features ?? []) {
      const year = Number((f.properties as { year?: unknown } | null)?.year);
      if (Number.isFinite(year)) years.add(year);
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [data.layers.carbon]);

  const snapshotDate = data.manifest?.snapshot_date;
  const s = data.manifest?.stats;
  const cs = data.caseManifest;
  /* Fetched only behind the ?32024 flag, so its presence is the gate. */
  const sv = data.saveManifest;
  const insetPhotos = useMemo(
    () =>
      scene === "case-after"
        ? dredgeInsetPhotos(cs?.photos)
        : scene === "save-fixed"
          ? placementInsetPhotos(sv?.photos)
          : undefined,
    [scene, cs?.photos, sv?.photos],
  );
  /* Reef acreage created on the lease. (106 ac × 73.2% → 77.) The
     invitation-only opener quotes the same figure, so the arithmetic
     lives beside the snapshot types rather than in this file. */
  const createdAcres = newReefAcres(cs);

  return (
    <div ref={rootRef} className="story-root relative">
      <MapStage
        data={data}
        activeScene={scene}
        targetId={activeTarget}
        showVenturePois={showVenturePois}
        reducedMotion={reducedMotion}
        onView={onView}
        onPhoto={onPhoto}
      />
      <Hud
        view={view}
        scene={scene}
        snapshotDate={snapshotDate}
        visible={hudVisible}
        targetId={activeTarget}
        carbonYears={carbonYears}
        showSaveTarget={hasFieldSave}
        onTarget={setManualTarget}
      />
      {/* One inset, two photo sets: the placement replay's field shots,
          and the resurvey's dredge tows. The map runs one cycle at a time. */}
      <PlacementInset
        photos={insetPhotos}
        index={photoIndex}
        visible={hudVisible && (scene === "save-fixed" || scene === "case-after")}
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
              We are bringing the reefs back!
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist/85 sm:text-lg">
              Plotted below, from our own survey database: the cultch (shells, recycled concrete, crushed limestone) we placed, the acres we restored, the measured carbon captured and stored, right where it happened.

            </p>
            <p className="story-chart-note mt-9">
             {snapshotDate ?? "PRE-RELEASE"}
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

        {/* ---- Invitation-only opener, front-loaded ahead of chapter one.
                 Additive: without the URL flag the brief runs exactly as
                 it always has, hero straight into what was lost. ---- */}
        {showVenturePois && (
          <>
            <div data-scene="venture" data-covered="true">
              <VentureBriefBand
                manifest={data.manifest}
                caseManifest={data.caseManifest}
                construction={data.construction}
                leases={data.layers.leases}
                cssTiers={data.layers.cssTiers}
                reducedMotion={reducedMotion}
              />
            </div>

            <ChartStep scene="venture">
              <ChapterCard
                eyebrow="The water in question"
                title="Cameron Parish to Plaquemines Parish"
              >
                <p>
                  The shading between them is surveyed
                  reef at commercial density. The bottom we have poled, counted, and had checked.
                  It is roughly a hundred and eighty miles of working coast, and the brief that
                  follows is how every acre of it got onto the chart.
                </p>
                <CardStats
                  stats={[
                    { value: s?.css_acres?.total, label: "acres at density" },
                    { value: 12, label: "counties and parishes surveyed" },
                  ]}
                />
              </ChapterCard>
            </ChartStep>
          </>
        )}

        {/* ---- Chapter one — what was lost ---- */}
        <ChartStep scene="lost">
          <ChapterCard
            eyebrow="Chapter one — what was lost"
            title="An engine of the coast, dismantled"
          >
            <p>
              An estimated 85 percent of the Atlantic and Gulf Coasts&rsquo; oyster reef is
              gone, the most degraded marine habitat on Earth. A major cause of the collapse
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
              that delivered material. The oyster reef this coast lost is being restored at working scale.
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

        {/* ---- Chapter three — the science ---- */}
        <ChartStep scene="coverage" tall>
          <ChapterCard eyebrow="The science" title="We pole every acre we claim">
            <p>
              Our strength is our data: continuous bottom soundings plus dredge tows and
              point samples, all geolocated, all repeatable. We have compiled the world&rsquo;s largest set of ground-truthed substrate data. This is not an artist&rsquo;s
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

        <ChartStep scene="carbon" tall>
          <ChapterCard eyebrow="The science" title="Sampled on site and independently verified">
            <p>
              Each column is the net carbon on the books for that patch of water, stacked by
              vintage — the oldest season at the seabed, the newest on top. Heights are metric
              tons CO₂e from the accepted results ledger, already net of our own operational
              emissions, and none of it is booked until a disinterested third party has
              verified the hand counts beneath it.
            </p>
            <CardStats
              stats={[{ value: s?.net_mt_total, label: "net MT CO₂e banked", compact: true }]}
            />
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
              The shaded areas are surveyed reef at or above densities capable of being a net sink for carbon,
              doing everything a reef does: feeding a fishery, buffering a shoreline,
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
                  {caseLeaseLabel(cs)}: {fmtInt(cs.acres)} acres side by side in {cs.county}{" "}
                  Parish, one leaseholder, one shared boundary. Months of soundings before the
                  work found what a mined coast leaves behind — bare clay bottom and mud, with
                  almost nothing for a larva to land on.
                </p>
                <CardStats
                  stats={[
                    { value: cs.before.points, label: "soundings across both leases" },
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

            {/* The dock footage: opaque, so it carries the next scene and the
                camera lines up on the leases while the barges are loading. */}
            {cs.video && (
              <div data-scene="case-work" data-covered="true">
                <MaterialBand manifest={cs} />
              </div>
            )}

            <ChartStep scene="case-work" tall>
              <ChapterCard eyebrow="Chapter five — the work" title="Six weeks of cultch">
                <p>
                  {fmtList(cs.bedding.materials)} went over the side in {fmtInt(cs.bedding.placements)}{" "}
                  logged barge load placements, replayed here in the order the barges made
                  them — both leases worked in the same window.
                </p>
                <CardStats
                  stats={[
                    { value: cs.bedding.placements, label: "barge load placements, May–Jun 2025" },
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
                  hard — {createdAcres != null ? `${fmtInt(createdAcres)} acres of ` : ""}new
                  reef, created in a single season, where before there was none.
                </p>
                <CardStats
                  stats={[
                    ...(createdAcres != null
                      ? [{ value: createdAcres, label: "acres of new reef created" }]
                      : []),
                    { value: cs.after.points, label: "soundings, Dec 2025" },
                    {
                      value: cs.after.pct_reef,
                      label: "of the two leases reads solid reef",
                      decimals: 1,
                      suffix: "%",
                    },
                  ]}
                />
              </ChapterCard>
            </ChartStep>
          </>
        )}

        {/* ---- Bonus chapter — the field save (?32024 flag). The band and
                 its scenes mount only when the pack was fetched, so the
                 public brief never hints the chapter exists. ---- */}
        {sv && (
          <>
            <div data-scene="save-island" data-covered="true">
              <FieldSaveBand manifest={sv} />
            </div>

            <ChartStep scene="save-island" tall>
              <ChapterCard eyebrow="Bonus chapter — the field save" title="An island of oysters">
                <p>
                  The 2023 poll, plotted where it happened. Every shell-gold sounding is
                  bottom that rang solid reef — a standing island of live oysters surrounded
                  by buried shell. The bedding plan drew itself: build around the island, never across
                  it.
                </p>
                <CardStats
                  stats={[
                    { value: sv.before.points, label: "soundings before the work" },
                    {
                      value: sv.before.pct_reef,
                      label: "of the lease read solid reef",
                      decimals: 1,
                      suffix: "%",
                    },
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="save-error" tall>
              <ChapterCard eyebrow="Bonus chapter — the mistake" title="The first load lands on live reef">
                <p>
                  The plan put every load in the bare bottom around the island. This one
                  went down squarely on the reef itself — the first to land on live
                  oysters. On the other side of the Mississippi, the leaseholder watched it happen on the
                  same chart, and picked up the phone.
                </p>
                <CardStats
                  stats={[
                    {
                      value: sv.error_load?.short_tons,
                      label: "short tons on the wrong bottom",
                    },
                    { value: 1000, label: "miles away, watching live" },
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="save-fixed" tall>
              <ChapterCard eyebrow="Bonus chapter — the correction" title="One dredge tow settled it">
                <p>
                  The captain was certain he was over clay. The chart said reef, so he pulled
                  a sample dredge — and it came up oysters. The rest of the job went back to
                  plan: every remaining load into the bare bottom the soundings had cleared.
                </p>
                <CardStats
                  stats={[
                    { value: sv.bedding.placements, label: "barge load placements" },
                    { value: sv.bedding.short_tons, label: "short tons placed" },
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="save-after" tall>
              <ChapterCard eyebrow="Bonus chapter — the return" title="Resurveyed: the island grew">
                <p>
                  Back over the same bottom in late 2025, at more than twice the sounding
                  area. The island is still there — bigger. The reef that took{" "}
                  {fmtInt(sv.error_load?.short_tons)} tons of concrete is now the core of a
                  lease reading {sv.after.pct_reef != null ? `${sv.after.pct_reef}%` : "—"}{" "}
                  solid reef.
                </p>
                <CardStats
                  stats={[
                    { value: sv.after.points, label: "soundings on the repoll" },
                    {
                      value: sv.after.pct_reef,
                      label: "reads solid reef, up from " +
                        (sv.before.pct_reef != null ? `${sv.before.pct_reef}%` : "—"),
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
          <CreditsBand
            manifest={data.manifest}
            cssTiers={data.layers.cssTiers}
            counties={data.layers.counties}
            construction={data.construction}
          />
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
            Buy the offset that builds the reef.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist/85">
            Credits are available now, by the ton or by the batch, retired in your name with a
            certificate that points back to the water on this chart. And the chart is live
            water we work every week, so before you sign anything, come see it from the boat.
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
