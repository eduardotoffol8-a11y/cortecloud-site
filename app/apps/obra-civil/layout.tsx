import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "./app-scope.module.css";

export const metadata: Metadata = {
  applicationName: "OrçaObra",
  title: { default: "OrçaObra | Orçamentos profissionais", template: "%s | OrçaObra" },
  description: "Orçamentos profissionais para construção e reformas.",
  manifest: "/orcaobra-manifest.webmanifest?v=20260916-4",
  icons: {
    icon: [{ url: "/orcaobra-pwa-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/orcaobra-logo.png", type: "image/png" }],
  },
};

export default function ObraCivilLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}>{children}</div>;
}
