import { Reveal } from "@/components/reveal";
import {
  Citations,
  Figure,
  NextPage,
  NumberedCard,
  PageHero,
  Section,
  SectionHeading,
  StatBand,
  type Stat,
} from "@/components/ui";

export const metadata = {
  title: "Beyond Carbon: The Other Benefits of Oyster Reefs",
  description:
    "Oyster reefs deliver greater food web services per unit area than any other estuarine habitat — habitat, water quality, shoreline protection, food and recreation.",
};

const STATS: Stat[] = [
  {
    value: "8–9×",
    label:
      "higher net productivity than any other habitat type found in bays and estuaries, proven experimentally.",
  },
  {
    value: "260",
    unit: "g",
    label:
      "of additional fish and large mobile crustacean production created annually by 1 m² of restored reef.",
  },
];

const BENEFITS = [
  {
    title: "Habitat",
    body: (
      <>
        <p>
          Oyster reef provides habitat for numerous fish and decapod crustacean species that mediate
          ecosystem functioning and support vibrant fisheries.<sup>1</sup> In a review of six studies
          containing quantitative measurements of abundances of fish and crustaceans on oyster reefs
          in the southeast United States, Peterson et al. estimated that 1 m² of restored oyster reef
          habitat creates an additional 260g of fish and large mobile crustacean production
          annually.<sup>2</sup>
        </p>
      </>
    ),
  },
  {
    title: "Water Quality",
    body: (
      <>
        <p>
          Oysters improve water quality by reducing turbidity, driving denitrification, increasing
          benthic algal production, and removing bacterial biomass from the water column.
          <sup>3,4,5</sup>
        </p>
        <p>
          They reduce turbidity by removing suspended particles from the water column and by
          reducing wave energies, which decreases the suspension of particles. They remove nitrogen
          in several ways: storing it in their tissues and shells, where it is physically removed
          from the water during harvest; excreting nitrogen-containing waste that is buried in
          sediments; and facilitating denitrification.<sup>6</sup>
        </p>
      </>
    ),
  },
  {
    title: "Improves the Entire Ecosystem",
    body: (
      <p>
        Oyster reefs increase the productivity and health of adjacent habitats like salt marshes, sea
        grass meadows, mud flats, and mangroves.<sup>7</sup>
      </p>
    ),
  },
  {
    title: "Prevents Shoreline Erosion",
    body: (
      <p>
        Reefs attenuate wave energy, which has been shown to reduce or prevent shoreline erosion and
        reduce impacts from coastal storms like hurricanes.<sup>8</sup>
      </p>
    ),
  },
  {
    title: "Commercial Food Source",
    body: (
      <p>
        Oysters are a sustainable protein source for human consumption through commercial harvest
        from leased areas.
      </p>
    ),
  },
  {
    title: "Recreational Opportunities",
    body: (
      <p>
        Oyster reefs provide opportunities for recreational oyster harvest, improved recreational
        fisheries, and wildlife viewing.
      </p>
    ),
  },
];

const CITATIONS = [
  "La Peyre, M.K., D. Aguilar Marshall, L.S. Miller, and A.T. Humphries. 2019. Oyster Reefs in Northern Gulf of Mexico Estuaries Harbor Diverse Fish and Decapod Crustacean Assemblages: A Meta-Synthesis. Front. Mar. Sci. 6:666. doi: 10.3389/fmars.2019.00666",
  "Peterson C.H., J.H. Grabowski, S.P. Powers. 2003. Estimated enhancement of fish production resulting from restoring oyster reef habitat: Quantitative valuation. Marine Ecology Progress Series 264: 249–264.",
  "Newell R.I.E., J.C. Cornwell, Owens M.S. 2002. Influence of simulated bivalve biodeposition and microphytobenthos on sediment nitrogen dynamics: A laboratory study. Limnology and Oceanography 47: 1367–1379.",
  "Piehler M.F., Smyth A.R. 2011. Habitat-specific distinctions in estuarine denitrification affect both ecosystem function and services. Ecosphere 2 (art. 12). doi:10.1890/ES10-00082.1",
  "Cressman K.A., M.H. Posey, M.A. Mallin, L.A. Leonard, T.D. Alphin. 2003. Effects of oyster reefs on water quality in a tidal creek estuary. Journal of Shellfish Research 22: 753–762.",
  "Carmichael, R.H., W. Walton, and H. Clark. 2012. Bivalve-Enhanced Nitrogen Removal from Coastal Estuaries. Canadian Journal of Fisheries and Aquatic Sciences 69(7): 1131–1149.",
  "Newell R.I.E., E.W. Koch. 2004. Modeling seagrass density and distribution in response to changes in turbidity stemming from bivalve filtration and seagrass sediment stabilization. Estuaries 27: 793–806.",
  "Warnell, K., R. Karasik, S. Mason, A. Zhao, S. Sharma, and C. Sandoval. 2020. Evidence Library for Oyster Reef Restoration in the Gulf of Mexico. NI R 20-04b. Durham, NC: Duke University.",
];

