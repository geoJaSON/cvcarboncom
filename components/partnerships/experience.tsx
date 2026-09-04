"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EMAIL } from "@/lib/site";
import "@/components/story/story.css";
import { CardStats, ChapterCard } from "@/components/story/chapter-card";
import { Hud } from "@/components/story/hud";
import { MapStage, type ChartView } from "@/components/story/map-stage";
import { PlacementInset, dredgeInsetPhotos } from "@/components/story/placement-inset";
import {
  caseLeaseLabel,
  fmtInt,
  fmtList,
  newReefAcres,
  useStoryData,
} from "@/components/story/use-story-data";
import { CultchVideoBand, ExampleSeasonBand, FieldAppBand, FleetBand } from "./bands";
import { PARTNER_SCENES, type PartnerSceneId } from "./scenes";

/* ------------------------------------------------------------------
   The partnerships brief: the same chart engine as the operations
   brief, pointed at a different reader. A leaseholder is not deciding
   whether a ton is real, they are deciding whether to hand us their
   survey data and their season. So the argument runs: here is the
   fleet you would be joining, here is how the work is recorded, here
   is what the record does for you, here is what you get back.

   Structure is the same contract as /story. Transparent sections carry
   a data-scene and expose the chart; opaque bands carry the NEXT act's
   scene so the camera repositions while it is covered.
   ------------------------------------------------------------------ */

