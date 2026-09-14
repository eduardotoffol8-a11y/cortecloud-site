import type { Metadata } from "next";
import { AppStoreFront } from "@/components/app-store-front";
import { AuthReturnBridge } from "@/components/auth-return-bridge";

export const metadata: Metadata = {
  title: "Aplicativos Orça",
  description: "Encontre aplicativos de orçamento especializados para marcenaria, construção, hidráulica, elétrica e revestimentos.",
};

export default function Home() {
  return <><AuthReturnBridge /><AppStoreFront /></>;
}
