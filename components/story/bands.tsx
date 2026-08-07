"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Figure, NumberedCard, PullQuote, SectionHeading, StatBand, TideRule } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import {
  EquivalentsStrip,
  ManhattanTile,
  NetWaterfall,
  PerspectiveTiles,
  SeasonStack,
  VintageBars,
} from "./charts";
import {
  fmtCompact,
  fmtInt,
  type CaseStudyManifest,
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
};

/* Peer-reviewed per-unit factors. Peterson and Grabowski are already
   cited on /beyond-carbon; keep the two pages in agreement. */
const FISH_G_PER_M2_YR = 260; // Peterson et al. 2003
const ACRE_M2 = 4046.8564;
const JOBS_PER_MILLION = 18.55; // Hall & DeAngelis 2022
const LB_PER_KG = 2.20462;

function BandShell({
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
            reef could rebuild it — crushed for roadbed, concrete, and lime. What the industry
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
          caption="East Galveston Bay, 1968. Oystermen hold live oysters picked up twenty feet from the cutter blade of the shell dredge behind them — a dredge destroying a 25–30 acre working reef. Houston Post, via Houston Public Library."
        />
        <Figure
          src="/images/historic-shell-roads-map.png"
          alt="Historical map showing roads surfaced with oyster shell"
          contain
          caption="Shell roads, mapped. Hundreds of millions of cubic yards of reef left the water one barge at a time."
        />
      </div>
      <div className="mt-16">
        <PullQuote
          quote="You cannot restore a reef by leaving it alone. Flat mud does not turn back into reef — something hard has to go in the water first."
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
        title="Limestone and shell, spat and season"
        intro={
          <p>
            Cultch — clean shell and crushed limestone — goes over the side exactly where the
            chart says it should. Free-swimming oyster larvae need hard substrate within a
            narrow window; give them that, and the reef does the rest of the work itself.
          </p>
        }
      />
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Figure
          src="/images/cultch-barge.jpg"
          alt="Barge loaded with cultch material for reef planting"
          caption="A cultch barge loaded for planting day."
        />
        <Figure
          src="/images/cultch-pile.jpg"
          alt="Pile of oyster shell cultch staged on shore"
          caption="Staged shell. Every ton is weighed and logged before it moves."
        />
        <Figure
          src="/images/spat-on-cultch.jpg"
          alt="Juvenile oyster spat attached to a piece of cultch"
          caption="Spat on cultch — the return on investment, at actual size."
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
            serialized credits, not projections.
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
      <div className="mt-10 max-w-sm">
        <ManhattanTile manifest={manifest} />
      </div>
    </BandShell>
  );
}

/* ---- After the survey chapters ---- */
export function ProofBand() {
  return (
    <BandShell>
      <SectionHeading
        eyebrow="Restore · Measure · Verify · Issue"
        title="The methodology is the product"
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

      <Reveal className="mx-auto mt-16 max-w-3xl">
        <p className="prose-cv">
          One number worth pausing on: our tonnage is <strong>net of our own operation</strong>.
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
        eyebrow="Chapter five — the case study"
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
            {fmtInt(before.points)} soundings found mud and bare clay bottom — clean, hard,
            and empty. Nothing for an oyster larva to hold.
          </CasePanel>
        </Reveal>
        <Reveal delay={90}>
          <CasePanel
            phase="The work"
            window={fmtWindow(bedding.window)}
            figure={fmtInt(bedding.placements)}
            unit="placements"
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
            {fmtInt(after.points)} soundings on the resurvey — more than twice the density of
            the first pass — and the bottom now rings hard.
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

/* ---- The buying case: what rides along with the ton ---- */
export function CoBenefitsBand({ manifest }: { manifest: StoryManifest | null }) {
  const s = manifest?.stats;

  /* Fish and crustacean production added per restored acre, per year —
     Peterson's 260 g/m²/yr, expressed at a scale a person can hold. */
  const fishLbPerAcreYear = (FISH_G_PER_M2_YR * ACRE_M2) / 1000 * LB_PER_KG;

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
        title="The carbon is the receipt. The reef is the point."
        intro={
          <p>
            A ton of CO₂e is the same molecule wherever it comes from. What differs is
            everything it drags along with it. This one buys hard bottom on the American Gulf
            Coast — and the fishery, the shoreline, and the working fleet that come with it.
          </p>
        }
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BenefitCard
          figure={`${fmtInt(Math.round(fishLbPerAcreYear))} lb`}
          unit="per acre, every year"
          title="A fishery, not just a habitat"
          source="Peterson et al., 2003"
        >
          Added fish and crustacean production on restored reef — shrimp, blue crab, speckled
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
          Thirty percent of gross revenue goes back into the water.
        </BenefitCard>

        <BenefitCard
          figure={acresGained != null ? fmtCompact(acresGained) : "—"}
          unit="acres gained, 3 seasons"
          title="Additional by construction"
          source="CV Carbon survey record"
        >
          Flat mud does not spontaneously become reef. Without the cultch there is no substrate,
          no settlement, and no carbon — the counterfactual is visible on the seafloor.
        </BenefitCard>
      </div>

      <Reveal className="mt-14">
        <div className="rounded-lg border border-navy/10 bg-white p-8">
          <p className="eyebrow">The due-diligence answers</p>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Where is it?",
                "US public water on the Gulf Coast. No jurisdictional risk, no overseas intermediary — you can stand on the boat above it.",
              ],
              [
                "How is it measured?",
                "Hand-counted oyster density on a geolocated survey grid, not remote-sensed estimation or a growth model.",
              ],
              [
                "Who checks it?",
                "Independent verifiers resample our leases. Their numbers gate ours; disagreement means no credit issues.",
              ],
              [
                "Is it net?",
                "Yes. Our own fuel and equipment emissions are measured and subtracted before a credit exists.",
              ],
              [
                "Can I trace one?",
                "Every credit carries a serial encoding vintage, area, and sequence, resolvable in the public registry.",
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
        <p className="story-chart-note mt-1 normal-case tracking-normal text-ink/50">{unit}</p>
        <h3 className="mt-5 font-display text-lg text-navy">{title}</h3>
        <div className="prose-cv mt-3 text-[0.9375rem]">{children}</div>
        <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.12em] text-ink/40">{source}</p>
      </article>
    </Reveal>
  );
}

/* ---- The accounting band, dark ---- */
export function CreditsBand({ manifest }: { manifest: StoryManifest | null }) {
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
              label: "Net carbon stored — after subtracting our own operational emissions",
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

      <Reveal className="mt-16">
        <p className="eyebrow text-steel-400">Where the number comes from</p>
        <p className="prose-cv mt-4 max-w-2xl !text-mist/80">
          The net figure is not the gross figure. Everything our boats, barges, and equipment
          emit doing this work is measured and taken off the top before a credit exists.
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
            has gone back to leaseholders for restoration work on their own grounds — the
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
