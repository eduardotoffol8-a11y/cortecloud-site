import type { Metadata } from "next";
import { AuthReturnBridge } from "@/components/auth-return-bridge";
import MoveisPresentationPage from "./apps/moveis/apresentacao/page";

export const metadata: Metadata = {
  title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
  description: "Organize clientes, crie propostas de móveis sob medida e envie PDFs profissionais pelo celular ou computador. Teste grátis por 30 dias.",
};

export default function Home() {
  return <><AuthReturnBridge /><MoveisPresentationPage /></>;
}
