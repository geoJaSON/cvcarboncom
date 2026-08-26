import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server + only the node_modules
  // actually reached. Keeps the runtime image small for the VPS.
  output: "standalone",

  // `next dev` already listens on 0.0.0.0, but Next blocks cross-origin
  // requests to dev-only resources (/_next/*, HMR socket) unless the
  // requesting host is allowlisted here. The subnet wildcard is so a DHCP
  // lease change does not break the link for whoever is reviewing on the
  // LAN. Development only — the flag is ignored by `next build`/`start`.
  allowedDevOrigins: ["10.1.10.*"],
};

export default nextConfig;
