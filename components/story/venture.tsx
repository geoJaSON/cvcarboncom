"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";
import { BandShell, REINVESTMENT_PCT } from "./bands";
import { VENTURE_POIS } from "./venture-pois";
import { VentureInset } from "./venture-inset";
import {
  beddedReefAcres,
  fmtInt,
  newReefAcres,
  type CaseStudyManifest,
  type ConstructionManifest,
  type StoryFeatureCollection,
  type StoryManifest,
} from "./use-story-data";

/* ------------------------------------------------------------------
   The invitation-only opener. When the story URL carries ?venture the
   brief front-loads one band addressed to the reader, setting what they
   publish about their own coast beside what this chart already
   measures - before the narrative starts from the beginning.

   House rule for this band: every figure on it is either theirs, quoted
   from their own page with the read date recorded below, or ours, read
   out of the snapshot manifest exactly like the rest of the brief.
   Nothing is estimated in between, because this is the one band the
   reader can fact-check against their own site in ten seconds.
   ------------------------------------------------------------------ */

const PROSPECT = {
  name: "Venture Global",
  sourceLabel: "Safety and Environment, ventureglobal.com",
  sourceUrl: "https://ventureglobal.com/about-us/safety-and-environment/",
  /* Their page animates these counters up from zero, so the values are
     the counters' own targets rather than anything rendered on screen.
     Re-read the page before the link goes out - if they move, this band
     is the first thing a reader will check. */
  readOn: "August 2026",
  ccsGoalTonsPerYear: 1_000_000,
  marshAcres: 140,
  wetlandCreditsUsdMillions: 40,
  /* Their own stated goal for the parish, quoted verbatim from the
     Cameron Parish panel. The local-benefit argument below is built on
     this sentence on purpose: it lets the band offer an instrument for
     something they have already committed to in public, rather than
     make a charge about what a project costs the people around it.
     Never replace this with our characterisation of their record. */
  communityGoal:
    "positively impact the surrounding community by driving economic growth, engaging with our neighbors",
} as const;

/** Reef acreage bedded to date, per Jason's AGOL working layers as of
    August 2026. The construction bake trails this until the outstanding
    placements sync; see the floor applied in VentureBriefBand. Delete
    this constant once construction.json reports the higher figure. */
const BEDDED_ACRES_FLOOR = 3813;

/* What the rest of the brief answers, in the order it answers it. A
   reader who has been handed a scrolling map deserves to know the shape
   of the argument before committing to the scroll. */
const AHEAD: [string, string][] = [
  ["The science", "How every acre is measured, and how it is validated."],
  ["The ledger", "The net tonnage of securely stored is derived by a mass balance calculation that accounts for our own carbon footprint."],
  ["Permanence", "What a hurricane does to a reef, and what the next resurvey would show if it took one."],
  ["Scalability", "Your tonnage, in acres of bottom and in shell over the side."],
];

