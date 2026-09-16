import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/apps/moveis/sw.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/apps/moveis" }],
      },
      {
        source: "/apps/obra-civil/sw.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/apps/obra-civil" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/orcaobra-manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
