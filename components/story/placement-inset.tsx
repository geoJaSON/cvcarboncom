"use client";

import Image from "next/image";

import { fmtInt, type CasePhoto, type SavePhoto } from "./use-story-data";

/* ------------------------------------------------------------------
   The field photo that goes with the feature currently lit on the
   chart - a bedding placement during the replay, a dredge tow on the
   resurvey. The map owns which one is showing - it lights the feature
   and reports the index up through onPhoto - so this component only
   renders, cross-fading as the index changes.

   Provenance is on the card deliberately. Placement photos were matched
   by EXIF capture time and GPS against the barge's own logged track, so
   the distance is a real number and worth showing; tow photos are the
   attachments the crew filed on that sample, so the count and density
   beside them are the sample's own record.
   ------------------------------------------------------------------ */

export type InsetPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
  /** Small-caps line above the caption: "Load 25 · placement 25". */
  label: string;
  /** Provenance line under the caption; omitted when there is none. */
  meta?: string;
};

export function placementInsetPhotos(photos: SavePhoto[] | undefined): InsetPhoto[] {
  return (photos ?? []).map((p) => ({
    src: p.src,
    alt: p.alt,
    caption: p.caption,
    width: p.width,
    height: p.height,
    label: `Load ${p.objectid} · placement ${p.placement_index}`,
    meta:
      typeof p.dist_to_track_m === "number"
        ? `photo GPS ${p.dist_to_track_m} m from this load's logged track`
        : undefined,
  }));
}

export function dredgeInsetPhotos(photos: CasePhoto[] | undefined): InsetPhoto[] {
  return (photos ?? []).map((p) => {
    const tow =
      p.width_in != null && p.length_ft != null
        ? `${fmtInt(p.width_in)} in × ${fmtInt(p.length_ft)} ft tow`
        : p.area_sqft != null
          ? `${fmtInt(p.area_sqft)} sq ft of bottom`
          : null;
    const bits = [
      p.oyster_count != null ? `${fmtInt(p.oyster_count)} oysters in the basket` : null,
      tow,
    ].filter(Boolean);
    return {
      src: p.src,
      alt: p.alt,
      caption: p.caption,
      width: p.width,
      height: p.height,
      label: `Dredge tow ${p.tow} · lease ${p.lease}`,
      meta: bits.length ? bits.join(" · ") : undefined,
    };
  });
}

export function PlacementInset({
  photos,
  index,
  visible,
}: {
  photos: InsetPhoto[] | undefined;
  index: number | null | undefined;
  visible: boolean;
}) {
  /* No card without a lit feature. The transition that matters is
     between photos while the cycle runs, and that comes from the image
     key below; leaving the scene takes the whole HUD with it, so an exit
     fade here would not be seen. */
  const shown = typeof index === "number" ? photos?.[index] : undefined;
  if (!shown || !visible) return null;

  return (
    <figure
      className="story-photo pointer-events-none fixed z-20 overflow-hidden rounded-sm"
      data-on="true"
    >
      <div className="story-photo-frame">
        <Image
          key={shown.src}
          src={shown.src}
          alt={shown.alt}
          width={shown.width ?? 960}
          height={shown.height ?? 1280}
          className="story-photo-img"
          sizes="(max-width: 1024px) 40vw, 280px"
        />
      </div>
      <figcaption className="story-photo-caption">
        <span className="story-photo-label">{shown.label}</span>
        <span className="story-photo-text">{shown.caption}</span>
        {shown.meta && <span className="story-photo-meta">{shown.meta}</span>}
      </figcaption>
    </figure>
  );
}
