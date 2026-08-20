"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Figure, NumberedCard, PullQuote, SectionHeading, StatBand, TideRule } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import {
  ConstructionBars,
  EquivalentsStrip,
  GrowthBars,
  ManhattanTile,
  NetWaterfall,
  PerspectiveTiles,
  RunwayBar,
  SeasonStack,
  SeasonTile,
  VintageBars,
} from "./charts";
import { YearBoard } from "./year-board";
import { FISH_LB_PER_ACRE_YEAR, JOBS_PER_MILLION } from "./factors";
import {
  fmtCompact,
  fmtInt,
  type CaseStudyManifest,
  type ConstructionManifest,
  type SaveManifest,
  type SaveMarsh,
  type StoryFeatureCollection,
  type StoryManifest,
} from "./use-story-data";

/* ------------------------------------------------------------------
   Editorial interludes. These are the opaque bands that slide over
   the chart between acts — set in the site's own editorial voice so
   the brief reads as one continuous CV Carbon document.

   Numbers Jason supplies by hand (dollars, anything without a public
   query) go here; a null hides its tile entirely, so the page never
   shows a made-up figure.
   ------------------------------------------------------------------ */
const PROVIDED = {
  /** Dollars paid back to leaseholders for restoration work. */
  leaseholderPaybackUsd: null as number | null,
  /** Total restoration spend, USD. Drives the jobs-supported figure. */
  restorationSpendUsd: null as number | null,
  /** Share of every issuance held back against reversal, as a percent.
      The permanence band's third card stays dark until this is a real
      number from the methodology — a buffer is a promise, and we do not
      make one the page cannot back. */
  bufferPoolPct: null as number | null,
};

/* The reinvestment guarantee. Also stated on the home page, the contact
   page and in the site footer — a revenue commitment that reads two
   different ways in two places is a diligence problem, so move all four
   together. */
export const REINVESTMENT_PCT = 30;
/** Restore · Measure · Verify · Issue · Reinvest — this is the fifth. */
const REINVESTMENT_STEP = 5;

export function BandShell({
  children,
  tone = "pearl",
}: {
  children: React.ReactNode;
  tone?: "pearl" | "abyss";
}) {
  return (
    <div className={`relative ${tone === "pearl" ? "bg-pearl" : "bg-abyss"}`}>
      <TideRule className={tone === "pearl" ? "text-pearl" : "text-abyss"} flip />
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-10">{children}</div>
    </div>
  );
}

/* ---- After “what was lost” ---- */
export function LostBand() {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="The historical record"
        title="The reefs were mined, not fished out"
        intro={
          <p>
            For most of a century, dredges pulled ancient shell from the bottom faster than any
            reef could rebuild it, crushed for roadbed, concrete, and lime. What the industry
            lost wasn&rsquo;t this year&rsquo;s harvest; it was the foundation the next hundred
            harvests needed to settle on.
          </p>
        }
      />
      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <Figure
          src="/images/historic-shell-dredge-1968.jpg"
          alt="Two oystermen hold live oysters taken from a dredge basket, a giant shell dredge working the bay behind them"
          aspect="aspect-[6/7]"
          caption="East Galveston Bay, 1968. Oystermen hold live oysters picked up twenty feet from the cutter blade of the shell dredge behind them- a dredge destroying a 25–30 acre working reef. Houston Post, via Houston Public Library."
        />
        <Figure
          src="/images/historic-shell-roads-map.png"
          alt="Historical map showing roads surfaced with oyster shell"
          aspect="aspect-[6/7]"
          contain
          caption="Shell roads, mapped. Hundreds of millions of cubic yards of reef left the water one barge at a time."
        />
      </div>
      <div className="mt-16">
        <PullQuote
          quote="You cannot restore a reef by leaving it alone. Flat mud does not turn back into reef. Cultch has to go in the water first."
          cite="The premise of everything that follows"
        />
      </div>
      <p className="mt-10 text-xs leading-relaxed text-ink/50">
        Reference: zu Ermgassen, P.S.E., M.D. Spalding, B. Blake, L.D. Coen, B. Dumbauld, S.
        Geiger, J.H. Grabowski, R. Grizzle, M. Luckenbach, K.A. McGraw, B. Rodney, J.L.
        Ruesink, S.P. Powers, and R.D. Brumbaugh. 2012. Historical ecology with real numbers:
        Past and present extent and biomass of an imperiled estuarine ecosystem.{" "}
        <em>Proceedings of the Royal Society B</em> 279 (1742): 3393–3400.
      </p>
    </BandShell>
  );
}

