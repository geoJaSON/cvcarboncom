import type { Metadata } from "next";
import { PartnershipsClient } from "./partnerships-client";

/* Unlisted leaseholder brief. Reachable only by URL: no nav link, no
   footer link, and barred from indexing in case the link travels
   further than intended. Same posture as /story. */
export const metadata: Metadata = {
  title: "Partnerships Brief",
  description:
    "For oyster leaseholders: what the program measures, what it asks of you, and what it pays back.",
  robots: { index: false, follow: false },
};

export default function PartnershipsPage() {
  return (
    <>
      <noscript>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "36rem", textAlign: "center" }}>
            <h1 className="font-display" style={{ fontSize: "2rem", color: "#fff" }}>
              Your lease is the restoration project.
            </h1>
            <p style={{ marginTop: "1rem", color: "#c5d8e3" }}>
              This brief is an interactive chart and needs JavaScript. To hear it in person, email{" "}
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
      <PartnershipsClient />
    </>
  );
}
