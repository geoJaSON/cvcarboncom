"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { PullQuote, SectionHeading, TideRule } from "@/components/ui";
import { fmtInt, type StoryManifest } from "@/components/story/use-story-data";
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
              We started the project in 2023 with a handful of leases and currently have grown to across{" "}
              {fmtInt(s?.leases_in_program)} leases, across {fmtInt(s?.entities_enrolled)} entities  and {fmtInt(s?.parishes)} parishes and counties
              in {fmtInt(s?.states)} states. Between them they have put{" "}
              {fmtInt(s?.signed_acres)} acres of working bottom under survey.
            </p>
            <p>
              Whether your purpose is restoration or harvest, participating in our carbon capture and storage project is a new and previously unavailable revenue source available that supports additional oyster restoration.
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

/* ---- Act two: the field app ---- */

export function FieldAppBand() {
  return (
    <BandShell tone="abyss">
      <FieldAppShowcase />
    </BandShell>
  );
}
