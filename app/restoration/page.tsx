import { ESRI_ARTICLE } from "@/components/featured-article";
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
  title: "Restoring Oyster Habitat",
  description:
    "Place hard substrate in the right place at the right time, and oysters will colonize it. The challenges are fouling, burial, and timing — and the commercial industry has already solved them.",
};

const STATS: Stat[] = [
  {
    value: "2",
    unit: "weeks",
    label:
      "is all it takes for cultch to become completely fouled — after which there is no opportunity for oyster recruitment.",
  },
  {
    value: "2×",
    unit: "a year",
    label:
      "mass spawning events, in the spring and the fall. Cultch placed at peak spawn yields the most oysters.",
  },
  {
    value: "3–4",
    unit: "weeks",
    label:
      "the age of the spat in the photographs below — shells returned from a shucking house to the lease they came from.",
  },
];

const CULTCH = ["Shells", "Recycled concrete", "River rock", "Limestone"];

const CHALLENGES = [
  {
    title: "Marine fouling",
    body: (
      <>
        <p>
          Fouling is the colonization of the cultch material by organisms other than oysters &mdash;
          algae, tunicates, bryozoans, barnacles &mdash; and it begins as soon as the cultch is
          placed in the water.
        </p>
        <p>
          In as little as <strong>two weeks</strong> the cultch can become completely fouled, covered
          in a biofilm, and there will be no opportunity for oyster recruitment. To achieve optimal
          restoration, cultch placement must occur close to when oysters are spawning and their
          larvae are in the water column.
        </p>
      </>
    ),
  },
  {
    title: "Burial in soft sediment",
    body: (
      <>
        <p>
          Dense materials like limestone, concrete, and rock can sink into soft sediments &mdash; and
          once they are below the mudline they cannot be colonized by oysters.
        </p>
        <p>
          Since the largest expense related to oyster restoration is the cost of the cultch material
          itself, ensuring sediment suitability and incorporating adaptive management into the
          planning process is key to successful restoration.
        </p>
      </>
    ),
  },
];

const CITATIONS = [
  "Wallace, R.K., Waters, P., Rikard, F.S. 2008. Oyster Hatchery Techniques. Southern Regional Aquaculture Center, Publication No. 4301.",
];

