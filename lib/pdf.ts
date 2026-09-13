import type { CompanyInfo, FurnitureItem, Quote } from "./types";
import { brl, moneyValue, quoteSubtotal, quoteTotal } from "./quote";

const cleanFileName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const itemDetails = (item: FurnitureItem) => {
  const details: string[] = [];
  if (item.frontColor) details.push(`Frentes: ${item.frontColor}`);
  if (item.handle) details.push(`Puxador: ${item.handle}`);
  if (item.mirror) details.push("Espelho");
  if (item.glass) details.push("Vidro");
  if (item.aluminum) details.push("Perfil de alumínio");
  if (item.led) details.push("Iluminação LED");
  if (item.extras) details.push(item.extras);
  return details.join(" • ") || "Sem adicionais especificados";
};

export async function generateQuotePdf(quote: Quote, company: CompanyInfo) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const brand: [number, number, number] = [15, 118, 110];
  const ink: [number, number, number] = [24, 35, 33];
  const muted: [number, number, number] = [94, 111, 107];
  let y = 16;

  const setText = (color: [number, number, number] = ink, size = 9, style: "normal" | "bold" = "normal") => {
    doc.setTextColor(...color);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const addPageHeader = () => {
    doc.setFillColor(245, 248, 247);
    doc.rect(0, 0, pageWidth, 12, "F");
    setText(brand, 8, "bold");
    doc.text(company.name || "ORÇAMENTO", margin, 7.7);
    setText(muted, 8);
    doc.text(quote.number, pageWidth - margin, 7.7, { align: "right" });
    y = 20;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - 20) return;
    doc.addPage();
    addPageHeader();
  };

  doc.setFillColor(...brand);
  doc.rect(0, 0, pageWidth, 5, "F");
  y = 18;

  if (company.logo) {
    try {
      const match = company.logo.match(/^data:image\/(png|jpeg|jpg);/i);
      if (match) {
        const format = match[1].toUpperCase() === "JPG" ? "JPEG" : match[1].toUpperCase();
        doc.addImage(company.logo, format, margin, y, 28, 18, undefined, "FAST");
      }
    } catch { /* A text header remains if the uploaded image is incompatible. */ }
  }

  const headerX = company.logo ? 49 : margin;
  setText(ink, 16, "bold");
  doc.text(company.name || "Sua marcenaria", headerX, y + 5);
  setText(muted, 8.5);
  [company.document, company.contact, company.email, company.address].filter(Boolean).slice(0, 3).forEach((line, index) => doc.text(line, headerX, y + 10 + index * 4));

  setText(brand, 18, "bold");
  doc.text("ORÇAMENTO", pageWidth - margin, y + 4, { align: "right" });
  setText(muted, 8.5);
  doc.text(quote.number, pageWidth - margin, y + 10, { align: "right" });
  doc.text(new Date(quote.createdAt).toLocaleDateString("pt-BR"), pageWidth - margin, y + 15, { align: "right" });
  y = 44;
  doc.setDrawColor(214, 225, 222);
  doc.line(margin, y, pageWidth - margin, y);
  y += 9;

  setText(brand, 8, "bold");
  doc.text("CLIENTE E PROJETO", margin, y);
  y += 5;
  doc.setFillColor(247, 250, 249);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "F");
  setText(ink, 10, "bold");
  doc.text(quote.client.name || "Cliente não informado", margin + 5, y + 7);
  setText(muted, 8.5);
  doc.text([quote.client.phone, quote.client.email, quote.client.document].filter(Boolean).join("  |  ") || "—", margin + 5, y + 13);
  const projectLine = [quote.client.projectName, quote.client.address].filter(Boolean).join(" — ") || "Local da obra não informado";
  doc.text(doc.splitTextToSize(projectLine, contentWidth - 10).slice(0, 2), margin + 5, y + 19);
  y += 34;

  setText(brand, 8, "bold");
  doc.text("MÓVEIS E ESPECIFICAÇÕES", margin, y);
  y += 5;

  quote.furniture.forEach((item, index) => {
    const detailLines = doc.splitTextToSize(itemDetails(item), contentWidth - 12) as string[];
    const rowHeight = 23 + Math.max(0, detailLines.length - 1) * 3.5;
    ensureSpace(rowHeight + 4);
    doc.setDrawColor(220, 229, 227);
    const shade = index % 2 === 0 ? 251 : 248;
    doc.setFillColor(shade, 252, 251);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 2, 2, "FD");
    setText(brand, 9, "bold");
    doc.text(String(index + 1).padStart(2, "0"), margin + 5, y + 7);
    setText(ink, 10, "bold");
    doc.text(`${item.environment || "Ambiente"} · ${item.name || "Móvel"}`, margin + 16, y + 7);
    setText(muted, 8.5);
    doc.text(`${item.width || "—"} × ${item.height || "—"} × ${item.depth || "—"} mm  |  MDF ${item.mdfThickness || "—"} mm · ${item.mdfColor || "—"}`, margin + 16, y + 13);
    doc.text(detailLines, margin + 16, y + 18);
    setText(ink, 9, "bold");
    doc.text(`${Math.max(1, item.quantity || 1)} un.`, pageWidth - margin - 43, y + 7, { align: "right" });
    doc.text(brl(moneyValue(item.unitPrice) * Math.max(1, item.quantity || 1)), pageWidth - margin - 5, y + 7, { align: "right" });
    y += rowHeight + 4;
  });

  ensureSpace(38);
  const subtotal = quoteSubtotal(quote);
  const discount = moneyValue(quote.closing.discount);
  const total = quoteTotal(quote);
  const boxX = pageWidth - margin - 74;
  doc.setFillColor(239, 247, 245);
  doc.roundedRect(boxX, y, 74, discount > 0 ? 30 : 24, 2, 2, "F");
  setText(muted, 8.5);
  doc.text("Subtotal", boxX + 5, y + 7);
  doc.text(brl(subtotal), boxX + 69, y + 7, { align: "right" });
  let totalY = y + 14;
  if (discount > 0) {
    doc.text("Desconto", boxX + 5, y + 13);
    doc.text(`− ${brl(discount)}`, boxX + 69, y + 13, { align: "right" });
    totalY = y + 21;
  }
  setText(brand, 12, "bold");
  doc.text("TOTAL", boxX + 5, totalY);
  doc.text(brl(total), boxX + 69, totalY, { align: "right" });
  y += discount > 0 ? 38 : 32;

  ensureSpace(58);
  setText(brand, 8, "bold");
  doc.text("CONDIÇÕES COMERCIAIS", margin, y);
  y += 6;
  const terms = [
    ["Pagamento", [quote.closing.paymentMethod, quote.closing.paymentTerms].filter(Boolean).join(" — ")],
    ["Entrega", quote.closing.deliveryTime], ["Garantia", quote.closing.warranty], ["Validade", `${quote.closing.validityDays || "15"} dias`],
  ];
  terms.forEach(([label, value]) => {
    setText(ink, 8.5, "bold");
    doc.text(`${label}:`, margin, y);
    setText(muted, 8.5);
    const lines = doc.splitTextToSize(value || "—", contentWidth - 28) as string[];
    doc.text(lines, margin + 27, y);
    y += Math.max(6, lines.length * 4);
  });

  if (quote.closing.notes) {
    const noteLines = doc.splitTextToSize(quote.closing.notes, contentWidth) as string[];
    ensureSpace(noteLines.length * 4 + 13);
    setText(ink, 8.5, "bold");
    doc.text("Observações", margin, y + 2);
    setText(muted, 8.5);
    doc.text(noteLines, margin, y + 8);
    y += noteLines.length * 4 + 14;
  }

  ensureSpace(38);
  y += 10;
  doc.setDrawColor(160, 175, 171);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  setText(muted, 8);
  doc.text("Responsável pela marcenaria", margin + 35, y + 5, { align: "center" });
  doc.text("Cliente", pageWidth - margin - 35, y + 5, { align: "center" });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    setText([125, 140, 136], 7.5);
    doc.text(`${company.name || "Orçamento profissional"} · ${quote.number}`, margin, pageHeight - 8);
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save(`${quote.number}-${cleanFileName(quote.client.name || "cliente")}.pdf`);
}
