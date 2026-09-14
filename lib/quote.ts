import type { CompanyInfo, FurnitureItem, Quote, QuoteStatus } from "./types";

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const emptyFurniture = (): FurnitureItem => ({
  id: makeId(), environment: "", name: "", quantity: 1, width: "", height: "", depth: "", mdfColor: "Branco TX",
  mdfThickness: "18", frontColor: "", handle: "", mirror: false, glass: false, aluminum: false, led: false, extras: "", unitPrice: "",
});

export const createEmptyQuote = (number = "ORC-001"): Quote => ({
  id: makeId(), clientId: makeId(), number, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  client: { name: "", phone: "", email: "", document: "", projectName: "", address: "" }, furniture: [emptyFurniture()],
  closing: { paymentMethod: "PIX ou transferência", paymentTerms: "50% na aprovação e 50% na entrega", deliveryTime: "30 dias úteis após a aprovação", warranty: "12 meses contra defeitos de fabricação e montagem", validityDays: "15", discount: "", notes: "", exclusions: "", measurementIncluded: true, deliveryIncluded: true, installationIncluded: true, showItemPrices: true, status: "pending" },
});

export const emptyCompany: CompanyInfo = { name: "", tagline: "", document: "", contact: "", email: "", address: "", logo: "", primaryColor: "#0C4D46", secondaryColor: "#B5914E" };
export const statusLabel: Record<QuoteStatus, string> = { draft: "Rascunho", pending: "Pendente", approved: "Aprovado", declined: "Recusado" };

export const moneyValue = (value: string | number) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const clean = value.replace(/\s/g, "");
  if (!clean) return 0;
  if (clean.includes(",")) return Number(clean.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(clean) || 0;
};

export const quoteSubtotal = (quote: Quote) => quote.furniture.reduce((sum, item) => sum + moneyValue(item.unitPrice) * Math.max(1, item.quantity || 1), 0);
export const quoteTotal = (quote: Quote) => Math.max(0, quoteSubtotal(quote) - moneyValue(quote.closing.discount));
export const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const nextQuoteNumber = (quotes: Quote[]) => {
  const year = new Date().getFullYear();
  const sequence = quotes.reduce((max, quote) => Math.max(max, Number(quote.number.match(/(\d+)$/)?.[1] ?? 0)), 0) + 1;
  return `ORC-${year}-${String(sequence).padStart(3, "0")}`;
};