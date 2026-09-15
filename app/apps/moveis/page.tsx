import { AuthShell } from "@/components/auth-shell";
import { AppAnalytics } from "@/components/app-analytics";
import { InstallReminderPopup } from "@/components/install-reminder-popup";

export const metadata = {
  title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
  description: "Crie, organize e envie propostas profissionais de móveis sob medida pelo celular ou computador.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/orcamovel-official-512.png",
    apple: "/orcamovel-install-192-v2.png",
  },
};

export default function MoveisAppPage() {
  return <><AppAnalytics /><InstallReminderPopup /><AuthShell /></>;
}
