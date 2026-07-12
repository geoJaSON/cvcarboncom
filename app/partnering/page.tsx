import { ESRI_ARTICLE, FeaturedArticle } from "@/components/featured-article";
import { Reveal } from "@/components/reveal";
import { REGISTRY } from "@/lib/site";
import {
  Citations,
  Figure,
  NextPage,
  PageHero,
  Section,
  SectionHeading,
  StatBand,
  type Stat,
} from "@/components/ui";

export const metadata = {
  title: "Partnering with Oystermen",
  description:
    "Partnering with commercial oystermen to restore reefs within their existing leases — with quantification, monitoring, and independent third-party verification of every carbon offset.",
};

const STATS: Stat[] = [
  {
    value: "1.7",
    unit: "M acres",
    label: "of public oyster areas in Louisiana, alongside 404,000 acres of private leases.",
  },
  {
    value: "99",
    unit: "%",
    label: "of the 2020 commercial oyster harvest came from those private leases.",
  },
  {
    value: "4.2",
    unit: "×",
    label: "more surface area in the public areas — which produced 1% of the harvest.",
  },
  {
    value: "3.5",
    unit: "M lb",
    label: "landed from private leases in 2020, versus 34 thousand pounds from public reefs.",
  },
];

const METHOD = [
  {
    step: "Quantification",
    body: (
      <>
        <p>
          The method for carbon offset quantification was developed using the concepts and procedures
          put forward by the World Resource Institute / World Business Council for Sustainable
          Development&rsquo;s (WRI/WBCSD) report titled{" "}
          <em>GHG Protocol for Project Accounting</em>. The WRI/WBCSD framework for quantifying
          carbon offsets is fully endorsed and recommended by the U.S. Environmental Protection
          Agency.<sup>2,3</sup>
        </p>
        <p>
          The method uses scientifically determined and published rates for carbon sequestration by
          oyster reefs sampled in the United States. The rate of sequestration is affected by several
          factors including depth, sediment composition, and the density of live adult oysters.
          Geospatial survey data is gathered annually to determine the surface area of oyster habitat
          present within the leases; a second round of sampling determines the density of live
          oysters within those surveyed areas.
        </p>
        <p>
          To help gather the vast amount of data needed, we developed{" "}
          <a href={ESRI_ARTICLE.href} target="_blank" rel="noopener noreferrer">
            an app
          </a>{" "}
          that allows commercial oyster fishermen to capture survey data on their mobile devices
          while performing their routine tasks. It precisely documents the location of survey work
          and cultch placement within the leases. Commercial entities also submit their harvest
          records &mdash; most of which were already required by the respective state agencies.
          Entities that provide documentation showing shells are returned to their leases from
          shucking houses receive credit for doing so.
        </p>
        <p>
          The carbon footprint for the activities required to build or expand the reef is then
          calculated and <strong>deducted</strong> from the sequestration to determine the annual net
          carbon offset for each lease. That footprint accounts for the equipment used to load cultch
          onto the boats, the type and number of engines, the capacity of cultch per trip, the number
          of trips, the distance from dock to lease, and the velocity of the vessel.
        </p>
      </>
    ),
  },
  {
    step: "Monitoring",
    body: (
      <p>
        A minimum of annual monitoring and documentation is provided by the commercial oyster
        entities. That said, they are on the water almost every day &mdash; so the amount of
        monitoring is far beyond that of any other restoration project.
      </p>
    ),
  },
  {
    step: "Independent Verification",
    body: (
      <p>
        We are working with the <strong>Carbon Verification Alliance</strong> for independent review,
        confirmation, and certification of all offsets. Carbon Verification Alliance uses a third
        party to perform independent surveys to ensure the data is accurate.
      </p>
    ),
  },
];

const CITATIONS = [
  "LDWF 2021 Stock Assessment Report of the Public Oyster Seed Grounds and Reservations of Louisiana. https://www.wlf.louisiana.gov/assets/Resources/Publications/Stock_Assesments/Oyster/2021-Oyster-Stock-Assessment.pdf",
  "Greenhouse Gas Protocol. https://ghgprotocol.org/",
  "U.S. Environmental Protection Agency — Green Power Markets, Market Instruments. https://www.epa.gov/green-power-markets/market-instruments",
];

