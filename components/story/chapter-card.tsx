"use client";

import { useEffect, useRef, useState } from "react";
import { fmtCompact, fmtInt } from "./use-story-data";

/* ------------------------------------------------------------------
   The card that rides the rail over the chart, and the figures inside
   it. Chart chrome rather than narrative: shared by every storymap on
   the site so a card floating over the map reads the same way whoever
   it is addressed to. The words in it belong to the storymap.
   ------------------------------------------------------------------ */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function ChapterCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="story-card w-full max-w-md rounded-lg p-7 sm:p-9">
      <p className="story-chart-note">{eyebrow}</p>
      <h2 className="mt-4 font-display text-2xl leading-tight text-white sm:text-3xl">{title}</h2>
      <div className="prose-cv mt-5 text-[0.9375rem] !text-mist/85 [&_strong]:!text-white">
        {children}
      </div>
    </div>
  );
}

export function CardStats({
  stats,
}: {
  stats: {
    value?: number | undefined | null;
    /* Set instead of `value` when the answer is a place or a phrase
       rather than a count. Takes the numeral's slot. */
    text?: string;
    label: string;
    compact?: boolean;
    decimals?: number;
    suffix?: string;
  }[];
}) {
  return (
    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-t border-white/10 pt-6">
      {stats.map((stat) => (
        <div key={stat.label}>
          {stat.text != null ? (
            /* Same display face as the numerals, stepped down and capped
               in width so a phrase wraps instead of stretching the row. */
            <span className="block max-w-[13rem] font-display text-2xl leading-tight text-white">
              {stat.text}
            </span>
          ) : (
            <CountUp
              value={stat.value}
              compact={stat.compact}
              decimals={stat.decimals}
              suffix={stat.suffix}
            />
          )}
          <p className="story-chart-note mt-1.5 normal-case tracking-normal">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Fraunces numeral that counts up the first time it becomes visible.
    Renders a dash until the snapshot supplies a value. */
export function CountUp({
  value,
  compact = false,
  decimals,
  suffix,
}: {
  value: number | undefined | null;
  compact?: boolean;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || value == null) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
          setProgress(1);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1500);
          setProgress(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const shown = value == null ? null : value * progress;
  const text =
    shown == null
      ? "-"
      : decimals != null
        ? shown.toFixed(decimals)
        : compact
          ? fmtCompact(shown)
          : fmtInt(shown);
  return (
    <span ref={ref} className="font-display text-3xl text-white">
      {text}
      {value != null && suffix ? suffix : null}
    </span>
  );
}
