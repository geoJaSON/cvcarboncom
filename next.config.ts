import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server + only the node_modules
  // actually reached. Keeps the runtime image small for the VPS.
  output: "standalone",
};

export default nextConfig;
