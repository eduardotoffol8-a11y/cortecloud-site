import { AuthShell } from "@/components/auth-shell";
import { AppAnalytics } from "@/components/app-analytics";
import { InstallReminderPopup } from "@/components/install-reminder-popup";
import { OrcaMovelPwaMigration } from "@/components/orcamovel-pwa-migration";
import { MoveisInstallBridge } from "@/components/moveis-install-bridge";

export const metadata = {
  title: "OrçaMóvel | Orçamentos profissionais para marcenaria",
  description: "Crie, organize e envie propostas profissionais de móveis sob medida pelo celular ou computador.",
  manifest: "/manifest.webmanifest?v=20260916-6",
  icons: {
    icon: "/orcamovel-install-192-v2.png?v=20260916-6",
    apple: "/orcamovel-install-192-v2.png?v=20260916-6",
  },
};

export default function MoveisAppPage() {
  return <><AppAnalytics /><MoveisInstallBridge /><InstallReminderPopup /><OrcaMovelPwaMigration /><AuthShell /></>;
}
