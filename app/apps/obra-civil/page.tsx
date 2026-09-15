import { ConstructionAuthShell } from "@/components/construction-auth-shell";
import { ConstructionInstallBridge } from "@/components/construction-install-bridge";

export const metadata = {
  title: "OrçaObra | Orçamentos profissionais para construção",
  description: "Organize obras, serviços, custos e propostas profissionais de construção.",
  manifest: "/orcaobra-manifest.webmanifest",
  icons: {
    icon: "/orcaobra-logo.png",
    apple: "/orcaobra-logo.png",
  },
};

export default function ObraCivilAppPage() {
  return (
    <>
      <ConstructionInstallBridge />
      <ConstructionAuthShell />
    </>
  );
}