/* ---- After the cultch chapter ---- */
export function WorkBand({ manifest }: { manifest: StoryManifest | null }) {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="How a reef starts"
        title="Cultch, spat and season"
        intro={
          <p>
            Cultch is the substrate oyster larvae attach to when they metamorphose, virtually
            any firm, non-toxic surface can serve. Ours is oyster shell, recycled crushed
            concrete, crushed limestone, and river rock, placed exactly where the chart says it
            should go. Once a larva cements itself to the cultch it is called spat, and from
            there, the reef does the rest of the work itself.
          </p>
        }
      />
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        <Figure
          src="/images/cultch-barge-planting.gif"
          alt="Barge loaded with cultch material for reef planting"
          caption="A cultch barge loaded for planting day."
        />
        <Figure
          src="/images/cultch-concrete.jpg"
          alt="Close-up of crushed recycled concrete used as cultch"
          caption="Recycled crushed concrete. Roadbed going back to the reef it was mined from."
        />
        <Figure
          src="/images/lease-30260/spat-on-rock-hand.jpg"
          alt="A hand holding two pieces of river rock with young oyster spat cemented to them"
          caption="Rock recovered from the lease after bedding: new oyster spat already cemented on and building shell three weeks after planting."
        />
        <Figure
          src="/images/cultch-pile.jpg"
          alt="Pile of oyster shell cultch staged on shore"
          caption="Oysters pulled from a dredge sample."
        />
        <Figure
          src="/images/spat-on-cultch.jpg"
          alt="Juvenile oyster spat attached to a piece of cultch"
          caption="The return on investment, at actual size."
        />
      </div>
      <PerspectiveTiles manifest={manifest} />
    </BandShell>
  );
}

/* ---- The growth story, before the ledger ---- */
export function TrajectoryBand({ manifest }: { manifest: StoryManifest | null }) {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="The trajectory"
        title="Each season, the chart fills in further"
        intro={
          <p>
            Reef at commercial density has grown roughly fivefold across three survey seasons,
            and the credits issued against it have kept pace. These are surveyed acres and
            serialized credits, not projections, and the growth is the reinvestment loop at
            work: each vintage&rsquo;s proceeds put more cultch in the water, and the next
            survey finds more reef.
          </p>
        }
      />
      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <Reveal>
          <SeasonStack manifest={manifest} />
        </Reveal>
        <Reveal delay={90}>
          <VintageBars manifest={manifest} />
        </Reveal>
      </div>

      <Reveal className="mt-16">
        <RunwayBar manifest={manifest} />
        <p className="prose-cv mt-6 max-w-2xl">
          The reef on this chart sits inside water already current within the program. Not every
          acre of a lease becomes reef, bottom, depth and salinity all get a vote, but the room
          to keep growing is measured in ground we already hold, not ground we hope to sign.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:max-w-3xl">
        <ManhattanTile manifest={manifest} />
        <SeasonTile manifest={manifest} />
      </div>
    </BandShell>
  );
}

/* ---- After the survey chapters ---- */
export function ProofBand() {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="Restore · Measure · Verify · Issue · Reinvest"
        title="The methodology is the key to the quality of our product"
        intro={
          <p>
            A carbon credit is only as good as the measurement under it. Ours stand on a survey
            program run from working oyster boats, logged in the field, and checked by
            independent verifiers before a single serial number is issued.
          </p>
        }
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NumberedCard index={1} title="Restore">
          Cultch placements planned on the chart and executed by commercial crews, with every
          track GPS-logged from the barge.
        </NumberedCard>
        <NumberedCard index={2} title="Measure">
          Dredge tows and point samples counted by hand, plus continuous bottom soundings —
          density in oysters per square meter, not estimates.
        </NumberedCard>
        <NumberedCard index={3} title="Verify">
          Independent verifiers repeat our samples on our leases and their results gate ours.
          Disagreement means no credit.
        </NumberedCard>
        <NumberedCard index={4} title="Issue">
          Serialized credits in a public registry, traceable from serial number back to the
          water they came from.
        </NumberedCard>
      </div>

      {/* The eyebrow promises five steps and the cards above show four.
          This is the fifth, and it is the one that separates the program
          from a broker, so it gets the weight rather than a paragraph. */}
      <Reveal className="mt-10">
        <div className="rounded-lg border border-verdigris/40 bg-navy p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div>
              <span className="font-display text-sm text-verdigris">
                {String(REINVESTMENT_STEP).padStart(2, "0")}
              </span>
              <p className="mt-3 font-display text-7xl leading-none text-white sm:text-8xl">
                {REINVESTMENT_PCT}%
              </p>
              <p className="story-chart-note mt-3">of net revenue</p>
            </div>
            <div>
              <h3 className="font-display text-2xl text-white sm:text-3xl">
                Reinvest: the loop closes over the side of the boat
              </h3>
              <p className="prose-cv mt-4 !text-mist/85 [&_strong]:!text-white">
                30 percent of net revenue is committed back into cultch. Every
                credit sold buys the shell, limestone and rock for the next season&rsquo;s
                placements, so the next vintage starts on substrate this one paid for. It is
                written into our partnership with the commercial oyster industry, not a line in
                a sustainability report.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-3xl">
        <p className="prose-cv">
          Our tonnage is <strong>net of our own operation</strong>.
          The fuel our boats and barges burn is measured and subtracted before anything is
          credited. If the program didn&rsquo;t come out ahead, the ledger would say so.
        </p>
      </Reveal>

      <div className="mt-16">
        <p className="eyebrow mb-6">One reef site, season over season</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-navy">
                <Image
                  src={`/images/reef-growth-${i}.png`}
                  alt={`Reef growth sequence, stage ${i} of 5`}
                  fill
                  sizes="(min-width: 640px) 20vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </BandShell>
  );
}

