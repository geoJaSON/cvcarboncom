"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { BandShell } from "./bands";
import type { GalleryManifest, GalleryPhoto } from "./use-story-data";

/* ------------------------------------------------------------------
   The field roll. The narrative bands stay curated; everything else
   from the water lives here in a two-row, horizontally browsable
   contact sheet. Any photo still opens full-screen in the lightbox.
   Feed it via scripts/add_gallery_photos.py; no gallery.json, no band.
   ------------------------------------------------------------------ */

type PhotoShape = "portrait" | "standard" | "wide";

type RailState = {
  canBack: boolean;
  canForward: boolean;
  progress: number;
};

function photoShape(photo: GalleryPhoto): PhotoShape {
  if (!photo.width || !photo.height) return "standard";
  const ratio = photo.width / photo.height;
  if (ratio >= 1.48) return "wide";
  if (ratio <= 0.82) return "portrait";
  return "standard";
}

function columnShape(photos: GalleryPhoto[]): PhotoShape {
  const shapes = photos.map(photoShape);
  if (shapes.includes("wide")) return "wide";
  if (shapes.every((shape) => shape === "portrait")) return "portrait";
  return "standard";
}

export function GalleryBand({ gallery }: { gallery: GalleryManifest }) {
  const photos = (gallery.photos ?? []).filter((photo) => photo?.src);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [railState, setRailState] = useState<RailState>({
    canBack: false,
    canForward: true,
    progress: 0,
  });
  /* The tile that opened the lightbox — focus goes home to it on close.
     Captured explicitly because Safari doesn't focus buttons on click. */
  const openerRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const updateRailState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const progress = maxScroll > 1 ? Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)) : 1;
    const next = {
      canBack: rail.scrollLeft > 2,
      canForward: rail.scrollLeft < maxScroll - 2,
      progress,
    };
    setRailState((current) =>
      current.canBack === next.canBack &&
      current.canForward === next.canForward &&
      Math.abs(current.progress - next.progress) < 0.002
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateRailState();
    rail.addEventListener("scroll", updateRailState, { passive: true });
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateRailState);
    resizeObserver?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", updateRailState);
      resizeObserver?.disconnect();
    };
  }, [photos.length, updateRailState]);

  if (photos.length === 0) return null;
  const columns = Array.from({ length: Math.ceil(photos.length / 2) }, (_, columnIndex) =>
    photos.slice(columnIndex * 2, columnIndex * 2 + 2).map((photo, rowIndex) => ({
      photo,
      index: columnIndex * 2 + rowIndex,
    })),
  );

  const moveRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: direction * Math.max(280, rail.clientWidth * 0.72),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
  };

  const dragRail = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4 && !drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    if (!drag.moved) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

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

      <Reveal className="story-gallery-bleed mt-12" delay={80}>
        <div className="story-gallery-toolbar">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4" aria-hidden="true">
            <span className="story-chart-note text-pearl">01</span>
            <span className="story-gallery-progress">
              <span style={{ transform: `scaleX(${railState.progress})` }} />
            </span>
            <span className="story-chart-note text-pearl">
              {String(photos.length).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <span id="field-gallery-hint" className="sr-only">
              Swipe, drag, or use the gallery arrow buttons to explore every photo.
            </span>
            <span className="story-chart-note hidden sm:inline" aria-hidden="true">
              Drag or swipe to explore
            </span>
            <div className="flex gap-2">
              <RailButton
                label="Previous gallery photos"
                path="M15 5l-7 7 7 7"
                disabled={!railState.canBack}
                onClick={() => moveRail(-1)}
              />
              <RailButton
                label="Next gallery photos"
                path="M9 5l7 7-7 7"
                disabled={!railState.canForward}
                onClick={() => moveRail(1)}
              />
            </div>
          </div>
        </div>

        <div
          className="story-gallery-viewport"
          data-can-back={railState.canBack ? "true" : "false"}
          data-can-forward={railState.canForward ? "true" : "false"}
        >
          <div
            ref={railRef}
            role="region"
            aria-label={`Field gallery, ${photos.length} photos`}
            aria-describedby="field-gallery-hint"
            tabIndex={0}
            className="story-gallery-rail"
            data-dragging={dragging ? "true" : "false"}
            onPointerDown={beginDrag}
            onPointerMove={dragRail}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="story-gallery-track">
              {columns.map((column) => (
                <div
                  key={column[0].photo.src}
                  className={`story-gallery-column${column.length === 1 ? " is-solo" : ""}`}
                  data-shape={columnShape(column.map(({ photo }) => photo))}
                  data-gallery-column
                >
                  {column.map(({ photo, index }) => (
                    <button
                      key={photo.src}
                      type="button"
                      data-shape={photoShape(photo)}
                      onClick={(event) => {
                        if (suppressClickRef.current) return;
                        openerRef.current = event.currentTarget;
                        setLightboxIndex(index);
                      }}
                      className="story-gallery-card group"
                      aria-label={`Open photo ${index + 1} of ${photos.length}: ${photo.alt}`}
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30rem, (min-width: 640px) 27rem, 84vw"
                        draggable={false}
                        className="object-cover transition duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.035] group-hover:saturate-[1.08] group-focus-visible:scale-[1.035]"
                      />
                      <span className="story-gallery-wash" aria-hidden="true" />
                      <span className="story-gallery-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {photo.caption && (
                        <span className="story-gallery-caption" aria-hidden="true">
                          {photo.caption}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

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

function RailButton({
  label,
  path,
  disabled,
  onClick,
}: {
  label: string;
  path: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-mist transition-colors hover:border-verdigris hover:bg-verdigris/15 hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/25 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-verdigris"
    >
      <LightboxIcon path={path} />
    </button>
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

  /* Scroll lock + modality. `overflow: hidden` alone doesn't stop iOS
     Safari touch-scrolling the document, so pin the body at its current
     offset instead — the layout doesn't shift, so the scene observer
     stays quiet. `aria-modal` doesn't actually confine focus or
     screen-reader virtual cursors, so everything outside the portal
     goes inert while we're open. Focus hands back to the opening tile
     on unmount, without yanking the restored scroll position around. */
  useEffect(() => {
    const opener = openerRef.current;
    const dialog = dialogRef.current;
    const scrollY = window.scrollY;
    const { position, top, left, right, width } = document.body.style;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: "0",
      right: "0",
      width: "100%",
    });
    const inerted: HTMLElement[] = [];
    for (const child of document.body.children) {
      if (child instanceof HTMLElement && child !== dialog && !child.contains(dialog) && !child.inert) {
        child.inert = true;
        inerted.push(child);
      }
    }
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      for (const el of inerted) el.inert = false;
      Object.assign(document.body.style, { position, top, left, right, width });
      window.scrollTo(0, scrollY);
      opener?.focus({ preventScroll: true });
    };
    // openerRef/dialogRef are stable; the lock spans the dialog's lifetime.
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
        /* Belt to the inert braces: recapture focus if it ever lands
           outside the dialog (e.g. a click on a non-focusable area
           blurred to <body>), then wrap at the ends. */
        const dialog = dialogRef.current;
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!dialog || !focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (!active || !dialog.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
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
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Ancestor aria-label changes are never announced; this is. */}
      <span className="sr-only" aria-live="polite">
        Photo {index + 1} of {photos.length}: {photo.alt}
      </span>

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="story-chart-note">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="rounded-full p-2.5 text-mist transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-verdigris"
        >
          <LightboxIcon path="M5 5l14 14M19 5L5 19" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 px-4 sm:px-20"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="relative h-full w-full">
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            loading="eager"
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
      onClick={onClick}
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