export default function PartnershipsExperience() {
  const data = useStoryData();
  const [scene, setScene] = useState<PartnerSceneId>("hero");
  const [hudVisible, setHudVisible] = useState(true);
  const [view, setView] = useState<ChartView | null>(null);
  const [manualTarget, setManualTarget] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewThrottle = useRef(0);
  const hasExample = data.caseManifest != null;

  /* Scene trigger: the section straddling the viewport's center wins.
     Opaque bands (data-covered) fade the HUD out while they hold the
     viewport, since the HUD stacks above them. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = root.querySelectorAll<HTMLElement>("[data-scene]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const next = el.dataset.scene as PartnerSceneId;
          if (next) {
            setScene(next);
            setManualTarget(null);
          }
          setHudVisible(el.dataset.covered !== "true");
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
    // Act three's sections mount once the case pack lands, so the
    // observer must be rebuilt when they appear.
  }, [hasExample]);

  /* The map fires per animation frame during the ease; the HUD needs
     roughly eight updates a second, and each setView re-renders here. */
  const onView = useCallback((v: ChartView) => {
    const now = performance.now();
    if (now - viewThrottle.current < 120) return;
    viewThrottle.current = now;
    setView(v);
  }, []);

  const onPhoto = useCallback((next: number | null) => {
    setPhotoIndex(next);
  }, []);

  const activeTarget = manualTarget ?? PARTNER_SCENES[scene].targetId ?? null;
  const snapshotDate = data.manifest?.snapshot_date;
  const s = data.manifest?.stats;
  /* The worked example: fetched for every reader of either storymap, so
     the act mounts whenever the pack is on disk. */
  const cs = data.caseManifest;
  const createdAcres = newReefAcres(cs);
  const insetPhotos = useMemo(
    () => (scene === "case-after" ? dredgeInsetPhotos(cs?.photos) : undefined),
    [scene, cs?.photos],
  );

  return (
    <div ref={rootRef} className="story-root relative">
      <MapStage
        data={data}
        scenes={PARTNER_SCENES}
        activeScene={scene}
        targetId={activeTarget}
        reducedMotion={reducedMotion}
        onView={onView}
        onPhoto={onPhoto}
      />
      <Hud
        view={view}
        scenes={PARTNER_SCENES}
        scene={scene}
        snapshotDate={snapshotDate}
        visible={hudVisible}
        targetId={activeTarget}
        carbonAreaFilter={false}
        showLegend={false}
        onTarget={setManualTarget}
        onCarbonAreaFilter={() => {}}
      />

      {/* The resurvey's dredge tows, lit one at a time on the after scene. */}
      <PlacementInset
        photos={insetPhotos}
        index={photoIndex}
        visible={hudVisible && scene === "case-after"}
      />

      {/* Way home - the site chrome is hidden on this route. */}
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
            <Image
              src="/images/cv-carbon-logo.png"
              alt="CV Carbon, LLC"
              width={873}
              height={282}
              priority
              className="mx-auto h-10 w-auto brightness-0 invert sm:h-12"
            />
            <h1 className="mt-7 font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              Your oyster restoration could also be part of our carbon capture and storage project.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist/85 sm:text-lg">
              Shaded areas on this chart are restored oyster reef that is surveyed using our mobile application.
            </p>
            <p className="story-chart-note mt-9">{snapshotDate ?? "PRE-RELEASE"}</p>
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

        {/* ---- Act one: the fleet ---- */}
        <ChartStep scene="fleet" tall>
          <ChapterCard
            eyebrow=""
            title="Four hundred oyster businesses are already on this chart"
          >
            <p>
              Every shaded acre below is a reef that is being monitored by our project.
            </p>
            <CardStats
              stats={[
                { value: s?.entities_enrolled, label: "family oyster businesses" },
                { value: s?.leases_in_program, label: "leases under survey" },
                { value: 12, label: "parishes and counties" },
              ]}
            />
          </ChapterCard>
        </ChartStep>

        <div data-scene="close" data-covered="true">
          <FleetBand manifest={data.manifest} />
        </div>

        {/* ---- Act two: the field app ---- */}
        <div data-scene="close" data-covered="true">
          <FieldAppBand />
        </div>

        {/* ---- Act three: the worked example. Mounts with its data pack,
                 so a missing bake drops the act rather than the page. ---- */}
        {cs && (
          <>
            <div data-scene="case-before" data-covered="true">
              <ExampleSeasonBand manifest={cs} />
            </div>

            <ChartStep scene="case-before" tall>
              <ChapterCard
                eyebrow="Act three: the worked example"
                title={`${cs.location}, before the shell`}
              >
                <p>
                  {caseLeaseLabel(cs)}: {fmtInt(cs.acres)} acres side by side in {cs.county} Parish,
                  one leaseholder, one shared boundary. Soundings before the work found
                  bare clay bottom and mud, with almost nothing for a larva to land on.
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
                <CultchVideoBand manifest={cs} />
              </div>
            )}

            <ChartStep scene="case-work" tall>
              <ChapterCard eyebrow="Act three: the work" title="Six weeks of cultch">
                <p>
                  Limestone and river rock went over the side in{" "}
                  {fmtInt(cs.bedding.placements)} logged barge load placements, replayed here in the
                  order the barges made them. Your crew logs the same way, from the boat, as the
                  work happens.
                </p>
                <CardStats
                  stats={[
                    { value: cs.bedding.placements, label: "barge load placements, May–Jun 2025" },
                    ...(cs.bedding.short_tons != null
                      ? [{ value: cs.bedding.short_tons, label: "short tons placed" }]
                      : []),
                  ]}
                />
              </ChapterCard>
            </ChartStep>

            <ChartStep scene="case-after" tall>
              <ChapterCard eyebrow="Act three: what came back" title="Resurveyed: solid reef">
                <p>
                  Six months on, the survey boat crossed the same bottom at more than twice the
                  sounding density. Where the chart turns shell-gold the substrate now rings hard,{" "}
                  {createdAcres != null ? `${fmtInt(createdAcres)} acres of ` : ""}new reef built in
                  a single season on bottom the leaseholder still fishes.
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

        {/* ------------------------------------------------------------
            The remaining acts land here:
              4. What the chart does for you Adams Bay, the field save
              5. What it pays                blocked on leaseholder terms
              6. Who does the paperwork      verification and the registry
              7. Your lease, your number     the acreage calculator
            Each is a scene in ./scenes.ts plus a band in ./bands.tsx.
            ------------------------------------------------------------ */}

        {/* ---- The ask ---- */}
        <section
          data-scene="close"
          className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <p className="eyebrow text-steel-400">The ask</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
            Put your restoration project on the map.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist/85">
            Enrolling costs nothing and you receive the tools to effectively monitor your restoration areas. We provide tutorials and are always available to support. 
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={EMAIL.href}
              className="inline-flex items-center gap-2.5 rounded-full bg-verdigris px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-verdigris-600"
            >
              Talk to us
            </a>

          </div>
          <p className="story-chart-note absolute bottom-6">
            © {new Date().getFullYear()} CV Carbon
          </p>
        </section>
      </div>
    </div>
  );
}

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

/** A transparent scroll section that exposes the chart. `tall` buys the
    scene more dwell time. */
function ChartStep({
  scene,
  tall = false,
  children,
}: {
  scene: PartnerSceneId;
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
