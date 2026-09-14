import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrçaMóvel",
    short_name: "OrçaMóvel",
    description: "Orçamentos profissionais para marcenaria no celular ou computador.",
    id: "/apps/moveis",
    start_url: "/apps/moveis",
    scope: "/",
    display: "standalone",
    background_color: "#f2f6f5",
    theme_color: "#0f766e",
    icons: [
      { src: "/pwa-company-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-company-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-company-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
