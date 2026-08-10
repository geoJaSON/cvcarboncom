"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { BandShell } from "./bands";
import type { SequenceFrame, SequenceManifest } from "./use-story-data";

/* ------------------------------------------------------------------
   Same place, different day — a photo sequence the reader runs by
   hand. A row of stills asks the visitor to assemble the change
   themselves; scrubbed, one frame dissolving into the next does that
   work for them.

   Deliberately generic: the frames, their labels and the band's own
   copy all come from public/data/story/sequence.json, so pointing this
   at a new set of photographs is a data edit, not a code change. No
   file, no band — same contract as the gallery and the case study.
   ------------------------------------------------------------------ */

const ADVANCE_MS = 950;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const ASPECT = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
} as const;

export function SequenceBand({ sequence }: { sequence: SequenceManifest }) {
  const frames = (sequence.frames ?? []).filter((frame) => frame?.src);
  if (frames.length === 0) return null;

  return (
    <BandShell>
      <SectionHeading
        eyebrow={sequence.eyebrow ?? "The same water, over time"}
        title={sequence.title}
        intro={sequence.intro ? <p>{sequence.intro}</p> : undefined}
      />
      <Reveal className="mt-14">
        <PhotoScrubber frames={frames} aspect={sequence.aspect ?? "landscape"} />
      </Reveal>
    </BandShell>
  );
}

export function PhotoScrubber({
  frames,
  aspect = "landscape",
}: {
  frames: SequenceFrame[];
  aspect?: keyof typeof ASPECT;
}) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /* Read inside the interval, so it has to be a ref rather than state. */
  const scrubbedRef = useRef(false);

  const count = frames.length;

  useEffect(() => {
    const node = frameRef.current;
    if (!node || count < 2 || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };

    /* Plays itself through once on first view, so a visitor who never
       touches the control still sees the change. */
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (scrubbedRef.current) return;
        let step = 0;
        timerRef.current = setInterval(() => {
          step += 1;
          if (scrubbedRef.current || step > count - 1) {
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
  }, [count]);

  /* Any deliberate input wins over the autoplay, for good. */
  const takeOver = () => {
    scrubbedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const active = frames[Math.min(index, count - 1)];
  const shell = aspect === "portrait" ? "mx-auto max-w-md" : "mx-auto max-w-3xl";

  return (
    <div className={shell}>
      <div
        ref={frameRef}
        className={`relative ${ASPECT[aspect]} overflow-hidden rounded-lg bg-navy`}
      >
        {frames.map((frame, i) => (
          <Image
            key={frame.src}
            src={frame.src}
            alt={frame.alt}
            aria-hidden={i !== index}
            fill
            sizes={aspect === "portrait" ? "(min-width: 640px) 28rem, 90vw" : "(min-width: 1024px) 48rem, 92vw"}
            className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {active.label && (
          <span className="story-chart-note absolute left-3 top-3 rounded-sm bg-abyss/70 px-2 py-1 backdrop-blur-sm">
            {active.label}
          </span>
        )}
      </div>

      {count > 1 && (
        <>
          <input
            type="range"
            min={0}
            max={count - 1}
            step={1}
            value={index}
            onPointerDown={takeOver}
            onKeyDown={takeOver}
            onChange={(event) => {
              takeOver();
              setIndex(Number(event.target.value));
            }}
            className="story-range mt-6 w-full"
            aria-label="Photo sequence position"
            aria-valuetext={active.label || `Frame ${index + 1} of ${count}`}
          />
          <div className="story-range-ticks mt-2" aria-hidden="true">
            {frames.map((frame, i) => (
              <span key={frame.src} data-active={i === index ? "true" : "false"}>
                {frame.label || String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Reserve the caption's height so scrubbing never jogs the page. */}
      <p className="prose-cv mt-5 min-h-[3.25rem] text-[0.9375rem]" aria-live="polite">
        {active.caption}
      </p>
    </div>
  );
}
