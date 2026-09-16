import { ConstructionAuthShell } from "@/components/construction-auth-shell";
import { ConstructionInstallBridge } from "@/components/construction-install-bridge";

export const metadata = {
  title: "OrçaObra | Orçamentos profissionais para construção",
  description: "Organize obras, serviços, custos e propostas profissionais de construção.",
  applicationName: "OrçaObra",
  manifest: "/orcaobra-manifest.webmanifest?v=20260916-6",
  icons: {
    icon: "/api/orcaobra-icon/192?v=20260916-6",
    apple: "/orcaobra-logo.png",
  },
};

export default function ObraCivilAppPage() {
  return <><ConstructionInstallBridge /><ConstructionAuthShell /></>;
}
