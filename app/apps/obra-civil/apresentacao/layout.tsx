import type { Metadata } from "next";

export const metadata: Metadata = {
  applicationName: "OrçaObra",
  manifest: "/orcaobra-manifest.webmanifest?v=20260916-6",
  icons: {
    icon: "/api/orcaobra-icon/192?v=20260916-6",
    apple: "/orcaobra-logo.png",
  },
};

export default function ConstructionPresentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
