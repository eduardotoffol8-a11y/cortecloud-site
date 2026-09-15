import type { Metadata } from "next";
import { AppsStore } from "@/components/apps-store";

export const metadata: Metadata = {
  title: "Aplicativos Orça | Catálogo",
  description: "Escolha o aplicativo Orça ideal para marcenaria, construção, instalações e acabamentos.",
};

export default function AppsPage() {
  return <AppsStore />;
}