export default function RestorationPage() {
  return (
    <>
      <PageHero
        eyebrow="Restoration"
        title={
          <>
            Restoring oyster
            <br />
            habitat
          </>
        }
        standfirst="Place hard substrate in the right place, at the right time, and oysters will begin to colonize it. The historic losses in reef habitat are precisely what make large-scale restoration possible."
        image="/images/cultch-barge.jpg"
        alt="A barge and crane placing cultch material to build new oyster reef"
      />

      {/* ------------------------------------------------------------ Intro */}
      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="prose-cv lede">
              <p>
                The historic losses in reef habitat provide the opportunity for large-scale
                restoration efforts. Fortunately, habitat restoration for the eastern oyster,{" "}
                <em>Crassostrea virginica</em>, is a straightforward process: all you do is place
                hard substrate &mdash; <strong>cultch material</strong> &mdash; in the right place at
                the right time, and oysters will begin to colonize it.
              </p>
              <p>
                Restoration projects face several common challenges, which include marine fouling and
                the rapid burial of cultch in soft sediments. Fortunately, the commercial industry
                has developed effective methods for avoiding and minimizing both.
              </p>
              <p>
                Oyster reef restoration efforts historically lagged far behind progress in other
                estuarine habitats &mdash; salt marshes, seagrass beds, mangroves &mdash; even though
                the cost of restoring oyster reefs, and the value of the ecosystem services derived
                from them, is roughly comparable. Contrary to the traditional view in which oysters
                are valued solely as a fishery commodity, the scientific literature clearly shows
                that oysters provide a host of nonmarket ecosystem services.
              </p>
              <p>
                A century after the onset of steep declines in oyster landings around the United
                States, scientists and managers have finally begun focusing on managing oyster reefs
                as habitat for other species and for a broader array of services, instead of just for
                oyster harvest &mdash; part of a larger trend toward a more holistic, ecosystem-based
                approach to fisheries and ocean management.
              </p>
            </div>
          </Reveal>

          <div className="space-y-10">
            <Reveal delay={120}>
              <Figure
                src="/images/shell-pile.jpg"
                alt="A large stockpile of oyster shell awaiting return to the water as cultch"
                aspect="aspect-[4/3]"
                caption="Shell returned to the water is the raw material of new reef."
              />
            </Reveal>

            <Reveal delay={200}>
              <div className="rounded-lg border border-navy/10 bg-white p-8">
                <p className="eyebrow">Common cultch materials</p>
                <ul className="mt-5 space-y-3">
                  {CULTCH.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 border-b border-navy/5 pb-3 font-display text-lg text-navy last:border-0 last:pb-0"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-verdigris"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <StatBand stats={STATS} />

      {/* -------------------------------------------------------- Challenges */}
      <Section className="bg-nacre/50">
        <SectionHeading
          eyebrow="The Challenges"
          title="Two things will defeat a reef before it starts"
          intro={
            <p>
              Both are solvable, and both are solved the same way &mdash; by people who already know
              the sediment, the salinity, and the timing of their own water.
            </p>
          }
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {CHALLENGES.map((challenge, i) => (
            <NumberedCard key={challenge.title} index={i + 1} title={challenge.title}>
              {challenge.body}
            </NumberedCard>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ Timing */}
      <Section className="relative bg-navy">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <Figure
              src="/images/oyster-lifecycle.png"
              alt="Diagram of the life cycle of the eastern oyster, from fertilized egg through trochophore, veliger and pediveliger larvae to setting, spat, and adult oysters"
              aspect="aspect-[3/4]"
              contain
              caption={
                <span className="text-mist/50">
                  <strong className="font-semibold text-mist/70">Figure 1.</strong> Life cycle of the
                  eastern oyster, <em>Crassostrea virginica</em>. The trochophore and veliger larvae
                  can swim and disperse to seek out favorable conditions. Once suitable conditions
                  are found, the pediveliger larva secretes a concrete-like substance that glues it
                  to the hard substrate. Once attached it is sessile, and grows into an adult
                  oyster.<sup>1</sup>
                </span>
              }
            />
          </Reveal>

          <div>
            <SectionHeading
              tone="light"
              eyebrow="The Timing"
              title="Right place, right time"
              intro={
                <>
                  <p>
                    Placing cultch material during peak spawning is the best way to ensure maximum
                    oyster yield. Mass spawning events usually occur at least twice a year, in the
                    spring and in the fall.
                  </p>
                  <p>
                    To thrive, oysters require specific ranges of{" "}
                    <strong>salinity, temperature, depth, and water flow</strong>. These requirements
                    have been carefully identified through scientific research, modeling, and years
                    of experience on the water.
                  </p>
                  <p>
                    That experience is now being captured as data. Working alongside commercial
                    fishermen, we log bottom conditions, dredge yields, and cultch placement to a
                    shared geospatial map of every lease &mdash; work profiled by Esri&rsquo;s chief
                    scientist in{" "}
                    <a href={ESRI_ARTICLE.href} target="_blank" rel="noopener noreferrer">
                      Mapping Resilience: How CV Carbon and Oyster Fishermen Are Rebuilding Oyster
                      Reefs
                    </a>
                    .
                  </p>
                </>
              }
            />
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------- Growth series */}
      <Section className="bg-pearl">
        <SectionHeading
          eyebrow="Spat on Shell"
          title="Three weeks old, and already building reef"
          intro={
            <p>
              These are shells covered in <strong>spat</strong> &mdash; baby oysters. The shells were
              retrieved from a commercial shucking house and returned to the very oyster lease they
              were harvested from. The oysters growing on them are three to four weeks old.
            </p>
          }
        />

        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n, i) => (
            <Reveal key={n} delay={(i % 5) * 70}>
              <Figure
                src={`/images/reef-growth-${n}.png`}
                alt="Oyster shell carpeted with three-to-four-week-old spat, returned to the lease it was harvested from"
                aspect="aspect-[3/4]"
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Citations items={CITATIONS} />

      <NextPage
        href="/partnering"
        eyebrow="Next"
        title="Partnering with Oystermen"
        image="/images/boat-wheelhouse.jpg"
      />
    </>
  );
}
