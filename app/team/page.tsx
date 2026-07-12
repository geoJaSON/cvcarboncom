import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { NextPage, PageHero, Section, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "Meet the Team",
  description:
    "A fisheries ecologist, a fourth-generation oysterman, and a civil engineer — the people behind CV Carbon's oyster reef restoration and blue carbon work.",
};

/* Headshots are matched to bios by the order they appear in the legacy page. */
const TEAM = [
  {
    name: "Jeff Pinsky",
    role: "Fisheries Ecologist",
    image: "/images/team-1.png",
    credentials: [
      "15 years in ecosystem restoration",
      "NOAA Galveston Laboratory",
      "B.S. Marine Biology, Texas A&M Galveston",
    ],
    bio: (
      <>
        <p>
          Jeff Pinsky is a fisheries ecologist with 15 years of experience designing, implementing,
          and tracking the success of ecosystem restoration projects in both aquatic and marine
          settings. He is an expert in performing ecological assessments, environmental compliance
          tasks, and implementing beneficial projects including oyster reef restoration, wetland
          restoration, seagrass restoration, riverine restoration, and beach and dune restoration.
        </p>
        <p>
          From 2007 to 2023, Jeff worked as a marine biologist for the federal government, including
          a position with the National Oceanic and Atmospheric Administration&rsquo;s Galveston
          Laboratory as a biological technician. He earned a Bachelor of Science in Marine Biology
          from Texas A&amp;M University at Galveston in 2005.
        </p>
      </>
    ),
  },
  {
    name: "Johny Jurisich",
    role: "Fourth-Generation Oysterman",
    image: "/images/team-2.jpg",
    credentials: [
      "30+ years on the water",
      "Founder, Texas Oyster Association",
      "Texas Parks & Wildlife regulatory and restoration groups",
    ],
    bio: (
      <>
        <p>
          Johny Jurisich, a fourth-generation oysterman with roots tracing back to Croatian
          immigrants in the 1800s, is deeply committed to preserving the oyster legacy in the United
          States, particularly in the Gulf. He began his oyster career as a child, eventually
          operating his own vessels at just 15. With over 30 years of experience, he actively
          contributes to oyster harvesting, reef maintenance, spat transplantation, and reef
          construction.
        </p>
        <p>
          Recognizing the need to safeguard oyster ecosystems and the industry, Johny founded the
          Texas Oyster Association, uniting stakeholders for the betterment of the Texas oyster
          industry. He also plays a crucial role in Texas Parks and Wildlife, serving on both the
          regulatory and restoration groups, helping shape decisions concerning the oyster industry
          and restoration efforts in Texas.
        </p>
      </>
    ),
  },
  {
    name: "Lester Jones",
    role: "Civil Engineer",
    image: "/images/team-3.jpg",
    credentials: [
      "20 years in consulting engineering",
      "Founder, ALJ-Lindsey, LLC",
      "Licensed P.E., State of Texas",
    ],
    bio: (
      <>
        <p>
          Lester Jones is a civil engineer with 20 years&rsquo; experience in the consulting
          engineering and real estate development industry. In 2009, after spending a few years in
          the corporate world working for AECOM and Newland Communities, Lester founded ALJ-Lindsey,
          LLC. Under his leadership, ALJ-Lindsey has grown into a mid-size consulting firm providing
          engineering services throughout the south-central United States.
        </p>
        <p>
          Lester graduated from Texas A&amp;M University in 2004 with a degree in civil engineering,
          and is a licensed professional engineer in the State of Texas.
        </p>
      </>
    ),
  },
];

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title={
          <>
            We are the faces
            <br />
            behind these services
          </>
        }
        standfirst="Long appreciated only as a commercial source of oysters, oyster reefs are now acknowledged for the other services they provide — enhancing water quality, stabilizing shorelines. CV Carbon helps develop a framework to assess the value of those services."
        image="/images/bay-sunset.jpg"
        alt="Late light over a Gulf Coast bay"
      />

      <Section className="bg-pearl">
        <SectionHeading
          eyebrow="Meet the Team"
          title="A biologist, an oysterman, and an engineer"
          intro={
            <p>
              Restoration only works where the science, the water, and the build all hold up. The
              three disciplines this company runs on are the three people below.
            </p>
          }
        />

        <div className="mt-16 space-y-6">
          {TEAM.map((member, i) => (
            <Reveal key={member.name} delay={(i % 3) * 90}>
              <article className="group grid overflow-hidden rounded-lg border border-navy/10 bg-white transition-all duration-300 hover:border-verdigris/40 hover:shadow-[0_18px_40px_-24px_rgba(13,42,68,0.45)] lg:grid-cols-[22rem_1fr]">
                <div className="relative aspect-[4/5] overflow-hidden bg-navy lg:aspect-auto lg:min-h-[24rem]">
                  <Image
                    src={member.image}
                    alt={`${member.name}, ${member.role} at CV Carbon`}
                    fill
                    sizes="(min-width: 1024px) 22rem, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-9 sm:p-12">
                  <h3 className="font-display text-3xl text-navy">{member.name}</h3>
                  <p className="eyebrow mt-3">{member.role}</p>

                  <div className="prose-cv mt-7 max-w-2xl">{member.bio}</div>

                  <ul className="mt-8 flex flex-wrap gap-2">
                    {member.credentials.map((credential) => (
                      <li
                        key={credential}
                        className="rounded-full border border-navy/10 bg-nacre/60 px-4 py-1.5 text-xs font-medium text-ink/65"
                      >
                        {credential}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <NextPage
        href="/science"
        eyebrow="Next"
        title="The Science: Oysters Sequester and Store Carbon"
        image="/images/reef-underwater.jpg"
      />
    </>
  );
}
