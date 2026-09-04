"use client";

import dynamic from "next/dynamic";
import "@/components/story/story.css";

/* The chart needs the browser. ssr:false is only legal inside a client
   component, so the boundary lives here rather than in page.tsx. */
const Experience = dynamic(() => import("@/components/partnerships/experience"), {
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

export function PartnershipsClient() {
  return <Experience />;
}