/* ---- The durability question, answered before it is asked ---- */
export function PermanenceBand() {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="Permanence"
        title="The carbon stays where we put it"
        intro={
          <p>
            Every biological carbon credit has to answer two questions before a serious buyer
            will touch it: how long does the carbon stay, and what happens when something goes
            wrong. On the Gulf Coast the second question has a name, and it is hurricanes.
          </p>
        }
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <DurabilityCard
            figure="Millennia"
            unit="not decades"
            title="Shell is a mineral, and it gets buried"
            source="Carbon-dated reef cores"
          >
            Reef carbon is stored two ways: organic carbon in the sediment, and inorganic
            carbon locked in shell. As the reef grows, both are buried underneath it. Cores
            taken from historic reefs found carbon buried thousands of years ago still securely
            in the sediment, including under grounds where the living reef above had long
            since been destroyed.
          </DurabilityCard>
        </Reveal>
        <Reveal delay={90}>
          <DurabilityCard
            figure="A storm"
            unit="is the use case"
            title="Reef is what you build against weather"
            source="Reef breakwater monitoring"
          >
            A reef is not exposed to storms the way a plantation is exposed to fire. It
            attenuates wave energy, that is why states build them as living breakwaters, and
            unlike rock or bulkhead it accretes upward instead of settling. The oystermen who
            hold these leases have managed grounds through hurricanes for four generations, and
            still hold them.
          </DurabilityCard>
        </Reveal>
        <Reveal delay={180}>
          {PROVIDED.bufferPoolPct != null ? (
            <DurabilityCard
              figure={`${PROVIDED.bufferPoolPct}%`}
              unit="held in reserve"
              title="A buffer against reversal"
              source="CV Carbon methodology"
            >
              Held back from every issuance and retired against any measured loss, so a reversal
              is covered by the program rather than by the buyer.
            </DurabilityCard>
          ) : (
            <DurabilityCard
              figure="Every season"
              unit="we look again"
              title="A loss would show up in the record"
              source="CV Carbon survey record"
            >
              Credits are issued against reef we measured, not reef we projected, and the same
              bottom is resurveyed season after season. If a year took reef off this coast, it
              would appear as a smaller number in the next survey. The record is built so a bad
              year cannot hide in it.
            </DurabilityCard>
          )}
        </Reveal>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        Carbon-dating and sediment-core evidence summarised on{" "}
        <a href="/science" className="underline underline-offset-2">
          The Science
        </a>
        ; wave attenuation and storm-impact evidence on{" "}
        <a href="/beyond-carbon" className="underline underline-offset-2">
          Beyond Carbon
        </a>
        , with the full literature cited on both.
      </p>
    </BandShell>
  );
}

function DurabilityCard({
  figure,
  unit,
  title,
  source,
  children,
}: {
  figure: string;
  unit: string;
  title: string;
  source: string;
  children: ReactNode;
}) {
  return (
    <article className="h-full rounded-lg border border-navy/10 bg-white p-7">
      <p>
        <span className="font-display text-3xl text-verdigris-600">{figure}</span>
        <span className="ml-2 font-display text-base text-steel">{unit}</span>
      </p>
      <h3 className="mt-5 font-display text-lg text-navy">{title}</h3>
      <div className="prose-cv mt-3 text-[0.9375rem]">{children}</div>
      <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.12em] text-ink/40">{source}</p>
    </article>
  );
}

