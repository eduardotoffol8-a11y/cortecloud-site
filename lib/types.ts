export type AppView = "dashboard" | "client" | "furniture" | "closing" | "settings";
export type QuoteStatus = "draft" | "pending" | "approved" | "declined";

export interface ClientInfo {
  name: string; phone: string; email: string; document: string; projectName: string; address: string;
}

export interface FurnitureItem {
  id: string; environment: string; name: string; quantity: number; width: string; height: string; depth: string;
  mdfColor: string; mdfThickness: string; frontColor: string; handle: string;
  mirror: boolean; glass: boolean; aluminum: boolean; led: boolean; extras: string; unitPrice: string;
}

export interface ClosingInfo {
  paymentMethod: string; paymentTerms: string; deliveryTime: string; warranty: string; validityDays: string;
  discount: string; notes: string; status: QuoteStatus;
}

export interface CompanyInfo { name: string; document: string; contact: string; email: string; address: string; logo: string; }

export interface Quote {
  id: string; number: string; createdAt: string; updatedAt: string; client: ClientInfo;
  furniture: FurnitureItem[]; closing: ClosingInfo;
}
