import { Reveal } from "@/components/reveal";
import {
  Citations,
  Figure,
  NextPage,
  PageHero,
  PullQuote,
  Section,
  SectionHeading,
  StatBand,
  type Stat,
} from "@/components/ui";

export const metadata = {
  title: "The Science: Oysters Sequester and Store Carbon",
  description:
    "Capturing carbon dioxide in the marine environment reduces atmospheric CO₂. Oyster reefs store both organic and inorganic carbon for millennia.",
};

const STATS: Stat[] = [
  {
    value: "35–48",
    unit: "%",
    label:
      "of all CO₂ emitted from fossil fuels and industrial processes is currently held in the Earth's oceans.",
  },
  {
    value: "50",
    unit: "gal / day",
    label: "of water filtered by one adult oyster, removing suspended particles as it feeds.",
  },
  {
    value: "260",
    unit: "M gal",
    label: "filtered daily by a 130-acre reef at ten adult oysters per square meter.",
  },
  {
    value: "39",
    unit: "plants",
    label: "the number of Houston wastewater treatment plants needed to match that volume.",
  },
];

const CITATIONS = [
  "Sabine, C.L., R.A. Feely, N. Gruber, R.M. Key, K. Lee, J.L. Bullister, R. Wanninkhof, C.S. Wong, D.W.R. Wallace, B. Tilbrook, F.J. Millero, T.H. Peng, A. Kozyr, T. Ono, and A.F. Rios. 2004. The Oceanic Sink for Anthropogenic CO2. Science. Vol. 305.",
  "Hadden, C.S., K.M. Loftis and A. Cherkinsky. 2018. Carbon isotopes (δ13C and Δ14C) in shell carbonate, conchiolin, and soft tissues in eastern oyster (Crassostrea virginica). Radiocarbon, Vol 60, Nr 4, 2018, p 1125–1137. DOI:10.1017/RDC.2018.27.",
  "Wong, C.M., C.H. Peterson, M.F. Piehler. 2011. Evaluating estuarine habitats using secondary production as a proxy for food web support. Mar. Ecol. Prog. Ser. Vol. 440: 11–25, doi: 10.3354/meps09323.",
  "Fodrie, F.J., Rodriguez, A.B., Gittman, R.K., Grabowski, J.H., Lindquist, N.L., Peterson, C.H., Piehler, M.F., Ridge, J.T., 2017. Oyster reefs as carbon sources and sinks. Proc. R. Soc. B Biol. Sci. 284, 20170891.",
  "Hurst, N.R., Locher, B., Steinmuller, H.E., Walters, L.J. and Chambers, L.G. (2022), Organic carbon dynamics and microbial community response to oyster reef restoration. Limnol Oceanogr, 67: 1157–1168. https://doi.org/10.1002/lno.12063",
];

export default function SciencePage() {
  return (
    <>
      <PageHero
        eyebrow="The Science"
        title={
          <>
            Oysters sequester
            <br />
            and store carbon
          </>
        }
        standfirst="Capturing carbon dioxide in the marine environment reduces atmospheric CO₂."
        image="/images/reef-underwater.jpg"
        alt="An oyster reef growing underwater among seagrass in clear water"
      />

      <StatBand stats={STATS} />

      {/* ---------------------------------------------------- The exchange */}
      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="prose-cv lede">
              <p>
                The carbon dioxide emissions from the use of fossil fuels and industrial processes
                enter the Earth&rsquo;s ocean&ndash;atmosphere system, where both the ocean and the
                atmosphere act as reservoirs that are constantly exchanging CO₂.
              </p>
              <p>
                Studies show that between <strong>35 and 48 percent</strong> of the total CO₂
                emissions from the use of fossil fuels and industrial processes &mdash; like
                cement manufacturing &mdash; are currently in the Earth&rsquo;s oceans.
                <sup>1</sup>
              </p>
              <p>
                The process of continual exchange means that unless it is{" "}
                <strong>captured and stored</strong>, CO₂ in the ocean can and will re-enter the
                atmosphere. Sequestration in the marine environment is therefore not a side note to
                atmospheric carbon &mdash; it is the same ledger.
              </p>
            </div>
          </Reveal>

          <div className="space-y-8">
            <Figure
              src="/images/shells-topdown.jpg"
              alt="Oyster shells viewed from above, showing the calcium carbonate structure"
              aspect="aspect-[4/3]"
              caption="Carbon locked into calcium carbonate — an oyster's shell is a carbon store you can hold."
            />
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ Pull quote */}
      <Section className="bg-nacre/50">
        <PullQuote
          quote="A single adult oyster can filter about 50 gallons of water in one day, removing small, suspended particles from the water and improving water quality and clarity. Consider the scale of this operation. A 130-acre oyster reef with 10 adult oysters per square meter will filter approximately 260 million gallons of water in a day. By comparison, it takes 39 wastewater treatment plants in Houston to filter a comparable amount."
          cite="Texas Parks and Wildlife Department"
        />
      </Section>

      {/* --------------------------------------------------------- Capture */}
      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Capture"
              title="Oysters capture carbon"
              intro={
                <>
                  <p>
                    Oysters draw carbon out of the water column in two ways at once. They build
                    calcium carbonate shell &mdash; carbon in mineral form, held in a durable
                    structure. And they raise the ecological capacity of the whole bay system,
                    increasing the steady state of carbon held in the estuary around them.
                    <sup>2,3</sup>
                  </p>
                  <p>
                    Because the ocean and atmosphere exchange CO₂ continuously, carbon that an
                    oyster reef captures and holds is carbon that cannot cycle back into the air.
                  </p>
                </>
              }
            />
          </div>

          <Reveal delay={120}>
            <Figure
              src="/images/shucked-oyster.jpg"
              alt="A shucked oyster held in hand, showing the interior of the shell"
              aspect="aspect-[4/3]"
            />
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Store */}
      <Section className="relative bg-navy">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Figure
              src="/images/shell-pile.jpg"
              alt="A large pile of oyster shell destined to be returned to the water as cultch"
              aspect="aspect-[4/3]"
            />
          </Reveal>

          <div>
            <SectionHeading
              tone="light"
              eyebrow="Store"
              title="Oyster reefs store buried carbon for millennia"
              intro={
                <>
                  <p>
                    Researchers analyzing core samples from restored and natural reefs concluded that
                    both organic and inorganic carbon &mdash; shell &mdash; are stored within and
                    beneath oyster reefs. As the reef grows, shells and organic material become
                    buried in a protective matrix beneath it.
                  </p>
                  <p>
                    Using carbon dating methods on historic reefs, those researchers determined that
                    carbon buried millennia ago by oyster reefs was still securely stored in the
                    sediment.<sup>4,5</sup>
                  </p>
                  <p>
                    This was also true for cores taken from historic areas where live reefs once
                    existed but which are presently degraded, with no live oysters or reef above the
                    mudline &mdash; the carbon stayed put even after the reef above it was gone.
                  </p>
                </>
              }
            />
          </div>
        </div>
      </Section>

      <Citations items={CITATIONS} />

      <NextPage
        href="/history"
        eyebrow="Next"
        title="The History: The Impact of Oyster Shell Mining"
        image="/images/historic-tonging.jpg"
      />
    </>
  );
}
