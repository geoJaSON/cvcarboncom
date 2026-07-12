import Image from "next/image";
import { Reveal } from "@/components/reveal";

export const ESRI_ARTICLE = {
  href: "https://www.esri.com/about/newsroom/blog/how-cv-carbon-fishermen-rebuild-oyster-reefs",
  publication: "Esri Blog",
  title: "Mapping Resilience: How CV Carbon and Oyster Fishermen Are Rebuilding Oyster Reefs",
  author: "Dr. Dawn Wright, Chief Scientist, Esri",
  date: "January 20, 2026",
  dateTime: "2026-01-20",
} as const;

const ArrowOut = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 shrink-0">
    <path
      d="M3 9L9 3M9 3H4M9 3v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Full press card. Used where the GIS/field-survey work is being described,
 * since that is what the article actually covers.
 */
export function FeaturedArticle({
  quote,
  attribution,
  image = "/images/oyster-boats.jpg",
}: {
  quote: string;
  attribution: string;
  image?: string;
}) {
  return (
    <Reveal>
      <a
        href={ESRI_ARTICLE.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative isolate grid overflow-hidden rounded-lg bg-abyss lg:grid-cols-[1fr_0.85fr]"
      >
        <div className="p-9 sm:p-12">
          <p className="eyebrow text-steel-400">In the Press &middot; {ESRI_ARTICLE.publication}</p>

          <blockquote className="mt-7 font-display text-2xl leading-relaxed text-white sm:text-[1.75rem]">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-verdigris">
            {attribution}
          </p>

          <div className="mt-10 border-t border-white/10 pt-7">
            <p className="font-display text-lg leading-snug text-white/90">{ESRI_ARTICLE.title}</p>
            <p className="mt-2 text-sm text-mist/60">
              {ESRI_ARTICLE.author} &middot;{" "}
              <time dateTime={ESRI_ARTICLE.dateTime}>{ESRI_ARTICLE.date}</time>
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors group-hover:text-verdigris">
              Read the article on esri.com
              <ArrowOut />
            </span>
          </div>
        </div>

        <div className="relative min-h-[16rem] lg:min-h-0">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-75"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/40 to-transparent lg:bg-gradient-to-r"
          />
        </div>
      </a>
    </Reveal>
  );
}

/** Compact one-line press band, for the homepage. */
export function PressBand() {
  return (
    <div className="border-y border-navy/10 bg-nacre/60">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <Reveal>
          <a
            href={ESRI_ARTICLE.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
          >
            <p className="flex items-baseline gap-4">
              <span className="eyebrow shrink-0">Featured in</span>
              <span className="font-display text-lg leading-snug text-navy sm:text-xl">
                {ESRI_ARTICLE.title}
              </span>
            </p>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-verdigris transition-colors group-hover:text-verdigris-600">
              Esri Blog
              <ArrowOut />
            </span>
          </a>
        </Reveal>
      </div>
    </div>
  );
}
