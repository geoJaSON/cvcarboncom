"use client";

import Image from "next/image";
import { Figure, NumberedCard, PullQuote, SectionHeading, StatBand, TideRule } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { fmtCompact, fmtInt, type StoryManifest } from "./use-story-data";

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
};

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
          src="/images/historic-tonging.jpg"
          alt="Oystermen tonging for oysters from a small boat, historical photograph"
          caption="Hand tonging on public grounds. The fishery survived the mining era; the bottom under it mostly did not."
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
    </BandShell>
  );
}

/* ---- After the cultch chapter ---- */
export function WorkBand() {
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
