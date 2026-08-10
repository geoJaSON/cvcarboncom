"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
   One reef site, run forward by hand. The five survey frames used to
   sit in a static row, which asks the reader to assemble the sequence
   themselves; scrubbed, the bottom filling in is the whole argument of
   the page in one gesture.

   It plays itself once when it first scrolls into view so a visitor who
   never touches it still sees the change, then hands control over the
   moment anyone grabs the slider.
   ------------------------------------------------------------------ */

const STAGES = [1, 2, 3, 4, 5] as const;
const ADVANCE_MS = 950;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function ReefScrubber() {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /* Read inside the interval, so it has to be a ref rather than state. */
  const scrubbedRef = useRef(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (scrubbedRef.current) return;
        let step = 0;
        timerRef.current = setInterval(() => {
          step += 1;
          if (scrubbedRef.current || step > STAGES.length - 1) {
            stop();
            return;
          }
          setIndex(step);
        }, ADVANCE_MS);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  /* Any deliberate input wins over the autoplay, for good. */
  const takeOver = () => {
    scrubbedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-center">
      <div>
        <div ref={frameRef} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-navy">
          {STAGES.map((stage, i) => (
            <Image
              key={stage}
              src={`/images/reef-growth-${stage}.png`}
              alt={`Reef growth sequence, stage ${stage} of ${STAGES.length}`}
              aria-hidden={i !== index}
              fill
              sizes="(min-width: 1024px) 21rem, 90vw"
              className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <span className="story-chart-note absolute left-3 top-3 rounded-sm bg-abyss/70 px-2 py-1 backdrop-blur-sm">
            Stage {String(index + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          step={1}
          value={index}
          onPointerDown={takeOver}
          onKeyDown={takeOver}
          onChange={(event) => {
            takeOver();
            setIndex(Number(event.target.value));
          }}
          className="story-range mt-6 w-full"
          aria-label="Reef growth stage"
          aria-valuetext={`Stage ${index + 1} of ${STAGES.length}`}
        />
        <div className="story-range-ticks mt-2" aria-hidden="true">
          {STAGES.map((stage, i) => (
            <span key={stage} data-active={i === index ? "true" : "false"}>
              {String(stage).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-md">
        <p className="prose-cv">
          The same reef site across five survey passes. Drag the scrubber to run it forward —
          the acres, the density tiers, and the tonnage on this page are all counted off bottom
          that changes like this, one season at a time.
        </p>
        <p className="prose-cv mt-4">
          Nothing here is a rendering. Each frame is a place we can take you to, at a set of
          coordinates that is written down.
        </p>
      </div>
    </div>
  );
}
