"use client";

import Image from "next/image";

import type { SavePhoto } from "./use-story-data";

/* ------------------------------------------------------------------
   The field photo that goes with the placement currently lit on the
   chart. The map owns which one is showing — it lights the track and
   reports the index up through StageState — so this component only
   renders, cross-fading as the index changes.

   Provenance is on the card deliberately. These photos were matched to
   a placement by EXIF capture time and GPS against the barge's own
   logged track, so the distance is a real number and worth showing:
   it is the difference between "a photo of some cultch work" and "the
   photo of this load."
   ------------------------------------------------------------------ */

export function PlacementInset({
  photos,
  index,
  visible,
}: {
  photos: SavePhoto[] | undefined;
  index: number | null | undefined;
  visible: boolean;
}) {
  /* No card without a lit placement. The transition that matters is
     between photos while the cycle runs, and that comes from the image
     key below; leaving the scene takes the whole HUD with it, so an exit
     fade here would not be seen. */
  const shown = typeof index === "number" ? photos?.[index] : undefined;
  if (!shown || !visible) return null;

  return (
    <figure
      className="story-inset pointer-events-none fixed z-20 overflow-hidden rounded-sm"
      data-on="true"
    >
      <div className="story-inset-frame">
        <Image
          key={shown.src}
          src={shown.src}
          alt={shown.alt}
          width={shown.width ?? 960}
          height={shown.height ?? 1280}
          className="story-inset-img"
          sizes="(max-width: 1024px) 40vw, 280px"
        />
      </div>
      <figcaption className="story-inset-caption">
        <span className="story-inset-label">
          Load {shown.objectid} &middot; placement {shown.placement_index}
        </span>
        <span className="story-inset-text">{shown.caption}</span>
        {typeof shown.dist_to_track_m === "number" && (
          <span className="story-inset-meta">
            photo GPS {shown.dist_to_track_m} m from this load&rsquo;s logged track
          </span>
        )}
      </figcaption>
    </figure>
  );
}
