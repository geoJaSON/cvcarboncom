import { Reveal } from "@/components/reveal";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { EMAIL, REGISTRY } from "@/lib/site";

export const metadata = {
  title: "Contact Us",
  description:
    "Talk to CV Carbon about purchasing verified blue carbon offsets, or about restoring reef inside your oyster lease.",
};

const ROUTES = [
  {
    title: "Buying carbon offsets",
    copy: "Corporate buyers and brokers looking for verified, independently certified blue carbon from U.S. oyster reef restoration.",
    registry: true,
  },
  {
    title: "Oystermen & leaseholders",
    copy: "If you hold a lease on the Gulf or the East Coast and already place cultch, there is a partnership here for you.",
  },
  {
    title: "Research & press",
    copy: "Questions about our quantification method, the underlying science, or the restoration work itself.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk"
        standfirst="Whether you are buying offsets, working a lease, or checking our arithmetic — start here."
        image="/images/beach-sunset.jpg"
        alt="Sunset over a Gulf Coast beach and pier"
      />

      <Section className="bg-pearl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <Reveal>
              <p className="eyebrow">Get in Touch</p>

              <dl className="mt-8 space-y-8">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
                    Email
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={EMAIL.href}
                      className="font-display text-2xl text-navy transition-colors hover:text-verdigris"
                    >
                      {EMAIL.display}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
                    Where we work
                  </dt>
                  <dd className="prose-cv mt-2">
                    Houston, Texas
                    <br />
                    Operating across the Gulf of Mexico and the U.S. East Coast.
                  </dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-12 rounded-lg border border-verdigris/30 bg-verdigris/5 p-7">
                <p className="font-display text-xl text-navy">
                  30% of gross revenue goes back into the water.
                </p>
                <p className="prose-cv mt-3 text-[0.9375rem]">
                  Every offset purchased directly funds the cultch placement that expands oyster
                  habitat &mdash; guaranteed, in writing, as part of our partnership with the
                  commercial oyster industry.
                </p>
              </div>
            </Reveal>
          </div>

          <div>
            <SectionHeading
              eyebrow="What can we help with?"
              title="Three reasons people reach out"
            />

            <div className="mt-10 space-y-4">
              {ROUTES.map((route, i) => (
                <Reveal key={route.title} delay={i * 90}>
                  <article className="rounded-lg border border-navy/10 bg-white p-7 transition-colors hover:border-verdigris/40">
                    <h3 className="font-display text-xl text-navy">{route.title}</h3>
                    <p className="prose-cv mt-3 text-[0.9375rem]">{route.copy}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <a
                        href={EMAIL.href}
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-verdigris transition-colors hover:text-verdigris-600"
                      >
                        Message us
                        <svg viewBox="0 0 16 10" aria-hidden="true" className="h-2.5 w-4">
                          <path
                            d="M0 5h14M10 1l4 4-4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>

                      {route.registry ? (
                        <a
                          href={REGISTRY.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy transition-colors hover:text-verdigris"
                        >
                          Browse the registry
                          <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
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
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
