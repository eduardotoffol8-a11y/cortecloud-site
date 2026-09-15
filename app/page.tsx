import type { Metadata } from "next";
import { AppsStore } from "@/components/apps-store";
import { AuthReturnBridge } from "@/components/auth-return-bridge";
import { ReferralRedirectBridge } from "@/components/referral-redirect-bridge";

export const metadata: Metadata = {
  title: "Aplicativos Orça | Orçamentos profissionais por segmento",
  description: "Conheça OrçaMóvel, OrçaObra e a família de aplicativos profissionais para orçamentos no celular e computador.",
};

export default function Home() {
  return <><AuthReturnBridge /><ReferralRedirectBridge /><AppsStore /></>;
}
