import { Reveal } from "@/components/reveal";
import { PullQuote, SectionHeading } from "@/components/ui";
import { BandShell, REINVESTMENT_PCT } from "./bands";
import { fmtInt, type StoryManifest } from "./use-story-data";

/** The operational-project overview from the partnerships brief. */
export function PrologueBand({ manifest }: { manifest: StoryManifest | null }) {
  const s = manifest?.stats;

  return (
    <BandShell>
      <SectionHeading
        eyebrow="Prologue"
        title="Our carbon capture and storage project is operational"
        intro={
          <>
            <p>
              We started the project with only a handful of leases in 2023. Today we have grown
              to {fmtInt(s?.leases_in_program)} leases, across {fmtInt(s?.entities_enrolled)} entities
              and 12 parishes and counties in {fmtInt(s?.states)} states. Between them they have
              put {fmtInt(s?.signed_acres)} acres of bay bottom under survey.
            </p>
            <p>
              Whether your purpose is restoration or harvest, participating in our carbon
              capture and storage project is a new and previously unavailable revenue source
              that supports additional oyster restoration.
            </p>
          </>
        }
      />

      <Reveal className="mt-12">
        <div className="flex flex-col gap-6 rounded-lg border border-verdigris/40 bg-verdigris/5 p-8 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
          <p className="font-display text-5xl leading-none text-verdigris sm:text-6xl">
            {REINVESTMENT_PCT}%
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-ink/80">
            Our source of revenue is the monetization of carbon capture and storage. This
            includes the sale of voluntary carbon offsets. One voluntary carbon offset
            represents 1 net metric ton of carbon dioxide removed from the atmosphere. Our
            agreements are structured as a percentage-based revenue sharing model, with{" "}
            {REINVESTMENT_PCT}% of the revenue going straight back into the water as cultch
            material placements.
          </p>
        </div>
      </Reveal>

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
