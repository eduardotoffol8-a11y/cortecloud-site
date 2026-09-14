import { brl, moneyValue } from "./quote";
import type { ClientInfo, QuoteStatus } from "./types";

const id = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type ConstructionItem = { id: string; phase: string; code: string; description: string; unit: string; quantity: string; material: string; labor: string; equipment: string; notes: string };
export type ConstructionQuote = {
  product: "obra-civil"; id: string; clientId: string; number: string; createdAt: string; updatedAt: string; revision: number; pdfGeneratedAt?: string; pdfStoragePath?: string;
  client: ClientInfo; work: { name: string; address: string; type: string; area: string; duration: string; start: string; technicalResponsible: string; priceReference: string; scope: string };
  items: ConstructionItem[]; financial: { bdi: string; discount: string; paymentTerms: string; validityDays: string; inclusions: string; exclusions: string; notes: string; status: QuoteStatus };
};

export const phases = ["Serviços preliminares", "Fundação", "Estrutura", "Alvenaria e vedação", "Cobertura", "Instalações", "Revestimentos", "Pintura", "Acabamentos", "Administração local"];
export const emptyConstructionItem = (): ConstructionItem => ({ id: id(), phase: "Serviços preliminares", code: "", description: "", unit: "un", quantity: "1", material: "", labor: "", equipment: "", notes: "" });
export const createConstructionQuote = (number = "OBR-001"): ConstructionQuote => ({
  product: "obra-civil", id: id(), clientId: id(), number, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: 1,
  client: { name: "", phone: "", email: "", document: "", projectName: "", address: "" },
  work: { name: "", address: "", type: "Reforma / construção", area: "", duration: "", start: "", technicalResponsible: "", priceReference: "", scope: "" },
  items: [emptyConstructionItem()],
  financial: { bdi: "", discount: "", paymentTerms: "Conforme cronograma físico-financeiro acordado entre as partes.", validityDays: "15", inclusions: "Mão de obra, materiais e equipamentos descritos na planilha de serviços.", exclusions: "Itens não descritos na planilha, alterações de escopo e taxas de órgãos públicos.", notes: "", status: "pending" },
});
export const itemUnitCost = (item: ConstructionItem) => moneyValue(item.material) + moneyValue(item.labor) + moneyValue(item.equipment);
export const itemTotal = (item: ConstructionItem) => itemUnitCost(item) * Math.max(0, moneyValue(item.quantity));
export const directCost = (quote: ConstructionQuote) => quote.items.reduce((sum, item) => sum + itemTotal(item), 0);
export const bdiValue = (quote: ConstructionQuote) => directCost(quote) * Math.max(0, moneyValue(quote.financial.bdi)) / 100;
export const constructionTotal = (quote: ConstructionQuote) => Math.max(0, directCost(quote) + bdiValue(quote) - moneyValue(quote.financial.discount));
export const constructionSummary = (quote: ConstructionQuote) => `${quote.items.length} serviços · custo direto ${brl(directCost(quote))}`;
