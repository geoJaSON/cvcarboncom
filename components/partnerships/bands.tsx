"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Figure, PullQuote, SectionHeading, TideRule } from "@/components/ui";
import {
  caseLeaseLabel,
  fmtDayWindow,
  fmtInt,
  fmtList,
  fmtPct,
  fmtWindow,
  type CaseStudyManifest,
  type StoryManifest,
} from "@/components/story/use-story-data";
import { FieldAppShowcase } from "./field-app-showcase";

/* ------------------------------------------------------------------
   Editorial interludes for the partnerships brief. Opaque bands that
   slide over the chart between acts.

   Everything here is addressed to a leaseholder, in the second person.
   The operations brief at /story argues that a ton is real; this page
   argues that the program is worth joining, so the two never share a
   band even where they cite the same figure. If a number appears on
   both, it is read from the same snapshot manifest, not copied across.
   ------------------------------------------------------------------ */

function BandShell({
  children,
  tone = "pearl",
}: {
  children: ReactNode;
  tone?: "pearl" | "abyss";
}) {
  return (
    <div className={`relative ${tone === "pearl" ? "bg-pearl" : "bg-abyss"}`}>
      <TideRule className={tone === "pearl" ? "text-pearl" : "text-abyss"} flip />
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-10">{children}</div>
    </div>
  );
}

/* ---- Act one: the fleet already in the program ---- */

export function FleetBand({ manifest }: { manifest: StoryManifest | null }) {
  const s = manifest?.stats;

  return (
    <BandShell>
      <SectionHeading
        eyebrow=""
        title="Our carbon capture and storage project is operational"
        intro={
          <>
            <p>
              We started the project with only a handful of leases in 2023. Today we have grown to {" "}
              {fmtInt(s?.leases_in_program)} leases, across {fmtInt(s?.entities_enrolled)} entities  and 12 parishes and counties
              in {fmtInt(s?.states)} states. Between them they have put{" "}
              {fmtInt(s?.signed_acres)} acres of bay bottom under survey.
            </p>
            <p>
              Whether your purpose is restoration or harvest, participating in our carbon capture and storage project is a new and previously unavailable revenue source that supports additional oyster restoration.
            </p>
          </>
        }
      />

      {/* The revenue split is the first question a leaseholder asks, so
          it is answered above the fold of the band, not in act five. */}
      <Reveal className="mt-12">
        <div className="flex flex-col gap-6 rounded-lg border border-verdigris/40 bg-verdigris/5 p-8 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
          <p className="font-display text-5xl leading-none text-verdigris sm:text-6xl">30%</p>
          <p className="max-w-2xl text-base leading-relaxed text-ink/80">
            Our source of revenue is the monetization of carbon capture and storage. This includes the sale of voluntary carbon offsets. One voluntary carbon offset represents 1 net metric ton of carbon dioxide removed from the atmosphere. Our agreements are structured as a percentage-based revenue sharing model, with 30% of
            the revenue going straight back into the water as cultch material placements.
          </p>
        </div>
      </Reveal>

      {/* <div className="mt-20">
        <SectionHeading
          eyebrow="Why leaseholders and not the state"
          title="The state's own numbers say the harvest rides on private leases"
          intro={
            <p>
              Louisiana holds 1.7 million acres of public oyster area against 404,000 acres of
              private lease. In 2020 the public grounds landed 34 thousand pounds. The private
              leases landed roughly 3.5 million. The Department of Wildlife and Fisheries puts that
              gap down to one thing: leaseholders keep placing cultch, season after season, because
              the reef is theirs to lose.
            </p>
          }
        />
      </div> */}

      <Reveal className="mt-14">
        <PullQuote
          quote="Individual adult oysters can filter up to 50 gallons of water a day. The reefs formed by the eastern oyster have an average density of 647 individuals per meter-squared and it is not uncommon for them to exceed a thousand individuals per square-meter. The oysters capture, fix, and store organic carbon, carbon dioxide and carbonates directly from the water."
          cite={
            <>
              <span className="block">
                Megan K. LaPeyre, D. A. Marshall, L. S. Miller, A. T. Humphries. 2019. Oyster reefs
                in northern Gulf of Mexico estuaries harbor diverse fish and decapod crustacean
                assemblages: A meta-synthesis. Frontiers in Marine Science. 10.3389/fmars.2019.00666.
              </span>
              <span className="mt-2 block">
                Xue-Wei-Jie Chen et al. 2025. Oyster farming acts as a marine carbon dioxide removal
                (mCDR) hotspot for climate change mitigation. PNAS. 122 (36) e2504004122.
                https://doi.org/10.1073/pnas.2504004122.
              </span>
            </>
          }
        />
      </Reveal>
    </BandShell>
  );
}