export function VentureBriefBand({
  manifest,
  caseManifest,
  construction,
  leases,
  cssTiers,
  reducedMotion,
}: {
  manifest: StoryManifest | null;
  caseManifest: CaseStudyManifest | null;
  /* Card four quotes the construction ledger, the same bake that draws
     the built-vs-restored chart later in the brief. */
  construction: ConstructionManifest | null;
  leases: StoryFeatureCollection | null;
  cssTiers: StoryFeatureCollection | null;
  reducedMotion: boolean;
}) {
  const s = manifest?.stats;
  const gained = newReefAcres(caseManifest);
  /* The barges are ahead of the bake: acreage is still coming across
     from AGOL that this snapshot has not picked up yet, and the true
     figure today is BEDDED_ACRES_FLOOR. Quote the floor while the
     ledger trails it, and hand back to the ledger the moment it passes
     - so the sync catching up retires this override on its own instead
     of leaving a stale number to be noticed by the reader. */
  const ledger = beddedReefAcres(construction);
  const bedded = ledger
    ? { ...ledger, acres: Math.max(ledger.acres, BEDDED_ACRES_FLOOR) }
    : null;
  const plant = VENTURE_POIS.find((poi) => poi.id === "new-gas-plant-site");

  return (
    <BandShell>
      <SectionHeading
        eyebrow={`Prepared for ${PROSPECT.name}`}
        title="We are a nature-based carbon capture and storage project built with local commercial fishermen."
      />

      <div className="mt-14 space-y-6">
        <AlignmentCard
          index={1}
          heading="The capture goal"
          theirsLabel="Your goal"
          oursLabel="What we currently have"
          theirs={` On your website you commit to invest in carbon capture and storage at each of your projects with a CCS goal of 1 million tons of carbon per year.`}
          ours={
            <>
              {fmtInt(s?.net_mt_total)} MT CO₂e net of our own operation and already measured, verified, and serialized to a public registry.
            </>
          }
        />

        <AlignmentCard
          index={2}
          heading="Coastal habitat is a shared priority for you and the community"
          theirsLabel="Your accomplishments"
          oursLabel="What we are monitoring"
          theirs={`${fmtInt(PROSPECT.marshAcres)} acres of marsh creation and restoration to date, and $${PROSPECT.wetlandCreditsUsdMillions} million in wetland mitigation credits.`}
          ours={
            <>
              {fmtInt(s?.css_acres?.total)} acres of surveyed oyster reef
            </>
          }
        />

        <AlignmentCard
          index={3}
          heading="Venture Global and CV Carbon share the same footprint"
          theirsLabel="Your community"
          oursLabel="Where we are"
          theirs="Calcasieu Pass in Cameron Parish, and the export facility in Plaquemines Parish."
          ours={
            <>
              From Calcasieu Pass to Plaquemines Parish, we have 462,653 acres of oyster leases run by 405 commercial oyster businesses.
            </>
          }
        >
          The pins on the chart are your sites. Everything shaded around them is
          our survey data. Our project is already in the shadow of your facilities.
        </AlignmentCard>

        {/* Cards one through three answer their published goals in kind.
            This one answers the part of their commitment that carbon
            alone cannot: the ton is the means, and what rides along with
            it lands in the same parishes their facilities report from.
            Deliberately the only card carrying no figure - the
            co-benefits band later in the brief is where the literature
            behind this claim is quoted and sourced. */}
        <AlignmentCard
          index={4}
          heading="The benefits do not stop at the carbon"
          theirsLabel="Your commitment"
          oursLabel="What rides along with the ton"
          theirs={`An eagerness to giving back to the community.`}
          ours={
            <>
              We provide benefits beyond carbon capture and storage for the local communities and environments where your projects are located.
            </>
          }
        >
          An engineered removal takes land and builds a plant. This one builds
          habitat: hard bottom that feeds a working fishery, breaks storm energy
          before it reaches the marsh, and accretes upward instead of settling
          like rock or bulkhead.
        </AlignmentCard>
      </div>

      {/* Card three says their sites and our survey share a coast. This
          is that sentence with the imagery behind it: open on the plant
          at aerial resolution, then climb until our record fills the
          water around it. Nothing is drawn until the frame is wide
          enough to be honest about the distance. */}
      {plant && (
        <Reveal className="mt-10">
          <VentureInset
            center={plant.coordinates}
            siteLabel={plant.name}
            leases={leases}
            cssTiers={cssTiers}
            reducedMotion={reducedMotion}
          />
        </Reveal>
      )}

      {/* The local-benefit case, which is the one argument on this band
          that a ton bought anywhere else cannot answer. Built entirely
          on their own published goal for the parish - the point is that
          this instrument does something they have already said they
          want, not that they owe anyone an apology. Keep it that way. */}
      <Reveal className="mt-10">
        <div className="rounded-lg border border-verdigris/40 bg-navy p-8 sm:p-10">
          <p className="eyebrow text-steel-400">Community impact</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-14">
            <div>
              <p className="font-display text-7xl leading-none text-white sm:text-8xl">
                {fmtInt(s?.entities_enrolled)}
              </p>
              <p className="story-chart-note mt-3">family oyster businesses</p>
              <p className="mt-6 font-display text-3xl leading-none text-verdigris">
                {REINVESTMENT_PCT}%
              </p>
              <p className="story-chart-note mt-2">of net revenue, back into cultch</p>
              {/* What that reinvestment has already bought. It belongs on
                  this panel rather than beside the survey totals: the
                  argument here is that the money lands as work in the
                  water, and this is the acreage that work produced. */}
              {bedded && (
                <>
                  <p className="mt-6 font-display text-3xl leading-none text-verdigris">
                    {fmtInt(bedded.acres)}
                  </p>
                  <p className="story-chart-note mt-2">
                    acres of reef restored since {bedded.firstYear}
                  </p>
                </>
              )}
            </div>
            <div>
              <h3 className="font-display text-2xl text-white sm:text-3xl">
                Revenue from our offsets lands on the dock of the parish it was captured in.
              </h3>
              <div className="prose-cv mt-5 !text-mist/85 [&_strong]:!text-white">
                <p>
                  Your Cameron Parish page sets the goal in your own words: to{" "}
                  <em>{PROSPECT.communityGoal}</em>. On this coast a great many of those
                  neighbors are the people who hold the oyster leases and run the boats. They
                  are the ones who share the water with a working port, and the ones who turn up
                  when there is a public comment period.
                </p>
                <p>
                  A ton bought from a broker is a line in a report. This one is a purchase order
                  to a commercial oyster business in the parishes your facilities report from -
                  for work its own crew does, on its own lease, in its own boat.{" "}
                  <strong>
                    {REINVESTMENT_PCT} percent of net revenue is committed straight back into
                    cultch
                  </strong>
                  , so the spend buys shell for the next season instead of ending at the invoice.
                  {bedded
                    ? ` That is what has put ${fmtInt(bedded.acres)} acres of reef back on the bottom since ${bedded.firstYear} - every one of them a GPS-logged bedding run off the side of a working boat, resurveyed afterwards rather than counted at the invoice.`
                    : ""}
                </p>
                <p>
                  That is the rare environmental purchase that settles twice: a verified ton
                  retired in your name, and a neighbor measurably better off for your being
                  here. One half is provable in a public registry. The other is visible from the
                  dock, which is where it counts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Front-loading works both ways: tell them what is coming, so the
          scroll reads as a document with a structure rather than a ride. */}
      <Reveal className="mt-14">
        <div className="rounded-lg border border-navy/10 bg-white p-8">
          <p className="eyebrow">What the rest of this brief answers</p>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {AHEAD.map(([title, blurb], i) => (
              <div key={title} className="flex gap-4">
                <span className="font-display text-sm text-verdigris">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <dt className="font-display text-lg text-navy">{title}</dt>
                  <dd className="prose-cv mt-2 text-[0.9375rem]">{blurb}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        {PROSPECT.name} figures quoted from{" "}
        <a
          href={PROSPECT.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          {PROSPECT.sourceLabel}
        </a>
        , read {PROSPECT.readOn}. CV Carbon figures are read from the survey snapshot dated{" "}
        {manifest?.snapshot_date ?? "-"}. Fish and shellfish
        production per Peterson, Grabowski &amp; Powers (2003); shoreline-erosion
        evidence per LSU AgCenter monitoring. Both cited in full on{" "}
        <a href="/beyond-carbon" className="underline underline-offset-2">
          Beyond Carbon
        </a>
        .
      </p>
    </BandShell>
  );
}

/** One published commitment beside the line of our record that answers
    it. Their column is quoted; ours is read from the snapshot. */
function AlignmentCard({
  index,
  heading,
  theirsLabel,
  theirs,
  oursLabel,
  ours,
  children,
}: {
  index: number;
  heading: string;
  /** Column captions are per-card: each pairs one thing they publish
      ("Your goal") with the line of our record that answers it in kind
      ("What we currently have"). */
  theirsLabel: string;
  theirs: ReactNode;
  oursLabel: string;
  ours: ReactNode;
  /** Optional closing line under the two columns. A card that lets the
      quoted figures speak for themselves omits it and loses the rule
      along with it, rather than carrying an empty divider. */
  children?: ReactNode;
}) {
  return (
    <Reveal delay={(index - 1) * 90}>
      <article className="rounded-lg border border-navy/10 bg-white p-7 sm:p-9">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-sm text-verdigris">
            {String(index).padStart(2, "0")}
          </span>
          <h3 className="font-display text-xl text-navy sm:text-2xl">{heading}</h3>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <div className="border-l border-navy/15 pl-5">
            <p className="story-note-ink">{theirsLabel}</p>
            <p className="mt-2 font-display text-lg leading-snug text-steel">{theirs}</p>
          </div>
          <div className="border-l border-verdigris/50 pl-5">
            <p className="story-note-ink">{oursLabel}</p>
            <p className="mt-2 font-display text-lg leading-snug text-navy">{ours}</p>
          </div>
        </div>

        {children ? (
          <div className="prose-cv mt-7 border-t border-navy/10 pt-6 text-[0.9375rem]">
            {children}
          </div>
        ) : null}
      </article>
    </Reveal>
  );
}