export default function PartneringPage() {
  return (
    <>
      <PageHero
        eyebrow="Partnering with Oystermen"
        title={
          <>
            The American commercial
            <br />
            oyster industry
          </>
        }
        standfirst="Nobody knows these waters better. Restoring reefs inside working leases is the surest way to make sure they stay productive."
        image="/images/boat-wheelhouse.jpg"
        alt="The wheelhouse of a commercial oyster boat working on open water"
      />

      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="prose-cv lede">
              <p>
                Partnering with commercial oystermen to restore reefs within their existing leases is
                the ultimate way to ensure that the restored reefs are highly productive and
                sustainable. They know what type of cultch material works best in their leases, they
                know where to place the material, and they know when to place it for optimized spat
                catch.
              </p>
              <p>
                Additionally, they are experts at using adaptive management strategies to recover
                from and minimize the effects of uncontrollable events like hurricanes, floods, and
                droughts.
              </p>
              <p>
                Most states located on the Gulf of Mexico and East Coast have a fishery management
                program that includes leases of otherwise public submerged land for oyster
                cultivation. While there is some variation in naming conventions, license
                requirements, rules, and regulations between the states, the leases generally provide
                the exclusive right to cultivate &mdash; by creating habitat &mdash; harvest, and
                sell shellfish and materials related to the shellfish, like their shells.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Figure
              src="/images/oyster-boats.jpg"
              alt="Commercial oyster boats moored together on the water"
              aspect="aspect-[4/3]"
              caption="The commercial fleet already works these leases every day."
            />
          </Reveal>
        </div>
      </Section>

      <StatBand stats={STATS} />

      {/* ------------------------------------------------ Louisiana proof */}
      <Section className="bg-nacre/50">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Figure
              src="/images/cultch-pile.jpg"
              alt="A large pile of oyster shell cultch ready to be returned to a lease"
              aspect="aspect-[4/3]"
            />
          </Reveal>

          <div>
            <SectionHeading
              eyebrow="The Louisiana Evidence"
              title="Private leases carry the harvest — because leaseholders keep reinvesting"
              intro={
                <>
                  <p>
                    In Louisiana, there are 1.7 million acres of public oyster areas and 404,000
                    acres of private oyster leases managed by leaseholders. The 2021 Stock Assessment
                    reports that in 2020, only 34 thousand pounds of oysters were harvested from
                    public oyster reefs, while private oyster reef landings totaled approximately 3.5
                    million pounds.<sup>1</sup>
                  </p>
                  <p>
                    While the public areas have more than four times (4.2&times;) the surface area of
                    the private leases, the private leases accounted for{" "}
                    <strong>99% of the commercial oyster harvest</strong> in 2020. The forecasts in
                    the assessment predict private leases will continue to dominate in the years to
                    come.
                  </p>
                  <p>
                    The Louisiana Department of Wildlife and Fisheries attributes the success of the
                    private leaseholders to the frequency and extent of cultch material placement by
                    those leaseholders &mdash; who are continually having to re-invest in their
                    reefs.
                  </p>
                </>
              }
            />
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------- Methodology */}
      <Section className="relative bg-navy">
        <SectionHeading
          tone="light"
          eyebrow="Carbon Offsets"
          title="Quantification, monitoring, and independent verification"
          intro={
            <p>
              A credit is only worth what its accounting is worth. Ours is built on the GHG Protocol,
              measured in the field by the people who work these leases, and certified by an
              independent third party.
            </p>
          }
        />

        <div className="mt-16 space-y-px">
          {METHOD.map((entry, i) => (
            <Reveal key={entry.step} delay={i * 90}>
              <div className="grid gap-6 border-t border-white/10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
                <div>
                  <span className="font-display text-sm text-verdigris">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-2xl text-white">{entry.step}</h3>
                </div>
                <div className="prose-cv max-w-3xl text-mist/75">{entry.body}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The registry is the proof of everything claimed above it. */}
        <Reveal delay={120}>
          <a
            href={REGISTRY.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-12 flex flex-col gap-6 rounded-lg border border-verdigris/30 bg-verdigris/10 p-9 transition-colors hover:border-verdigris/60 hover:bg-verdigris/15 sm:flex-row sm:items-center sm:justify-between sm:p-10"
          >
            <div>
              <p className="eyebrow text-verdigris">Every credit, on the record</p>
              <p className="mt-3 font-display text-2xl text-white sm:text-3xl">
                Browse the carbon credit registry
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-mist/75">
                Each offset we issue is listed publicly — quantified against the GHG Protocol,
                monitored on the water, and independently verified.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-3 rounded-full bg-verdigris px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors group-hover:bg-verdigris-600">
              Open the registry
              <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3">
                <path
                  d="M3 9L9 3M9 3H4M9 3v5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------- In the press */}
      <Section className="bg-pearl">
        <FeaturedArticle
          quote="We've logged nearly a million bottom taps. That knowledge used to disappear at the end of the day. Now it's mapped, shared, and used to make better decisions."
          attribution="Jason Jordan, VP of Geospatial Operations, CV Carbon"
          image="/images/boat-wheelhouse.jpg"
        />
      </Section>

      {/* ----------------------------------------------------- Field images */}
      <Section className="bg-nacre/50">
        <div className="grid gap-10 md:grid-cols-3">
          <Reveal>
            <Figure
              src="/images/cultch-barge.jpg"
              alt="A barge and crane placing cultch material into a lease"
              aspect="aspect-[4/5]"
              caption="Cultch placement — the physical act of building reef."
            />
          </Reveal>
          <Reveal delay={100}>
            <Figure
              src="/images/spat-on-cultch.jpg"
              alt="Oyster spat settled onto placed cultch material"
              aspect="aspect-[4/5]"
              caption="Spat catch, optimized by people who know the timing of their own water."
            />
          </Reveal>
          <Reveal delay={200}>
            <Figure
              src="/images/live-oysters-hand.jpg"
              alt="Live market-size oysters held in a hand above the deck"
              aspect="aspect-[4/5]"
              caption="Harvest and habitat, from the same reef."
            />
          </Reveal>
        </div>
      </Section>

      <Citations items={CITATIONS} />

      <NextPage
        href="/beyond-carbon"
        eyebrow="Next"
        title="Beyond Carbon: The Other Benefits of Oyster Reefs"
        image="/images/reef-seagrass.jpg"
      />
    </>
  );
}
