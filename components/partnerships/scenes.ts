import type { Scene } from "@/components/story/scenes";

/* ------------------------------------------------------------------
   The partnerships storymap's own camera vocabulary. It shares the
   chart engine with the operations brief and nothing else: no scene,
   no band and no sentence crosses between them, so a copy edit aimed
   at a credit buyer can never quietly change what a leaseholder reads.

   Scenes are handed to MapStage and Hud as a prop. Adding one here
   affects this route alone.
   ------------------------------------------------------------------ */

export type PartnerSceneId = "hero" | "fleet" | "close";

export const PARTNER_SCENES: Record<PartnerSceneId, Scene> = {
  /* Opens on shaded survey rather than empty water. The first claim
     this page makes is that the reader's own bottom is already on the
     chart, so the chart has to be carrying something when it lands.
     It carries the same load as the closing frame - cultch placed and
     reef surveyed, across the whole coast - because that is the fullest
     the data ever looks, and the opener should not be the thinnest.
     What it keeps of its own: a slow pitched orbit, and no counties
     layer, so the flight deck and reticle stay down until the narrative
     has a reason for them. */
  hero: {
    id: "hero",
    view: "overall",
    pitch: 16,
    bearing: -4,
    zoomBias: -0.3,
    flightDuration: 3200,
    orbitDegrees: 5,
    orbitDuration: 3600,
    layers: { graticule: true, bedding: true, css: true },
    cssTiers: ["low", "med", "high"],
  },

  /* Act one - the fleet. The overall extent is the only baked view that
     spans all three states at once, which is the whole point of the
     act: this is a working fleet across a coast, not a pilot in one
     bay. Slow orbit, no targetId, so the reader is looking at the
     spread rather than at any one parish.

     TODO: enrolled lease boundaries belong on this scene. That needs a
     `leases` layer key in MapStage and a lighter bake than the 7.9 MB
     leases.geojson the venture inset draws from. Surveyed reef stands
     in until then.

     Carries the bedding with it, same as the opener and the close: the
     act is about how much is already out there, so the chart should not
     drop a layer between the title and the ask. */
  fleet: {
    id: "fleet",
    view: "overall",
    pitch: 26,
    bearing: 8,
    zoomBias: -0.15,
    flightDuration: 3400,
    orbitDegrees: -10,
    orbitDuration: 5200,
    layers: { graticule: true, counties: true, bedding: true, css: true },
    cssTiers: ["low", "med", "high"],
  },

  /* The ask. Cultch placed and reef surveyed, back together, flat and
     wide - the reader's own future work in the same two colors. */
  close: {
    id: "close",
    view: "overall",
    pitch: 0,
    bearing: 0,
    flightDuration: 3400,
    layers: { graticule: true, counties: true, bedding: true, css: true },
    cssTiers: ["low", "med", "high"],
  },
};