/* ---- Act three: the worked example ----

   Bay Boudreau told to a leaseholder. The operations brief runs the same
   pack as its chapter five and argues from it that a ton is real; here
   the point is narrower and more useful to this reader: it is what a
   season inside the program looked like for someone with a lease like
   theirs. Same numbers, read from the same bake, different argument, so
   the two sets of sentences never share a file. ---- */

/* The pack's two dredge-table shots stay on the operations brief. Here
   the resurvey's own tow photos cycle in the inset a few screens down,
   so the band would be spending two frames on a picture the chart is
   about to show. Matched by src: the bake can add media without
   quietly putting these back. */
const SKIP_MEDIA = new Set([
  "/images/lease-30260/dredge-sample.jpg",
  "/images/lease-30260/dredge-mature-reef.jpg",
]);

export function ExampleSeasonBand({ manifest }: { manifest: CaseStudyManifest }) {
  const { before, after, bedding, leases } = manifest;
  const several = leases.length > 1;
  const media = manifest.media?.filter((item) => !SKIP_MEDIA.has(item.src)) ?? [];

  return (
    <BandShell>
      <SectionHeading
        eyebrow=""
        title="One example of a project built from revenue derived from our carbon capture and storage project"
        intro={
          <>
            <p>
              This is what the program looks like on working bottom. {caseLeaseLabel(manifest)}{" "}
              {several ? "adjoin each other" : "sits"} on {manifest.location || "the water"} in{" "}
              {manifest.county} Parish, {fmtInt(manifest.acres)} acres of lease.
            </p>
            <p>
              We sounded {several ? "both leases" : "the lease"} several months before any cultch placement.
              The cultch was deployed during the spring spat set and was logged from the barges as the crews
              worked. Six months later the survey boat crossed the same bottom again. This is an example of the monitoring record that this leaseholder now has at their disposal.
            </p>
          </>
        }
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <PhasePanel
            phase="Before you start"
            window={fmtWindow(before.window)}
            figure={fmtPct(before.pct_unproductive)}
            unit="subtidal flat"
          >
            {fmtInt(before.points)} soundings found mud and bare clay. The survey comes first on
            every lease in the program. This provides the baseline.
          </PhasePanel>
        </Reveal>
        <Reveal delay={90}>
          <PhasePanel
            phase="Your season"
            window={fmtWindow(bedding.window)}
            figure={fmtInt(bedding.placements)}
            unit="barge load placements"
            accent
          > 
            Limestone and river rock totalling
            {bedding.short_tons != null ? ` ${fmtInt(bedding.short_tons)} short tons` : ""}, each
            pass GPS logged from the barge in the app. This is the work you already do, recorded as
            you do it.
          </PhasePanel>
        </Reveal>
        <Reveal delay={180}>
          <PhasePanel
            phase="What came back"
            window={fmtWindow(after.window)}
            figure={fmtPct(after.pct_reef)}
            unit="solid reef"
          >
            {fmtInt(after.points)} soundings on the resurvey, more than twice the density of the
            first pass, and the bottom now rings hard. That difference, surveyed at both ends, is
            the asset the program is built on.
          </PhasePanel>
        </Reveal>
      </div>

      {several && (
        <Reveal className="mt-10">
          <p className="eyebrow">Lease by lease</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">
                  <th className="pb-3 pr-6 font-semibold">Lease</th>
                  <th className="pb-3 pr-6 font-semibold">Acres</th>
                  <th className="pb-3 pr-6 font-semibold">Before</th>
                  <th className="pb-3 pr-6 font-semibold">After</th>
                  <th className="pb-3 pr-6 font-semibold">Barge loads</th>
                  <th className="pb-3 font-semibold">Short tons</th>
                </tr>
              </thead>
              <tbody className="text-ink/80">
                {leases.map((lease) => (
                  <tr key={lease.lease_number} className="border-t border-navy/10">
                    <td className="py-3 pr-6 font-display text-lg text-navy">
                      {lease.lease_number}
                    </td>
                    <td className="py-3 pr-6">{fmtInt(lease.acres)}</td>
                    <td className="py-3 pr-6">
                      {fmtPct(lease.before.pct_reef)} reef
                      <span className="text-ink/45"> &middot; {fmtInt(lease.before.points)} soundings</span>
                    </td>
                    <td className="py-3 pr-6">
                      {fmtPct(lease.after.pct_reef)} reef
                      <span className="text-ink/45"> &middot; {fmtInt(lease.after.points)} soundings</span>
                    </td>
                    <td className="py-3 pr-6">{fmtInt(lease.bedding.placements)}</td>
                    <td className="py-3">{fmtInt(lease.bedding.short_tons)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {!!media.length && (
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <Figure key={item.src} src={item.src} alt={item.alt} caption={item.caption} />
          ))}
        </div>
      )}
    </BandShell>
  );
}

/** One phase of the worked example: before, the work, what came back. */
function PhasePanel({
  phase,
  window,
  figure,
  unit,
  children,
  accent = false,
}: {
  phase: string;
  window: string;
  figure: string;
  unit: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`h-full rounded-lg border p-7 ${
        accent ? "border-verdigris/40 bg-verdigris/5" : "border-navy/10 bg-white/60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">{phase}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">{window}</p>
      </div>
      <p className="mt-5">
        <span className="font-display text-5xl text-navy">{figure}</span>
        <span className="ml-2 font-display text-lg text-steel">{unit}</span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">{children}</p>
    </div>
  );
}

/* ---- Between the before and work scenes: the dock footage, so the
        tonnage on the next chart step has a picture attached to it.
        Carries the case-work scene while the camera repositions. ---- */

export function CultchVideoBand({ manifest }: { manifest: CaseStudyManifest }) {
  const { video, bedding } = manifest;
  if (!video) return null;

  return (
    <BandShell tone="abyss">
      <SectionHeading
        tone="light"
        eyebrow=""
        title={
          bedding.short_tons != null
            ? `${fmtInt(bedding.short_tons)} short tons, one barge at a time`
            : "One barge at a time"
        }
        intro={
          <p>
            Filmed at the dock as the loads went aboard. From {fmtDayWindow(bedding.window)} the
            crews put {fmtInt(bedding.placements)} barge loads of limestone and river rock on these two leases, and the chart that follows replays every run the app
            recorded. On your lease it would be the same: sound the bottom, deploy the cultch, resound the bottom, and monitor the oyster growth.
          </p>
        }
      />
      <Reveal className="mt-12">
        <figure>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-navy">
            <LoopVideo src={video.src} poster={video.poster} muteLoop={!!video.muteLoop} />
          </div>
          {video.caption && (
            <figcaption className="mt-3 text-sm leading-relaxed text-mist/70">
              {video.caption}
            </figcaption>
          )}
        </figure>
      </Reveal>
    </BandShell>
  );
}

/** A silent ambient loop that only fetches once the reader is near it:
    the file is several megabytes and most visitors never scroll this far.
    Reduced-motion readers get the poster and a play control instead. */
function LoopVideo({ src, poster, muteLoop }: { src: string; poster?: string; muteLoop: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ambient = muteLoop && !still;
  return (
    <video
      ref={ref}
      className="aspect-video w-full"
      src={armed ? src : undefined}
      poster={poster}
      controls={!ambient}
      autoPlay={ambient}
      muted={muteLoop}
      loop={muteLoop}
      playsInline
      preload={armed ? "auto" : "none"}
    />
  );
}

/* ---- Act two: the field app ---- */

export function FieldAppBand() {
  return (
    <BandShell tone="abyss">
      <FieldAppShowcase />
    </BandShell>
  );
}