/* ---- Chapter five's cover page: the case study, before the dive ---- */

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1)}%`;
}

function fmtMonth(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtWindow(window: [string, string] | undefined): string {
  if (!window) return "—";
  const [a, b] = [fmtMonth(window[0]), fmtMonth(window[1])];
  return a === b ? a : `${a} – ${b}`;
}

function CasePanel({
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
      className={`rounded-lg border p-7 ${
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

export function CaseStudyBand({ manifest }: { manifest: CaseStudyManifest }) {
  const { before, after, bedding } = manifest;
  return (
    <BandShell>
      <SectionHeading
        eyebrow="Chapter five: the case study"
        title="One lease, start to finish"
        intro={
          <p>
            The whole argument, told once at full survey resolution. Lease{" "}
            {manifest.lease_number} is {fmtInt(manifest.acres)} acres on{" "}
            {manifest.location || "the water"}, {manifest.county} Parish. We sounded it for
            months before the work, bedded it in one summer window, then sent the survey boat
            back over the same bottom. What follows is that record, plotted where it happened.
          </p>
        }
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <CasePanel
            phase="Before"
            window={fmtWindow(before.window)}
            figure={fmtPct(before.pct_unproductive)}
            unit="unproductive bottom"
          >
            {fmtInt(before.points)} soundings found mud and bare clay bottom, clean, hard,
            and empty. Nothing for an oyster larva to hold.
          </CasePanel>
        </Reveal>
        <Reveal delay={90}>
          <CasePanel
            phase="The work"
            window={fmtWindow(bedding.window)}
            figure={fmtInt(bedding.placements)}
            unit="barge load placements"
            accent
          >
            {bedding.materials.join(" and ")}
            {bedding.short_tons != null
              ? ` — ${fmtInt(bedding.short_tons)} short tons`
              : ""}{" "}
            over the side in one month, every pass GPS-logged from the barge.
          </CasePanel>
        </Reveal>
        <Reveal delay={180}>
          <CasePanel
            phase="After"
            window={fmtWindow(after.window)}
            figure={fmtPct(after.pct_reef)}
            unit="solid reef"
          >
            {fmtInt(after.points)} soundings on the resurvey more than twice the density of
            the first pass and the bottom now rings hard.
          </CasePanel>
        </Reveal>
      </div>

      {!!manifest.media?.length && (
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.media.map((item) => (
            <Figure key={item.src} src={item.src} alt={item.alt} caption={item.caption} />
          ))}
        </div>
      )}

      {manifest.video && (
        <Reveal className="mt-16">
          <figure>
            <div className="overflow-hidden rounded-lg bg-navy">
              {/* Ambient loops run muted; anything with audio keeps controls. */}
              <video
                className="w-full"
                src={manifest.video.src}
                poster={manifest.video.poster}
                controls={!manifest.video.muteLoop}
                autoPlay={!!manifest.video.muteLoop}
                muted={!!manifest.video.muteLoop}
                loop={!!manifest.video.muteLoop}
                playsInline
                preload="metadata"
              />
            </div>
            {manifest.video.caption && (
              <figcaption className="mt-3 text-sm leading-relaxed text-ink/70">
                {manifest.video.caption}
              </figcaption>
            )}
          </figure>
        </Reveal>
      )}
    </BandShell>
  );
}

/* Where the buried shell came from. The lease sits inside a six-year
   satellite record of marsh loss around Adams Bay, and that record is the
   only external evidence in this chapter — everything else is our own
   survey. The mechanism matters and is easy to get backwards: marsh does
   not shelter oysters. It erodes, and what it sheds settles out on the
   lease and buries shell. So the marsh numbers are a sediment-supply
   measure, not a wave-exposure one. */
