"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { BandShell } from "./bands";
import type { GalleryManifest, GalleryPhoto } from "./use-story-data";

/* ------------------------------------------------------------------
   The field gallery. The narrative bands stay curated; everything
   else from the water lives here — a couple of rows by default, the
   rest behind "show all", any photo full-screen in a lightbox.
   Feed it via scripts/add_gallery_photos.py; no gallery.json, no band.
   ------------------------------------------------------------------ */

const COLLAPSED_COUNT = 8;

export function GalleryBand({ gallery }: { gallery: GalleryManifest }) {
  const photos = (gallery.photos ?? []).filter((photo) => photo?.src);
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  /* The tile that opened the lightbox — focus goes home to it on close.
     Captured explicitly because Safari doesn't focus buttons on click. */
  const openerRef = useRef<HTMLElement | null>(null);

  if (photos.length === 0) return null;
  const shown = expanded ? photos : photos.slice(0, COLLAPSED_COUNT);
  const hidden = photos.length - COLLAPSED_COUNT;

  return (
    <BandShell tone="abyss">
      <SectionHeading
        tone="light"
        eyebrow="The field gallery"
        title="From the water"
        intro={
          <p>
            The chart is the argument; these are the days it is made of. Barges, boats, rock,
            and shell — the program as the crews see it, added to as the seasons turn.
          </p>
        }
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {shown.map((photo, index) => (
          <Reveal key={photo.src} delay={(index % 4) * 60}>
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setLightboxIndex(index);
              }}
              className="group relative block w-full overflow-hidden rounded-lg bg-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verdigris"
              aria-label={`View photo: ${photo.alt}`}
            >
              <span className="relative block aspect-[4/3]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
                />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {hidden > 0 && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/10"
          >
            {expanded ? "Show fewer" : `Show all ${photos.length} photos`}
          </button>
        </div>
      )}

      {lightboxIndex != null && photos[lightboxIndex] && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          openerRef={openerRef}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </BandShell>
  );
}

/* ------------------------------------------------------------------ */
/* lightbox                                                            */
/* ------------------------------------------------------------------ */

function Lightbox({
  photos,
  index,
  openerRef,
  onIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number;
  openerRef: React.RefObject<HTMLElement | null>;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = photos[index];

  /* Scroll lock + initial focus; hand focus back to the opening tile
     when the dialog unmounts. */
  useEffect(() => {
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
    // openerRef is stable; capture happens once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keyboard: Esc closes, arrows page, Tab stays inside the dialog. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndex((index - 1 + photos.length) % photos.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndex((index + 1) % photos.length);
      } else if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, photos.length, onClose, onIndex]);

  /* Portaled to <body>: the story narrative wraps its content in a
     `relative z-10` stacking context, so a fixed dialog rendered inside
     it would paint under the page's fixed chrome (home link at z-30). */
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}: ${photo.alt}`}
      className="fixed inset-0 z-50 flex flex-col bg-abyss"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="story-chart-note">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close gallery"
          className="rounded-full p-2.5 text-mist transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-verdigris"
        >
          <LightboxIcon path="M5 5l14 14M19 5L5 19" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-4 sm:px-20">
        <div
          className="relative h-full w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            priority
            className="object-contain"
          />
        </div>

        <LightboxNav
          label="Previous photo"
          className="left-2 sm:left-5"
          path="M15 5l-7 7 7 7"
          onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
        />
        <LightboxNav
          label="Next photo"
          className="right-2 sm:right-5"
          path="M9 5l7 7-7 7"
          onClick={() => onIndex((index + 1) % photos.length)}
        />
      </div>

      <div className="px-6 py-5">
        {photo.caption && (
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-mist/85">
            {photo.caption}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

function LightboxNav({
  label,
  className,
  path,
  onClick,
}: {
  label: string;
  className: string;
  path: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-navy/70 p-3 text-mist transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-verdigris ${className}`}
    >
      <LightboxIcon path={path} />
    </button>
  );
}

function LightboxIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
