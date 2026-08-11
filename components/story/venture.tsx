"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";
import { BandShell, REINVESTMENT_PCT } from "./bands";
import {
  fmtInt,
  newReefAcres,
  type CaseStudyManifest,
  type StoryManifest,
} from "./use-story-data";

/* ------------------------------------------------------------------
   The invitation-only opener. When the story URL carries ?venture the
   brief front-loads one band addressed to the reader, setting what they
   publish about their own coast beside what this chart already
   measures — before the narrative starts from the beginning.

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
     Re-read the page before the link goes out — if they move, this band
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

/* What the rest of the brief answers, in the order it answers it. A
   reader who has been handed a scrolling map deserves to know the shape
   of the argument before committing to the scroll. */
const AHEAD: [string, string][] = [
  ["Chapter three — the proof", "How every acre is measured, and who is allowed to disagree with us."],
  ["The ledger", "Net of our own fuel, serialized, and resolvable in a public registry."],
  ["Permanence", "What a hurricane does to a reef, and what the next resurvey would show if it took one."],
  ["Size it", "Your tonnage, in acres of bottom and in shell over the side."],
];

export function VentureBriefBand({
  manifest,
  caseManifest,
}: {
  manifest: StoryManifest | null;
  caseManifest: CaseStudyManifest | null;
}) {
  const s = manifest?.stats;
  const gained = newReefAcres(caseManifest);

  return (
    <BandShell>
      <SectionHeading
        eyebrow={`Prepared for ${PROSPECT.name}`}
        title="Your coast is already on this chart"
        intro={
          <p>
            This brief usually opens on the whole Gulf. For your team it opens here, because
            three of the commitments on your own environment page are things a survey database
            can put a number against — in the same two Louisiana parishes your plants sit in.
            What follows is our record, and you are welcome to check it against yours.
          </p>
        }
      />

      <div className="mt-14 space-y-6">
        <AlignmentCard
          index={1}
          heading="The capture goal, and the tense of it"
          theirs={`${fmtInt(PROSPECT.ccsGoalTonsPerYear)} tons of carbon per year — the CCS goal published on your environment page.`}
          ours={
            <>
              {fmtInt(s?.net_mt_total)} MT CO₂e net of our own operation, already measured on
              the water, and {fmtInt(s?.credits?.total ?? s?.credits?.issued)} credits already
              serialized to a public registry.
            </>
          }
        >
          Ours is a cumulative total across the survey seasons on this chart, not an annual
          rate — so the comparison worth making is not size, it is tense. One figure describes
          capacity being built. The other describes carbon that has been counted by hand,
          checked by an independent verifier, and issued with a serial number on it.
        </AlignmentCard>

        <AlignmentCard
          index={2}
          heading="Coastal habitat is already a line item for you"
          theirs={`${fmtInt(PROSPECT.marshAcres)} acres of marsh creation and restoration to date, and $${PROSPECT.wetlandCreditsUsdMillions} million in wetland mitigation credits.`}
          ours={
            <>
              {fmtInt(s?.css_acres?.total)} acres of surveyed reef at commercial density
              {gained != null && caseManifest
                ? `, ${fmtInt(gained)} of them created on a single ${fmtInt(caseManifest.acres)}-acre lease in one season`
                : ""}
              .
            </>
          }
        >
          These are not competing programs. Reef is the wave break that keeps created marsh
          from washing back out — measured erosion behind restored Louisiana reef runs roughly
          half. You already buy Gulf Coast habitat by the credit; this one arrives with a
          carbon ton, a serial, and a repeatable survey attached to it.
        </AlignmentCard>

        <AlignmentCard
          index={3}
          heading="The same water, worked by people already on it"
          theirs="Calcasieu Pass in Cameron Parish, and the export facility at mile marker 55 of the Mississippi in Plaquemines Parish."
          ours={
            <>
              Plaquemines is one of the camera targets on this chart. {fmtInt(s?.leases_in_program)}{" "}
              leases across {fmtInt(s?.parishes)} parishes, worked by{" "}
              {fmtInt(s?.entities_enrolled)} family oyster businesses.
            </>
          }
        >
          The pins standing on the chart are your sites. Everything shaded around them is
          survey. The fleet that would place the cultch against your tonnage already runs that
          coast every week, out of the same parishes your facilities report in.
        </AlignmentCard>
      </div>

      {/* The local-benefit case, which is the one argument on this band
          that a ton bought anywhere else cannot answer. Built entirely
          on their own published goal for the parish — the point is that
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
            </div>
            <div>
              <h3 className="font-display text-2xl text-white sm:text-3xl">
                An environmental dollar that lands on the dock in the parish it came from
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
                  to a commercial oyster business in the parishes your facilities report from —
                  for work its own crew does, on its own lease, in its own boat.{" "}
                  <strong>
                    {REINVESTMENT_PCT} percent of net revenue is committed straight back into
                    cultch
                  </strong>
                  , so the spend buys shell for the next season instead of ending at the invoice.
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
        {manifest?.snapshot_date ?? "—"} that draws every chart on this page. Shoreline-erosion
        evidence per LSU AgCenter monitoring, cited in full on{" "}
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
  theirs,
  ours,
  children,
}: {
  index: number;
  heading: string;
  theirs: ReactNode;
  ours: ReactNode;
  children: ReactNode;
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
            <p className="story-note-ink">You publish</p>
            <p className="mt-2 font-display text-lg leading-snug text-steel">{theirs}</p>
          </div>
          <div className="border-l border-verdigris/50 pl-5">
            <p className="story-note-ink">This chart holds</p>
            <p className="mt-2 font-display text-lg leading-snug text-navy">{ours}</p>
          </div>
        </div>

        <div className="prose-cv mt-7 border-t border-navy/10 pt-6 text-[0.9375rem]">
          {children}
        </div>
      </article>
    </Reveal>
  );
}
