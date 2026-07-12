import { Reveal } from "@/components/reveal";
import {
  Citations,
  Figure,
  NextPage,
  PageHero,
  PullQuote,
  Section,
  SectionHeading,
} from "@/components/ui";

export const metadata = {
  title: "The History: The Impact of Oyster Shell Mining",
  description:
    "Between 1912 and 1971, shell mining removed roughly 300 million cubic yards of oyster shell from Texas bays. The reefs never recovered on their own.",
};

const TIMELINE = [
  {
    year: "1880",
    title: "Shovel and wheelbarrow",
    copy: "A recorded account from a shell mining company states that the earliest mining efforts in Texas occurred on July 16, 1880, when a sloop sailed from Galveston Bay to West Bay and began extracting oyster shell from an exposed reef by hand.",
  },
  {
    year: "1905",
    title: "Mechanization arrives",
    copy: "The first account of a mechanical dredge used in the shell mining industry. A hydraulic dredge followed in 1912 — and the scale of extraction changed permanently.",
  },
  {
    year: "1916",
    title: "Shell becomes cement",
    copy: "The first intensive commercial use of oyster shell in Texas: a source of lime for a cement plant constructed in Houston. By 1951, four cement companies were consuming two million cubic yards of shell a year.",
  },
  {
    year: "1941",
    title: "Industrial demand intensifies",
    copy: "After the construction of the Dow magnesium plant, lime produced from roughly a million cubic yards of shell annually was mixed with sea water to form magnesium hydroxide, and ultimately metallic magnesium.",
  },
  {
    year: "1955",
    title: "Shell roads",
    copy: "Of more than ten million cubic yards of shell produced that year, an estimated 65% went to industry and about 28% into road construction — a belt of shell roads extending fifty to seventy miles inland from the coast.",
  },
  {
    year: "1971",
    title: "The tally",
    copy: "Combining figures from several historic reports, shell mining removed approximately 300 million cubic yards of oyster shell from Texas bays between 1912 and 1971. The true volume was likely larger — the reports cover a limited number of companies.",
  },
];

const CITATIONS = [
  "Hensen, M.S. 1993. The History of Galveston Bay Resource Utilization. The Galveston Bay National Estuary Program. Publication GBNEP-39.",
  "Oyster sloops were a traditional sail-powered oyster-dredging boat.",
  "Gaines, F.L. 1965. What the shell industry means to Texas. Report prepared by: Joint Organizations for Business Survival. Texas Avenue Building, Houston, Texas.",
  "Kerr, A. 1967. The Texas reef shell industry. Bureau of Business Research. University of Texas at Austin. Industry Series No. 11.",
  "A. Doran Jr., E. 1965. Shell Roads in Texas. Geographical Review. Apr. 1965, Vol. 55, No. 2, pp. 223–240. B. Kibbe, I.P. 1898. Report on the coast fisheries of Texas. Austin, TX: Von Boeckmann, Moore & Schutze. C. Environmental Impact Assessment of shell dredging in San Antonio Bay, Texas. Vol. 1. Prepared by Texas A&M Research Foundation for the U.S. Army Engineer District, Galveston. September 1973.",
];

