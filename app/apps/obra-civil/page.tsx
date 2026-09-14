import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "OrçaObra | Orçamentos profissionais para construção",
  description: "Organize obras, serviços, custos e propostas profissionais de construção.",
};

export default function ObraCivilAppPage() {
  return <AuthShell product="obra" />;
}