function MarshBurialPanel({ marsh, buried }: { marsh: SaveMarsh; buried: string }) {
  return (
    <Reveal className="mt-16">
      <div className="rounded-lg border border-navy/10 bg-white/60 p-7 lg:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="eyebrow">Where the buried shell came from</p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">
            2019&ndash;2024 &middot; satellite
          </p>
        </div>

        <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-ink/70">
          {buried} of the 2023 soundings came back buried shell &mdash; reef that is still
          there, under sediment. The sediment has a source. Six years of imagery over the{" "}
          {marsh.aoi_leases} leases around Adams Bay show{" "}
          <strong className="text-navy">{fmtInt(marsh.acres_lost)} acres</strong> of marsh
          converted to open water, about {fmtInt(marsh.acres_per_year)} acres a year. That
          marsh does not simply vanish: as it erodes it moves into the water column and
          settles out, and where it settles on a lease it buries shell.
        </p>

        <dl className="mt-7 grid gap-6 sm:grid-cols-3">
          {[
            { v: `${fmtInt(marsh.acres_lost)}`, u: "acres", l: "marsh lost to open water, 2019–2024" },
            {
              v: `${marsh.pct_marsh_within_500m}%`,
              u: "",
              l: "mean change in marsh within 500 m of a lease",
            },
            {
              v: `${marsh.leases_losing_marsh}`,
              u: `of ${marsh.aoi_leases}`,
              l: "leases with marsh retreating around them",
            },
          ].map((stat) => (
            <div key={stat.l} className="border-l border-steel/30 pl-4">
              <dt className="sr-only">{stat.l}</dt>
              <dd>
                <span className="font-display text-4xl text-navy">{stat.v}</span>
                {stat.u ? <span className="ml-1 font-display text-base text-steel">{stat.u}</span> : null}
                <p className="mt-2 text-xs leading-relaxed text-ink/60">{stat.l}</p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 border-t border-navy/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">
            Four landfalls crossed this coast in six years
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {marsh.storms.map((storm) => (
              <li key={storm.name} className="text-sm">
                <span className="font-display text-base text-navy">{storm.name}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-steel">
                  Cat {storm.cat} &middot; {fmtMonth(storm.date)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-ink/60">
            The steepest single-year drop falls across {marsh.steepest_cause}. But {marsh.chronic.charAt(0).toLowerCase()}
            {marsh.chronic.slice(1)} Subsidence and wave-driven edge erosion grind at the marsh
            continuously; storms punctuate it.
          </p>
        </div>

        <p className="mt-6 max-w-[60ch] text-xs leading-relaxed text-ink/50">
          {marsh.limit} Source: {marsh.source}.
        </p>
      </div>
    </Reveal>
  );
}

/* ---- Bonus chapter (?32024): the field save ---- */
export function FieldSaveBand({ manifest }: { manifest: SaveManifest }) {
  const { before, after, bedding, error_load: err } = manifest;
  return (
    <BandShell>
      <SectionHeading
        eyebrow="Bonus chapter: the field save"
        title="The call from across the river"
        intro={
          <p>
            Every chart in this brief is the same live map our crews steer by, updating as the
            work happens. Lease {manifest.lease_number} is {fmtInt(manifest.acres)} acres on{" "}
            {manifest.location || "the water"}, {manifest.county} Parish. Its leaseholder polled
            and sampled it in June 2023 and found something worth protecting: an island of live reef
            surrounded by buried reef. The leaseholder explained that massive erosion caused by tropical
            storms had buried the lower portions of what was previously highly productive reef. The
            plan for 2025 was to bed cultch around that island - never on it - watching each load
            land against the substrate data in the app. The leaseholder was unable to be present at
            during the work in Adams Bay because he was across the Mississippi restoring reef in
            another leases. He was able to monitor the progress in Adams Bay on the app. even though
            he was on the other side of the Mississippi River.
          </p>
        }
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <CasePanel
            phase="The island"
            window={fmtMonth(before.window[0])}
            figure={fmtPct(before.pct_reef)}
            unit="solid reef"
          >
            {fmtInt(before.points)} soundings mapped live oysters surrounded by mud and
            buried shell. The leaseholder was confident that the areas identified as buried shell
            were primed to bounce back if he could get the fresh cultch material bedded.
          </CasePanel>
        </Reveal>
        <Reveal delay={90}>
          <CasePanel
            phase="The call"
            window={fmtMonth(err?.date ?? bedding.window[0])}
            figure={fmtInt(err?.short_tons)}
            unit="short tons, off target"
            accent
          >
            Watching the chart from Bay Boudreau in St. Bernard Parish, he saw the first barge load
            go down squarely on the poled reef. He called to find out what happened. The captain thought
            he was in the right area until he opened the app, saw the soundings under his hull, and pulled a sample
            dredge. It came up oysters.
          </CasePanel>
        </Reveal>
        <Reveal delay={180}>
          <CasePanel
            phase="The resurvey"
            window={fmtWindow(after.window)}
            figure={fmtPct(after.pct_reef)}
            unit="solid reef"
          >
            The remaining {fmtInt(bedding.placements - 1)} barge load placements went onto
            the areas on the chart identified as buried reef. The repolling effort
            found the island grown into {fmtPct(after.pct_reef)} of the
            lease — up from {fmtPct(before.pct_reef)}.
          </CasePanel>
        </Reveal>
      </div>

      {manifest.marsh ? (
        <MarshBurialPanel
          marsh={manifest.marsh}
          buried={fmtPct(
            before.points ? (100 * (before.classes.buried ?? 0)) / before.points : null,
          )}
        />
      ) : null}

      <Reveal className="mt-16">
        <PullQuote
          quote="No inspection flight, no season-end audit — a leaseholder on vacation, watching his own bottom in real time. The mistake was on the chart the moment it happened, and it lasted exactly one phone call."
          cite={`Lease ${manifest.lease_number} · ${manifest.location} · CV Carbon Field`}
        />
      </Reveal>
    </BandShell>
  );
}

/* ---- The buying case: what rides along with the ton ---- */
export function CoBenefitsBand({ manifest }: { manifest: StoryManifest | null }) {
  const s = manifest?.stats;

  /* Reef gained across the surveyed seasons. Deliberately the INCREASE,
     not the standing total — we only claim what the program added. */
  const byYear = s?.css_by_year ?? [];
  const acresGained =
    byYear.length >= 2
      ? byYear[byYear.length - 1].low_acres +
        byYear[byYear.length - 1].med_acres +
        byYear[byYear.length - 1].high_acres -
        (byYear[0].low_acres + byYear[0].med_acres + byYear[0].high_acres)
      : null;

  const jobs =
    PROVIDED.restorationSpendUsd != null
      ? (PROVIDED.restorationSpendUsd / 1_000_000) * JOBS_PER_MILLION
      : null;

  return (
    <BandShell>
      <SectionHeading
        eyebrow="Why this ton and not another"
        title="The carbon is the means. The reef is the point."
        intro={
          <p>
            A ton of CO₂e is the same molecule wherever it comes from. What differs is
            everything it drags along with it. This one buys hard bottom on the American Gulf
            Coast and the fishery, the shoreline, and the working fleet that come with it.
          </p>
        }
      />

      {/* The habitat argument under the whole program, from the paper
          that inspired it: a NOAA-funded synthesis of every production
          study from Texas to Cape Cod. House rule — this panel claims
          food-web production only, never carbon; the ledger band makes
          the carbon claim on its own measured numbers. */}
      <Reveal className="mt-14">
        <div className="rounded-lg border border-navy/10 bg-white p-8 sm:p-10">
          <p className="eyebrow">We follow the science</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center">
            <div>
              <h3 className="font-display text-2xl text-navy sm:text-3xl">
                Why reef, of all habitats
              </h3>
              <div className="prose-cv mt-4 text-[0.9375rem]">
                <p>
                  For a century, estuary conservation favored marsh and seagrass — habitats
                  whose worth stands visibly in plants above the waterline. Then a
                  NOAA-funded synthesis pulled every production study from Texas to Cape Cod
                  and measured up the food chain instead of trusting the view from the
                  surface. The overlooked habitat won.
                </p>
                <p>
                  That synthesis closes by recommending the oyster be treated as habitat,
                  not just a commodity. This program is that recommendation with a purchase
                  order behind it: build the hard bottom, and the estuary does the rest.
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="border-l border-navy/15 pl-4">
                <span className="font-display text-3xl text-verdigris-600">4–10×</span>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  the food-web production of any other estuarine habitat, acre for acre —
                  marsh, seagrass, or open flat
                </p>
              </div>
              <div className="border-l border-navy/15 pl-4">
                <span className="font-display text-3xl text-verdigris-600">~200×</span>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  the animal production at the filter-feeder level — the work of stable hard
                  bottom, which is exactly what cultch rebuilds
                </p>
              </div>
              <div className="border-l border-navy/15 pl-4">
                <span className="font-display text-3xl text-verdigris-600">5×</span>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  more animal production than the reef&rsquo;s own plants fix — the tide
                  delivers the estuary&rsquo;s plankton, so one acre harvests many
                </p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[0.6875rem] uppercase tracking-[0.12em] text-ink/40">
            Peterson, Wong, Piehler, Grabowski, Twilley &amp; Fonseca — NOAA-funded synthesis,
            Laguna Madre TX to Cape Cod MA · full literature on{" "}
            <a href="/beyond-carbon" className="underline underline-offset-2">
              Beyond Carbon
            </a>
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BenefitCard
          figure={`${fmtInt(Math.round(FISH_LB_PER_ACRE_YEAR))} lb`}
          unit="per acre, every year"
          title="A fishery, not just a habitat"
          source="Peterson et al., 2003"
        >
          Added fish and crustacean production on restored reef, shrimp, blue crab, speckled
          trout, red drum, flounder. It recurs annually for as long as the reef lives.
        </BenefitCard>

        <BenefitCard figure="~50%" unit="less shoreline erosion" title="A breakwater that grows" source="LSU AgCenter monitoring">
          Measured behind restored Louisiana reefs. Unlike rock or bulkhead, reef builds itself
          higher over time instead of settling and needing replacement.
        </BenefitCard>

        <BenefitCard
          figure={jobs != null ? fmtInt(Math.round(jobs)) : `${fmtInt(s?.entities_enrolled)}`}
          unit={jobs != null ? "jobs supported" : "family oyster businesses"}
          title="Money that lands on the dock"
          source={jobs != null ? "Hall & DeAngelis, 2022" : "CV Carbon program records"}
        >
          The work is done by commercial oystermen on their own leases, in their own boats.
          Thirty percent of net revenue goes back into the water and for a crew four
          generations deep, that is what keeps the next one on the water.
        </BenefitCard>

        <BenefitCard
          figure={acresGained != null ? fmtCompact(acresGained) : "—"}
          unit="acres gained, 3 seasons"
          title="Additional by construction"
          source="CV Carbon survey record"
        >
          Flat mud does not spontaneously become reef. Without the cultch there is no substrate,
          no settlement, and no carbon the counterfactual is visible on the seafloor.
        </BenefitCard>
      </div>

      <Reveal className="mt-14">
        <div className="rounded-lg border border-navy/10 bg-white p-8">
          <p className="eyebrow">The due-diligence questions</p>
          <p className="prose-cv mt-3 max-w-2xl">
            Worth asking anyone who sells you carbon, not just us. Our answers are on the
            record below — the questions are yours to keep for the next seller who calls.
          </p>
          <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[

              [
                "How is it measured?",
                "Hand-counted oyster density on a geolocated survey grid, not remote-sensed estimation or a growth model.",
              ],
              [
                "Who checks it?",
                "Independent third-party verifiers resample our leases. Their numbers gate ours; disagreement means no credit issues.",
              ],
              [
                "Is it net?",
                "Yes. Our own fuel, equipment emissions, and natural processes are measured and subtracted before a credit exists.",
              ],
              [
                "Can I trace one?",
                "Every credit carries a serial encoding vintage, area, and sequence, resolvable in the public registry.",
              ],
              [
                "How long does it stay?",
                "Shell is a mineral and the sediment under a reef keeps burying it. Cores from historic reefs date the buried carbon in millennia, not decades.",
              ],
              [
                "What about a hurricane?",
                "Reefs are built as breakwaters. They absorb storm energy and accrete upward rather than settling. And every season's resurvey would show a loss rather than assume it away.",
              ],
              [
                "How often is it resurveyed?",
                "Every season. The record behind this chart spans four consecutive survey years and the fleet is on the water nearly every day in between.",
              ],
              [
                "Why this and not an engineered removal?",
                "No energy plant to build, no land taken from another use. The fleet, the leases, and the docks already exist.",
              ],
              [
                "What if I want to see it?",
                "The leases are working water. We will take you out on them.",
              ],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="font-display text-lg text-navy">{q}</dt>
                <dd className="prose-cv mt-2 text-[0.9375rem]">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        Ecosystem-service factors from Peterson, Grabowski &amp; Powers (2003) and Grabowski et
        al. (2012); Gulf-specific evidence per Warnell et al. (2020), Duke University. Job
        intensity per Hall &amp; DeAngelis (2022). Full literature cited on{" "}
        <a href="/beyond-carbon" className="underline underline-offset-2">
          Beyond Carbon
        </a>
        .
      </p>
    </BandShell>
  );
}

function BenefitCard({
  figure,
  unit,
  title,
  source,
  children,
}: {
  figure: string;
  unit: string;
  title: string;
  source: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <article className="h-full rounded-lg border border-navy/10 bg-white p-7">
        <span className="font-display text-3xl text-verdigris-600">{figure}</span>
        <p className="story-note-ink mt-1">{unit}</p>
        <h3 className="mt-5 font-display text-lg text-navy">{title}</h3>
        <div className="prose-cv mt-3 text-[0.9375rem]">{children}</div>
        <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.12em] text-ink/40">{source}</p>
      </article>
    </Reveal>
  );
}

/* ---- The accounting band, dark ---- */
export function CreditsBand({
  manifest,
  cssTiers = null,
  counties = null,
  construction = null,
}: {
  manifest: StoryManifest | null;
  cssTiers?: StoryFeatureCollection | null;
  counties?: StoryFeatureCollection | null;
  construction?: ConstructionManifest | null;
}) {
  const s = manifest?.stats;
  return (
    <BandShell tone="abyss">
      <SectionHeading
        tone="light"
        eyebrow="The ledger"
        title="Carbon, accounted for in public"
        intro={
          <p>
            Every credit is serialized, every serial is looked up in a public registry, and the
            reef it came from is on this chart. This is what the program has put on the books.
          </p>
        }
      />
      <div className="mt-10 -mx-6 lg:-mx-10">
        <StatBand
          stats={[
            {
              value: fmtInt(s?.net_mt_total),
              unit: "MT CO₂e",
              label: "Net carbon stored after subtracting our own operational emissions",
            },
            {
              value: fmtInt(s?.credits?.total ?? s?.credits?.issued),
              label: "Serialized credits issued to the public registry",
            },
            {
              value: fmtInt(s?.leases_in_program),
              label: "Oyster leases enrolled in the program",
            },
            {
              value: `${fmtInt(s?.entities_enrolled)} / ${fmtInt(s?.states)}`,
              label: "Participating oyster businesses / states",
            },
          ]}
        />
      </div>

      {cssTiers?.features?.length ? (
        <Reveal className="mt-16">
          <p className="eyebrow text-steel-400">The ledger, year by year</p>
          <p className="prose-cv mt-4 max-w-2xl !text-mist/80">
            Every vintage on the books, both coasts, one scale. The lit water is the reef
            that season&rsquo;s survey found at commercial density; the count beside it is
            the credits serialized against that water. Set any year against the next and the
            growth is simply the chart filling in.
          </p>
          <div className="mt-8">
            <YearBoard manifest={manifest} cssTiers={cssTiers} counties={counties} />
          </div>
        </Reveal>
      ) : null}

      {s?.css_by_year?.length ? (
        <Reveal className="mt-16">
          <p className="eyebrow text-steel-400">How the footprint grew</p>
          <p className="prose-cv mt-4 max-w-2xl !text-mist/80">
            How much reef is on the books, and how much of it is new? Each bar is a
            season&rsquo;s surveyed footprint at commercial density. Solid is the acreage that
            season added; the outline carried over from the year before.
          </p>
          <div className="mt-8 max-w-xl">
            <GrowthBars manifest={manifest} />
          </div>
        </Reveal>
      ) : null}

      {construction?.by_year?.length ? (
        <Reveal className="mt-16">
          <p className="eyebrow text-steel-400">Built and rebuilt</p>
          <p className="prose-cv mt-4 max-w-2xl !text-mist/80">
            The construction ledger. Every bedding run is GPS-logged from the barge; buffer
            the tracks to the spread of the cultch and the year&rsquo;s work becomes an
            acreage — new reef where the bottom was bare, restored reef where old bottom got
            fresh shell.
          </p>
          <div className="mt-8 max-w-xl">
            <ConstructionBars construction={construction} />
          </div>
        </Reveal>
      ) : null}

      <Reveal className="mt-16">
        <p className="eyebrow text-steel-400">Where the number comes from</p>
        <p className="prose-cv mt-4 max-w-2xl !text-mist/80">
          Everything our boats, barges, and equipment
          emit doing this work, plus all natural processes that would limit or re-emit carbon are measured and taken off the top before a credit exists.
        </p>
        <div className="mt-8">
          <NetWaterfall manifest={manifest} />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <EquivalentsStrip manifest={manifest} />
      </Reveal>

      {PROVIDED.leaseholderPaybackUsd != null && (
        <Reveal className="mt-12">
          <p className="prose-cv max-w-3xl text-mist/80">
            <strong className="text-white">
              ${fmtCompact(PROVIDED.leaseholderPaybackUsd)}
            </strong>{" "}
            has gone back to leaseholders for restoration work on their own grounds. The
            economics of the program run through the working fleet, not around it.
          </p>
        </Reveal>
      )}

      <Reveal className="mt-14">
        <div className="flex flex-col gap-6 rounded-lg border border-white/10 bg-navy/60 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-steel-400">Anatomy of a serial</p>
            <p className="mt-3 font-display text-2xl text-white">
              CV · <span className="text-steel-400">vintage</span> ·{" "}
              <span className="text-steel-400">area</span> ·{" "}
              <span className="text-steel-400">sequence</span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-mist/70">
              Year it was grown, the water it was grown in, and its place in the issuance —
              every credit answers for itself.
            </p>
          </div>
          <a
            href="https://portal.cvcarbon.eco/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-verdigris px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-verdigris-600"
          >
            Look one up
          </a>
        </div>
      </Reveal>
    </BandShell>
  );
}
