"use client";

import dynamic from "next/dynamic";
import "@/components/story/story.css";

/* The chart needs the browser; skip prerendering the whole experience
   and hold the console line while the bundle loads. */
const Experience = dynamic(() => import("@/components/story/experience"), {
  ssr: false,
  loading: () => (
    <div className="story-root flex min-h-screen items-center justify-center">
      <p className="story-chart-note">
        ACQUIRING CHART · CV CARBON SURVEY
        <span className="story-cursor" />
      </p>
    </div>
  ),
});

export function StoryClient({ showVenturePois = false }: { showVenturePois?: boolean }) {
  return <Experience showVenturePois={showVenturePois} />;
}
