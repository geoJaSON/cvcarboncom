import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server + only the node_modules
  // actually reached. Keeps the runtime image small for the VPS.
  output: "standalone",

  // Dev-only. Next blocks cross-origin requests to dev assets/HMR by default, so
  // a `cloudflared tunnel --url http://localhost:3000` share would 404 its chunks
  // without this. Quick tunnels get a fresh random subdomain every run.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