export default function HistoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Historical Impact"
        title={
          <>
            The impact of oyster
            <br />
            shell mining
          </>
        }
        standfirst="Also known as the mud shell industry — six decades of extraction that the reefs could not recover from on their own."
        image="/images/historic-dredge-oysterman.jpg"
        alt="Historic photograph of an oystermen holding a basket of live oysters beside a shell dredge"
        position="center 30%"
      />

      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="prose-cv lede">
              <p>
                Shell mining had obvious direct negative impacts on oyster reefs, but there were also
                indirect effects that had long-term consequences and prevented ecological recovery.
              </p>
              <p>
                Multiple accounts from Texas document shell mining that resulted in large pits
                &mdash; sometimes up to <strong>80 feet deep</strong> in a normally shallow-water
                estuary.<sup>1</sup> Unnaturally deep holes in estuaries cause water quality issues
                ranging from low dissolved oxygen to potentially toxic levels of H₂S.
              </p>
              <p>
                Additionally, shell mining has been shown to alter freshwater flows, create
                hydrodynamic changes, increase wave energy, and increase erosion. The damage was not
                only to the reef that was removed, but to the conditions any future reef would need
                in order to grow back.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Figure
              src="/images/historic-dredge-illustration.jpg"
              alt="Illustration of a shell dredge at work, from a 1967 magazine article"
              aspect="aspect-[4/3]"
              caption={
                <>
                  <em>Sports Illustrated</em>, August 14, 1967. Illustration from the article
                  &ldquo;Dredging Up a Texas Squabble&rdquo; by Edwin Shrike.
                </>
              }
            />
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------------- Timeline */}
      <Section className="relative bg-navy">
        <SectionHeading
          tone="light"
          eyebrow="1880 — 1971"
          title="Ninety years of extraction"
          intro={
            <p>
              In his report published in 1965, Edwin Doran, Jr. traced how a shovel-and-wheelbarrow
              operation on an exposed reef became one of the largest sources of industrial aggregate
              on the Gulf Coast.
            </p>
          }
        />

        <ol className="mt-16 space-y-px">
          {TIMELINE.map((entry, i) => (
            <Reveal key={entry.year} delay={(i % 3) * 70}>
              <li className="group grid gap-4 border-t border-white/10 py-8 transition-colors hover:bg-white/[0.03] sm:grid-cols-[7rem_1fr] sm:gap-10 lg:grid-cols-[9rem_16rem_1fr]">
                <span className="font-display text-3xl text-verdigris">{entry.year}</span>
                <h3 className="font-display text-xl text-white">{entry.title}</h3>
                <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-mist/70">
                  {entry.copy}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------ Pull quote */}
      <Section className="bg-nacre/50">
        <PullQuote
          quote="By combining the figures from several historic reports, shell mining activities removed approximately 300 million cubic yards of oyster shell from Texas bays between 1912 and 1971. It is likely that the actual volume was larger, because the reports cited indicate the figures are based on data from a limited number of companies."
          cite="Compiled from Hensen 1993, Gaines 1965, Kerr 1967 & Doran 1965"
        />
      </Section>

      {/* --------------------------------------------------------- Archive */}
      <Section className="bg-pearl">
        <SectionHeading
          eyebrow="From the Archive"
          title="What the industry left behind"
        />

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          <Reveal>
            <Figure
              src="/images/historic-tonging.jpg"
              alt="Historic photograph of two oystermen tonging oysters from a sail-powered boat"
              aspect="aspect-[3/4]"
              caption="Oystermen working from a traditional sail-powered oyster sloop."
            />
          </Reveal>
          <Reveal delay={100}>
            <Figure
              src="/images/historic-schooner.jpg"
              alt="Sepia photograph of a commercial oyster vessel at the dock"
              aspect="aspect-[3/4]"
              caption="The commercial fleet that worked the bays before mechanized dredging."
            />
          </Reveal>
          <Reveal delay={200}>
            <Figure
              src="/images/historic-shell-roads-map.png"
              alt="Map showing the distribution of shell roads across the Texas coast"
              aspect="aspect-[3/4]"
              contain
              caption={
                <>
                  Figure 10 from Gaines (1965): distribution of shell roads as determined from all
                  available evidence. Base maps: Texas Highway Department Districts 12, 13, 16 &amp;
                  20.
                </>
              }
            />
          </Reveal>
        </div>

        <Reveal>
          <p className="mt-14 max-w-3xl border-l-2 border-sand pl-6 text-sm leading-relaxed text-ink/55">
            <strong className="font-semibold text-ink/70">Photo credit, page top:</strong> Oystermen
            in East Galveston Bay of Texas have just picked up this basket of live oysters just 20
            feet from the cutter blade of the giant shell dredge shown in the background. The dredge
            is destroying this 25&ndash;30 acre Hargfield Reef, which produces a livelihood for
            commercial fishermen and provides a prime fishing spot for sports fishermen.
          </p>
        </Reveal>
      </Section>

      <Citations items={CITATIONS} />

      <NextPage
        href="/restoration"
        eyebrow="Next"
        title="Restoring Oyster Habitat"
        image="/images/cultch-barge.jpg"
      />
    </>
  );
}
