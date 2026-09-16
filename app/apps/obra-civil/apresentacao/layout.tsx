import type { Metadata } from "next";

export const metadata: Metadata = {
  applicationName: "OrçaObra",
  manifest: "/orcaobra-manifest.webmanifest?v=20260916-2",
  icons: {
    icon: "/orcaobra-logo.png",
    apple: "/orcaobra-logo.png",
  },
};

export default function ConstructionPresentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
