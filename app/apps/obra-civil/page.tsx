import { ConstructionAuthShell } from "@/components/construction-auth-shell";

export const metadata = {
  title: "OrçaObra | Orçamentos profissionais para construção",
  description: "Organize obras, serviços, custos e propostas profissionais de construção.",
  icons: {
    icon: "/orcaobra-logo.png",
    apple: "/orcaobra-logo.png",
  },
};

export default function ObraCivilAppPage() {
  return <ConstructionAuthShell />;
}
