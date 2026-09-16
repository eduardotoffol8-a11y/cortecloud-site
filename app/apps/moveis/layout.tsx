import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  applicationName: "OrçaMóvel",
  title: { default: "OrçaMóvel | Orçamentos profissionais para marcenaria", template: "%s | OrçaMóvel" },
  description: "Crie, organize e envie propostas profissionais de móveis sob medida pelo celular ou computador.",
  manifest: "/manifest.webmanifest?v=20260916-4",
  icons: {
    icon: [
      { url: "/orcamovel-install-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/orcamovel-install-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/orcamovel-install-192-v2.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function MoveisLayout({ children }: { children: ReactNode }) {
  return children;
}
