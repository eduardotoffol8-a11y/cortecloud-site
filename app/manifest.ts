import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrçaMóvel",
    short_name: "OrçaMóvel",
    description: "Orçamentos profissionais para marcenaria.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f6f5",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/app-icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