const ADDITIONAL = [
  "Grabowski, J.H., and C.H. Peterson. 2007. Restoring Oyster Reefs to Recover Ecosystem Services. In Theoretical Ecology Series: Ecosystem Engineers, K. Cuddington, J.E. Byers, W.G. Wilson and A. Hastings, eds. Amsterdam: Academic Press, 281–298.",
  "Grabowski, J.H., R.D. Brumbaugh, R.F. Conrad, A.G. Keeler, J.J. Opaluch, C.H. Peterson. 2012. “Economic Valuation of Ecosystem Services Provided by Oyster Reefs.” Bioscience; Oxford 62(10): 900–909.",
  "Newell R.I.E. 1988. Ecological changes in Chesapeake Bay: Are they the result of overharvesting the American oyster, Crassostrea virginica? Pages 536–546 in Lynch M.P., Krome E.C., eds. Understanding the Estuary: Advances in Chesapeake Bay Research, vol. 129. Chesapeake Bay Research Consortium.",
];

export default function BeyondCarbonPage() {
  return (
    <>
      <PageHero
        eyebrow="Beyond Carbon"
        title={
          <>
            The other benefits of oysters
            <br />
            reach far beyond carbon
          </>
        }
        standfirst="Oyster reefs deliver greater food web services per unit area than any other estuarine habitat — including salt marsh, sea grass meadows, or tidal flats."
        image="/images/reef-seagrass.jpg"
        alt="An oyster reef surrounded by seagrass in clear shallow water"
      />

      <StatBand stats={STATS} />

      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="prose-cv lede">
              <p>
                Numerous scientific studies show that oysters provide immense services and benefits
                that reach far beyond their incredible ability to capture and store carbon. Oysters
                are <strong>ecosystem engineers</strong> that build biogenic structures which
                propagate dense assemblages of life.
              </p>
              <p>
                Multiple studies have found that oyster reefs deliver greater food web services per
                unit area than any other estuarine habitat, including salt marsh, sea grass meadows,
                or tidal flats. Ecologists use the term <em>productivity</em> as the rate at which
                energy is added to the bodies of a group of organisms in the form of biomass.
              </p>
              <p>
                The net productivity of oyster reefs has been experimentally proven to be at least{" "}
                <strong>eight to nine times higher</strong> than any other habitat type found in bays
                and estuaries.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Figure
              src="/images/reef-mangrove.jpg"
              alt="An oyster reef breaking the water's surface beside a mangrove shoreline"
              aspect="aspect-[4/3]"
              caption="Reefs raise the productivity of every habitat adjacent to them."
            />
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------------- Benefits */}
      <Section className="bg-nacre/50">
        <SectionHeading
          eyebrow="Oyster Reefs"
          title="Six services a reef provides"
          intro={
            <p>
              Every one of these is delivered by the same structure that sequesters the carbon
              &mdash; which is why restoration pays a return no single metric can capture.
            </p>
          }
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <NumberedCard key={benefit.title} index={i + 1} title={benefit.title}>
              {benefit.body}
            </NumberedCard>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Gallery */}
      <Section className="bg-pearl">
        <div className="grid gap-10 md:grid-cols-3">
          <Reveal>
            <Figure
              src="/images/shucked-oyster.jpg"
              alt="A freshly shucked oyster held in hand"
              aspect="aspect-[4/5]"
              caption="A sustainable protein source, harvested from leased areas."
            />
          </Reveal>
          <Reveal delay={100}>
            <Figure
              src="/images/oysters-plate.jpg"
              alt="A plate of raw oysters served on ice with lemon"
              aspect="aspect-[4/5]"
              caption="Commercial harvest keeps the industry — and the restoration — funded."
            />
          </Reveal>
          <Reveal delay={200}>
            <Figure
              src="/images/sunrise-surf.jpg"
              alt="Sunrise over a calm Gulf shoreline"
              aspect="aspect-[4/5]"
              caption="Reefs attenuate wave energy, protecting the shoreline behind them."
            />
          </Reveal>
        </div>
      </Section>

      <Citations items={CITATIONS} additional={ADDITIONAL} />

      <NextPage
        href="/contact"
        eyebrow="Next"
        title="Contact Us"
        image="/images/bay-sunset.jpg"
      />
    </>
  );
}
