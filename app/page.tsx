import Image from "next/image";
import Link from "next/link";
import { PressBand } from "@/components/featured-article";
import { Reveal } from "@/components/reveal";
import { REGISTRY } from "@/lib/site";
import {
  ButtonLink,
  Figure,
  Section,
  SectionHeading,
  StatBand,
  TideRule,
  type Stat,
} from "@/components/ui";

export const metadata = {
  title: "Successful and Sustainable Oyster Reef Restoration",
  description:
    "CV Carbon partners with the commercial oyster industry to re-establish historic reefs using proceeds from carbon capture credits.",
};

const STATS: Stat[] = [
  {
    value: "85",
    unit: "%",
    label: "of oyster reef habitat has been lost globally over the past 130 years.",
  },
  {
    value: "300",
    unit: "M yd³",
    label: "of oyster shell mined from Texas bays alone between 1912 and 1971.",
  },
  {
    value: "50",
    unit: "gal",
    label: "of water filtered by a single adult oyster in a single day.",
  },
  {
    value: "30",
    unit: "%",
    label: "of gross revenue guaranteed back into the water to expand oyster habitat.",
  },
];

const PILLARS = [
  {
    href: "/science",
    eyebrow: "The Science",
    title: "Oysters sequester and store carbon",
    copy: "Carbon captured in the marine environment reduces atmospheric CO₂ — and reefs lock it away in shell and sediment for millennia.",
    image: "/images/reef-underwater.jpg",
  },
  {
    href: "/history",
    eyebrow: "The History",
    title: "The impact of oyster shell mining",
    copy: "Between 1912 and 1971, industry stripped Texas bays of some 300 million cubic yards of shell. The reefs never recovered on their own.",
    image: "/images/historic-tonging.jpg",
  },
  {
    href: "/restoration",
    eyebrow: "Restoration",
    title: "Rebuilding reef, one lease at a time",
    copy: "Cultch material placed in productive, well-understood waters gives oyster larvae the hard substrate they need to settle and build.",
    image: "/images/cultch-barge.jpg",
  },
  {
    href: "/partnering",
    eyebrow: "Partnering",
    title: "Working with commercial oystermen",
    copy: "Nobody knows these waters better. We account for, verify, and sell the carbon offsets their cultivation practices generate.",
    image: "/images/boat-wheelhouse.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-abyss pb-24 pt-40">
        <Image
          src="/images/reef-waterline.jpg"
          alt="An exposed oyster reef catching low sunlight at the waterline"
          fill
          priority
          sizes="100vw"
          className="tide-drift -z-10 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-abyss via-abyss/75 to-abyss/30"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-navy/30 mix-blend-multiply" />

        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <Reveal>
            <p className="eyebrow text-steel-400">Successful &amp; sustainable restoration</p>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 max-w-4xl font-display text-[2.6rem] leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Restoring the reefs that
              <span className="block text-steel-400">lock away carbon.</span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist/85">
              CV Carbon restores ecosystems by partnering with the commercial oyster industry —
              ensuring sustainability and re-establishing historic reefs using proceeds from carbon
              capture credits.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink href="/science">Explore the science</ButtonLink>
              <ButtonLink href="/partnering" variant="ghost">
                Partner with us
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <TideRule className="text-navy" />
      </section>

      {/* ------------------------------------------------------ Stat band */}
      <StatBand stats={STATS} />

      {/* ------------------------------------------------------ In the press */}
      <PressBand />

      {/* --------------------------------------------------------- Mission */}
      <Section className="relative bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <Reveal>
              <p className="eyebrow">CV Carbon&rsquo;s Mission</p>
              <p className="mt-6 font-display text-2xl leading-[1.4] text-navy sm:text-[1.75rem]">
                The ecological benefits of oyster reefs have long been recognized as playing a major
                role in enhancing water quality and stabilizing shorelines around the world.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-10 border-l-2 border-verdigris pl-6">
                <p className="prose-cv">
                  Adding to their repertoire of impressive ecological deeds, oysters are now
                  understood to be one of the planet&rsquo;s most efficient carbon-sequestering
                  organisms &mdash; both increasing the ecological capacity of their bay systems and
                  locking away carbon in their calcium carbonate shells.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-10">
                <ButtonLink href="/team">Meet the team</ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="space-y-6">
            <Reveal>
              <div className="prose-cv lede">
                <p>
                  Since the Native Americans first settled along the coastline of the Northern Gulf
                  of Mexico, oyster reefs have been revered as a vital source of both human
                  nutrition and marine habitat. The ecological benefits have long been recognized as
                  playing a major role in providing spatial habitat for a multitude of other marine
                  organisms, enhancing water quality, and stabilizing shorelines around the world.
                </p>
                <p>
                  Oysters are considered <strong>ecosystem engineers</strong> because of their
                  remarkable ability to build reefs. Unfortunately, oyster reefs have been identified
                  as the most degraded estuarine habitats in the world; roughly 85% of oyster reef
                  habitat has been lost globally over the past 130 years.
                </p>
                <p>
                  Historic losses are attributable to multiple drivers including the past practice of
                  mining oyster shells for use as aggregate, alterations made to freshwater inflows,
                  and other changes that affected the hydrodynamics of our bays and estuaries. In
                  Louisiana, there was once an oyster reef running along the state&rsquo;s central
                  coastline estimated to have been approximately 100 miles long and 5 to 10 miles
                  wide &mdash; researchers refer to this massive historic reef as the{" "}
                  <strong>Great Barrier Reef of the Americas</strong>, and attribute its decimation
                  to the shell mining operations of the 20th century.
                </p>
                <p>
                  Despite the overwhelming decline, the oyster fishing industry has developed
                  innovative methods to reliably and efficiently recreate this vital habitat in the
                  portions of the bays with suitable salinities, temperatures, and flow. Today, the
                  industry creates and maintains hundreds of thousands of acres of oyster habitat
                  within their leases.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------- Revenue promise */}
      <section className="relative isolate overflow-hidden bg-navy px-6 py-24 lg:px-10">
        <Image
          src="/images/dock-panorama.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-20"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <p className="eyebrow text-steel-400">The Partnership</p>
            <p className="mt-6 font-display text-3xl leading-[1.3] text-white sm:text-4xl">
              CV Carbon has partnered with the oyster industry to account for, verify, and sell the
              carbon offsets generated by cultivation practices within their leases.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <div className="rounded-lg border border-verdigris/30 bg-verdigris/10 p-8 backdrop-blur-sm">
              <span className="font-display text-6xl text-white">30%</span>
              <p className="mt-4 leading-relaxed text-mist/85">
                Our partnership includes a guarantee that 30% of gross revenue from all proceeds is
                put back into the water to improve and expand oyster habitat.
              </p>
              <a
                href={REGISTRY.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:text-verdigris"
              >
                See every credit in the registry
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path
                    d="M3 9L9 3M9 3H4M9 3v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- Pillars */}
      <Section className="bg-pearl">
        <SectionHeading
          eyebrow="Introduction"
          title="Four threads of the same story"
          intro={
            <p>
              The science of carbon capture, the history that razed these reefs, the restoration work
              rebuilding them, and the oystermen who make it possible.
            </p>
          }
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.href} delay={(i % 2) * 100}>
              <Link
                href={pillar.href}
                className="group relative isolate flex h-full min-h-[22rem] flex-col justify-end overflow-hidden rounded-lg bg-abyss p-8"
              >
                <Image
                  src={pillar.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="-z-10 object-cover opacity-55 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-abyss via-abyss/70 to-transparent"
                />
                <p className="eyebrow text-steel-400">{pillar.eyebrow}</p>
                <h3 className="mt-3 font-display text-2xl text-white">{pillar.title}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-mist/75">{pillar.copy}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-verdigris">
                  Read more
                  <svg
                    viewBox="0 0 16 10"
                    aria-hidden="true"
                    className="h-2.5 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path
                      d="M0 5h14M10 1l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Field work */}
      <Section className="bg-nacre/50">
        <div className="grid gap-12 lg:grid-cols-3">
          <Figure
            src="/images/live-oysters-hand.jpg"
            alt="A handful of live oysters pulled from a restored reef"
            aspect="aspect-[4/5]"
            caption="Spat settled on cultch — the beginning of new reef."
          />
          <Figure
            src="/images/spat-on-cultch.jpg"
            alt="Oyster spat settled on cultch material"
            aspect="aspect-[4/5]"
            caption="Live oysters from a working lease."
          />
          <Figure
            src="/images/oyster-boats.jpg"
            alt="Commercial oyster boats working a lease at dawn"
            aspect="aspect-[4/5]"
            caption="The commercial fleet is on the water nearly every day."
          />
        </div>
      </Section>
    </>
  );
}
