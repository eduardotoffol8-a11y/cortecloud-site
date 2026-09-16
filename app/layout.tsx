import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cortecloud-site-l4lh.vercel.app"),
  title: "Aplicativos Orça | Central profissional",
  description: "Central dos aplicativos profissionais de orçamento por segmento.",
  applicationName: "Aplicativos Orça",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
