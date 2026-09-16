import type { Metadata } from "next";
import { ConstructionLandingAnalytics } from "@/components/construction-landing-analytics";

export const metadata: Metadata = {
  applicationName: "OrçaObra",
  manifest: "/orcaobra-manifest.webmanifest?v=20260916-6",
  icons: {
    icon: "/orcaobra-logo.png",
    apple: "/orcaobra-logo.png",
  },
};

export default function ConstructionPresentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><ConstructionLandingAnalytics />{children}</>;
}
