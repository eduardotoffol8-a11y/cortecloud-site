import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrçaMóvel",
    short_name: "OrçaMóvel",
    description: "Orçamentos profissionais para marcenaria.",
    id: "/",
    start_url: "/apps/moveis",
    scope: "/",
    display: "standalone",
    background_color: "#f2f6f5",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      { src: "/pwa-company-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-company-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-company-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
