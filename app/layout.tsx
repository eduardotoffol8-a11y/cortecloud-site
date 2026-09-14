import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cortecloud-site-l4lh.vercel.app"),
  title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
  description: "Crie, organize e envie propostas profissionais de móveis sob medida pelo celular ou computador.",
  applicationName: "OrçaMóvel",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/pwa-company-icon-192.png" },
  openGraph: {
    title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
    description: "Clientes, móveis, valores e PDFs profissionais organizados em um aplicativo feito para marceneiros.",
    url: "/",
    siteName: "OrçaMóvel",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/pwa-company-icon-512.png?v=20260914-2", width: 512, height: 512, alt: "OrçaMóvel" }],
  },
  twitter: {
    card: "summary",
    title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
    description: "Crie propostas profissionais e compartilhe PDFs direto do celular ou computador.",
    images: ["/pwa-company-icon-512.png?v=20260914-2"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
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
