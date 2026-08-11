import type { Metadata } from "next";
import { StoryClient } from "./story-client";

/* Unlisted operations brief. Reachable only by URL: no nav link, no
   sitemap, and explicitly barred from indexing in case the link ever
   travels further than intended. */
export const metadata: Metadata = {
  title: "Operations Brief",
  description:
    "A field brief from the water: reef restored, carbon measured, and the survey record behind it.",
  robots: { index: false, follow: false },
};

type StorySearchParams = Record<string, string | string[] | undefined>;

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<StorySearchParams>;
}) {
  const params = await searchParams;
  const showVenturePois = Object.prototype.hasOwnProperty.call(params, "venture");

  return (
    <>
      <noscript>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "36rem", textAlign: "center" }}>
            <h1 className="font-display" style={{ fontSize: "2rem", color: "#fff" }}>
              We are bringing the reefs back!
            </h1>
            <p style={{ marginTop: "1rem", color: "#c5d8e3" }}>
              This brief is an interactive chart and needs JavaScript. For the story in person,
              email{" "}
              <a href="mailto:support@cvcarbon.com" style={{ color: "#2f8a74" }}>
                support@cvcarbon.com
              </a>{" "}
              or visit{" "}
              <a href="/contact" style={{ color: "#2f8a74" }}>
                cvcarbon.eco/contact
              </a>
              .
            </p>
          </div>
        </div>
      </noscript>
      <StoryClient showVenturePois={showVenturePois} />
    </>
  );
}
