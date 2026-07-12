import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

/* ------------------------------------------------------------------ */
/* Tide rule — the site's recurring divider, a shallow wave crest that
   separates a dark band from a light one. `flip` points it upward.     */
/* ------------------------------------------------------------------ */
export function TideRule({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${flip ? "bottom-full" : "top-full"} ${className}`}
    >
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className={`h-8 w-full sm:h-12 ${flip ? "" : "rotate-180"}`}
        fill="currentColor"
      >
        <path d="M0 48h1440V16c-120 16-240 24-360 24S840 32 720 20 480 0 360 4 120 24 0 40z" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page hero — full-bleed photograph under a navy scrim.                */
/* ------------------------------------------------------------------ */
export function PageHero({
  eyebrow,
  title,
  standfirst,
  image,
  alt,
  position = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  standfirst?: string;
  image: string;
  alt: string;
  position?: string;
}) {
  return (
    <section className="relative isolate flex min-h-[62vh] items-end overflow-hidden bg-abyss pb-20 pt-40 sm:min-h-[70vh] sm:pb-28">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="tide-drift -z-10 object-cover"
        style={{ objectPosition: position }}
      />
      {/* Two scrims: a vertical one to seat the text, plus a navy wash to
          pull every photograph toward the brand palette. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-abyss via-abyss/70 to-abyss/25"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-navy/25 mix-blend-multiply" />

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="eyebrow text-steel-400">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {standfirst ? (
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mist/85">{standfirst}</p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section shell + heading                                              */
/* ------------------------------------------------------------------ */
export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-6 py-24 sm:py-28 lg:px-10 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className={`eyebrow ${light ? "text-steel-400" : ""}`}>{eyebrow}</p>
      ) : null}
      <h2
        className={`mt-4 font-display text-3xl leading-tight sm:text-4xl lg:text-[2.75rem] ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <div className={`prose-cv mt-6 ${light ? "text-mist/80" : ""}`}>{intro}</div>
      ) : null}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Statistic band — the load-bearing numbers from the source material.  */
/* ------------------------------------------------------------------ */
export type Stat = { value: string; unit?: string; label: string };

export function StatBand({ stats, className = "" }: { stats: Stat[]; className?: string }) {
  return (
    <div className={`relative bg-navy ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90}>
              <div className="border-l border-steel/40 pl-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="font-display text-4xl text-white lg:text-5xl">{stat.value}</span>
                  {stat.unit ? (
                    <span className="ml-1 font-display text-xl text-steel-400">{stat.unit}</span>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-mist/70">{stat.label}</p>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figure with caption                                                  */
/* ------------------------------------------------------------------ */
export function Figure({
  src,
  alt,
  caption,
  className = "",
  aspect = "aspect-[4/3]",
  contain = false,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  className?: string;
  aspect?: string;
  contain?: boolean;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <div
        className={`relative overflow-hidden rounded-lg ${aspect} ${
          contain ? "bg-nacre" : "bg-navy"
        }`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={contain ? "object-contain p-4" : "object-cover"}
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 border-l-2 border-sand pl-4 text-sm leading-relaxed text-ink/55">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Pull quote                                                           */
/* ------------------------------------------------------------------ */
export function PullQuote({ quote, cite }: { quote: string; cite: string }) {
  return (
    <Reveal>
      <figure className="relative overflow-hidden rounded-lg bg-navy px-8 py-12 sm:px-14 sm:py-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-10 font-display text-[12rem] leading-none text-steel/15"
        >
          &ldquo;
        </span>
        <blockquote className="relative max-w-3xl font-display text-xl leading-relaxed text-white sm:text-2xl">
          {quote}
        </blockquote>
        <figcaption className="relative mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-steel-400">
          {cite}
        </figcaption>
      </figure>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Numbered benefit / process cards                                     */
/* ------------------------------------------------------------------ */
export function NumberedCard({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal delay={(index % 3) * 80}>
      <article className="group h-full rounded-lg border border-navy/10 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-verdigris/40 hover:shadow-[0_18px_40px_-24px_rgba(13,42,68,0.45)]">
        <span className="font-display text-sm text-verdigris">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="mt-4 font-display text-xl text-navy">{title}</h3>
        <div className="prose-cv mt-4 text-[0.9375rem]">{children}</div>
      </article>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */
export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300";
  const styles =
    variant === "primary"
      ? "bg-verdigris text-white hover:bg-verdigris-600"
      : "border border-white/30 text-white hover:border-white hover:bg-white/10";

  return (
    <Link href={href} className={`${base} ${styles} group`}>
      {children}
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
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Next-page pager — carried over from the original site, which chained
   its long-form pages together.                                        */
/* ------------------------------------------------------------------ */
export function NextPage({
  href,
  eyebrow,
  title,
  image,
}: {
  href: string;
  eyebrow: string;
  title: string;
  image: string;
}) {
  return (
    <Link href={href} className="group relative isolate block overflow-hidden bg-abyss">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover opacity-45 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-abyss via-abyss/80 to-abyss/40"
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div>
          <p className="eyebrow text-steel-400">{eyebrow}</p>
          <p className="mt-3 font-display text-3xl text-white sm:text-4xl">{title}</p>
        </div>
        <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          Continue
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition-all duration-300 group-hover:border-verdigris group-hover:bg-verdigris">
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
          </span>
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Literature cited — the original site carried full citations on every
   long-form page; they are a credibility asset, so they are kept.      */
/* ------------------------------------------------------------------ */
export function Citations({
  items,
  additional,
}: {
  items: string[];
  additional?: string[];
}) {
  return (
    <Section className="border-t border-navy/10 bg-nacre/60">
      <Reveal>
        <h2 className="eyebrow">Literature Cited</h2>
        <ol className="mt-8 max-w-4xl space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-4 text-sm leading-relaxed text-ink/65">
              <span className="shrink-0 font-display text-verdigris">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        {additional?.length ? (
          <>
            <h3 className="eyebrow mt-12">Additional Literature Referenced</h3>
            <ul className="mt-6 max-w-4xl space-y-4">
              {additional.map((item, i) => (
                <li key={i} className="border-l-2 border-sand pl-4 text-sm leading-relaxed text-ink/55">
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Reveal>
    </Section>
  );
}
