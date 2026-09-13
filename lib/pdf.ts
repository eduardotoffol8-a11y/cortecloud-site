import type { CompanyInfo, FurnitureItem, Quote } from "./types";
import { brl, moneyValue, quoteSubtotal, quoteTotal } from "./quote";

const cleanFileName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const extraDetails = (item: FurnitureItem) => {
  const details: string[] = [];
  if (item.frontColor) details.push(`Frentes: ${item.frontColor}`);
  if (item.handle) details.push(`Puxador: ${item.handle}`);
  if (item.mirror) details.push("Espelho");
  if (item.glass) details.push("Vidro");
  if (item.aluminum) details.push("Perfil de alumínio");
  if (item.led) details.push("Iluminação LED");
  if (item.extras) details.push(item.extras);
  return details.join(" • ") || "Sem ferragens ou adicionais especificados";
};

export async function generateQuotePdf(quote: Quote, company: CompanyInfo) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const footerLimit = pageHeight - 19;
  const brand: [number, number, number] = [15, 118, 110];
  const brandDark: [number, number, number] = [18, 61, 57];
  const ink: [number, number, number] = [24, 35, 33];
  const muted: [number, number, number] = [91, 107, 103];
  const line: [number, number, number] = [216, 226, 223];
  let y = 16;

  const textStyle = (color: [number, number, number] = ink, size = 10, style: "normal" | "bold" = "normal") => {
    doc.setTextColor(...color);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setLineHeightFactor(1.25);
  };

  const continuationHeader = () => {
    doc.setFillColor(...brandDark);
    doc.rect(0, 0, pageWidth, 13, "F");
    textStyle([255, 255, 255], 9, "bold");
    doc.text(company.name || "ORÇAMENTO", margin, 8.4);
    doc.text(quote.number, pageWidth - margin, 8.4, { align: "right" });
    y = 22;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= footerLimit) return;
    doc.addPage();
    continuationHeader();
  };

  doc.setFillColor(...brandDark);
  doc.rect(0, 0, 6, pageHeight, "F");
  doc.setFillColor(...brand);
  doc.rect(6, 0, pageWidth - 6, 5, "F");
  y = 18;

  if (company.logo) {
    try {
      const match = company.logo.match(/^data:image\/(png|jpeg|jpg);/i);
      if (match) {
        const format = match[1].toUpperCase() === "JPG" ? "JPEG" : match[1].toUpperCase();
        doc.addImage(company.logo, format, margin, y, 27, 18, undefined, "FAST");
      }
    } catch { /* The company name remains as the primary letterhead. */ }
  }

  const headerX = company.logo ? 47 : margin;
  textStyle(ink, 15, "bold");
  doc.text(company.name || "Sua marcenaria", headerX, y + 5);
  textStyle(muted, 9);
  const companyLines = [company.document, company.contact, company.email, company.address].filter(Boolean);
  companyLines.slice(0, 3).forEach((value, index) => {
    const lineText = doc.splitTextToSize(String(value), 82)[0] || "";
    doc.text(lineText, headerX, y + 11 + index * 4.5);
  });

  doc.setFillColor(238, 247, 245);
  doc.roundedRect(pageWidth - margin - 49, y - 1, 49, 26, 2, 2, "F");
  textStyle(brand, 13, "bold");
  doc.text("ORÇAMENTO", pageWidth - margin - 4, y + 6, { align: "right" });
  textStyle(ink, 9, "bold");
  doc.text(quote.number, pageWidth - margin - 4, y + 13, { align: "right" });
  textStyle(muted, 8.5);
  doc.text(new Date(quote.createdAt).toLocaleDateString("pt-BR"), pageWidth - margin - 4, y + 19, { align: "right" });

  y = 49;
  doc.setDrawColor(...line);
  doc.line(margin, y, pageWidth - margin, y);
  y += 9;

  textStyle(brand, 8.5, "bold");
  doc.text("CLIENTE E PROJETO", margin, y);
  y += 5;
  doc.setFillColor(247, 250, 249);
  doc.roundedRect(margin, y, contentWidth, 31, 2.5, 2.5, "F");
  textStyle(ink, 11.5, "bold");
  doc.text(quote.client.name || "Cliente não informado", margin + 5, y + 8);
  textStyle(muted, 9);
  const contact = [quote.client.phone, quote.client.email, quote.client.document].filter(Boolean).join("  •  ") || "Contato não informado";
  doc.text(doc.splitTextToSize(contact, contentWidth - 10).slice(0, 1), margin + 5, y + 15);
  textStyle(ink, 9, "bold");
  doc.text(quote.client.projectName || "Projeto sem nome", margin + 5, y + 22);
  textStyle(muted, 8.5);
  doc.text(doc.splitTextToSize(quote.client.address || "Local da obra não informado", contentWidth - 10).slice(0, 1), margin + 5, y + 27);
  y += 40;

  textStyle(brand, 8.5, "bold");
  doc.text("MÓVEIS E ESPECIFICAÇÕES", margin, y);
  y += 5;

  quote.furniture.forEach((item, index) => {
    const specs = `Dimensões (L × A × P): ${item.width || "—"} × ${item.height || "—"} × ${item.depth || "—"} mm  •  MDF ${item.mdfThickness || "—"} mm  •  ${item.mdfColor || "Cor não informada"}`;
    const specLines = doc.splitTextToSize(specs, contentWidth - 12) as string[];
    const detailLines = doc.splitTextToSize(extraDetails(item), contentWidth - 12) as string[];
    const rowHeight = 24 + specLines.length * 4.2 + detailLines.length * 4.2;
    ensureSpace(rowHeight + 5);

    doc.setDrawColor(...line);
    doc.setFillColor(index % 2 === 0 ? 250 : 247, 251, 250);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 2.5, 2.5, "FD");
    doc.setFillColor(...brand);
    doc.roundedRect(margin + 4, y + 5, 10, 8, 2, 2, "F");
    textStyle([255, 255, 255], 8.5, "bold");
    doc.text(String(index + 1).padStart(2, "0"), margin + 9, y + 10.5, { align: "center" });

    textStyle(ink, 11, "bold");
    const title = `${item.environment || "Ambiente"} · ${item.name || "Móvel"}`;
    doc.text(doc.splitTextToSize(title, contentWidth - 76)[0], margin + 18, y + 10.5);
    textStyle(ink, 10, "bold");
    doc.text(`${Math.max(1, item.quantity || 1)} un.`, pageWidth - margin - 45, y + 10.5, { align: "right" });
    doc.text(brl(moneyValue(item.unitPrice) * Math.max(1, item.quantity || 1)), pageWidth - margin - 4, y + 10.5, { align: "right" });

    let rowY = y + 19;
    textStyle(muted, 9);
    doc.text(specLines, margin + 5, rowY);
    rowY += specLines.length * 4.2 + 3;
    textStyle(ink, 8.8);
    doc.text(detailLines, margin + 5, rowY);
    y += rowHeight + 5;
  });

  ensureSpace(42);
  const subtotal = quoteSubtotal(quote);
  const discount = moneyValue(quote.closing.discount);
  const total = quoteTotal(quote);
  const totalHeight = discount > 0 ? 35 : 28;
  const totalX = pageWidth - margin - 78;
  doc.setFillColor(235, 246, 243);
  doc.roundedRect(totalX, y, 78, totalHeight, 2.5, 2.5, "F");
  textStyle(muted, 9);
  doc.text("Subtotal", totalX + 6, y + 8);
  doc.text(brl(subtotal), totalX + 72, y + 8, { align: "right" });
  let totalLine = y + 18;
  if (discount > 0) {
    doc.text("Desconto", totalX + 6, y + 15);
    doc.text(`− ${brl(discount)}`, totalX + 72, y + 15, { align: "right" });
    totalLine = y + 25;
  }
  textStyle(brandDark, 12.5, "bold");
  doc.text("TOTAL", totalX + 6, totalLine);
  doc.text(brl(total), totalX + 72, totalLine, { align: "right" });
  y += totalHeight + 10;

  if (quote.attachments?.length) {
    ensureSpace(18 + quote.attachments.length * 5);
    textStyle(brand, 8.5, "bold");
    doc.text("ARQUIVOS DO PROJETO", margin, y);
    y += 6;
    quote.attachments.forEach((attachment, index) => {
      ensureSpace(6);
      textStyle(ink, 8.8);
      doc.text(`${index + 1}. ${attachment.name}`, margin, y);
      y += 5;
    });
    y += 4;
  }

  ensureSpace(63);
  textStyle(brand, 8.5, "bold");
  doc.text("CONDIÇÕES COMERCIAIS", margin, y);
  y += 6;
  const terms: Array<[string, string]> = [
    ["Pagamento", [quote.closing.paymentMethod, quote.closing.paymentTerms].filter(Boolean).join(" — ")],
    ["Entrega", quote.closing.deliveryTime],
    ["Garantia", quote.closing.warranty],
    ["Validade", `${quote.closing.validityDays || "15"} dias`],
  ];
  terms.forEach(([label, value]) => {
    const lines = doc.splitTextToSize(value || "—", contentWidth - 35) as string[];
    ensureSpace(Math.max(7, lines.length * 4.5 + 2));
    textStyle(ink, 9, "bold");
    doc.text(`${label}:`, margin, y);
    textStyle(muted, 9);
    doc.text(lines, margin + 31, y);
    y += Math.max(7, lines.length * 4.5 + 2);
  });

  if (quote.closing.notes) {
    const noteLines = doc.splitTextToSize(quote.closing.notes, contentWidth - 10) as string[];
    ensureSpace(noteLines.length * 4.5 + 19);
    doc.setFillColor(248, 250, 249);
    doc.roundedRect(margin, y, contentWidth, noteLines.length * 4.5 + 13, 2, 2, "F");
    textStyle(ink, 9, "bold");
    doc.text("Observações", margin + 5, y + 6);
    textStyle(muted, 8.8);
    doc.text(noteLines, margin + 5, y + 12);
    y += noteLines.length * 4.5 + 20;
  }

  ensureSpace(35);
  y += 10;
  doc.setDrawColor(155, 171, 167);
  doc.line(margin, y, margin + 72, y);
  doc.line(pageWidth - margin - 72, y, pageWidth - margin, y);
  textStyle(muted, 8.5);
  doc.text("Responsável pela marcenaria", margin + 36, y + 5, { align: "center" });
  doc.text("Cliente", pageWidth - margin - 36, y + 5, { align: "center" });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    textStyle([121, 137, 133], 8);
    doc.text(`${company.name || "Orçamento profissional"} · ${quote.number}`, margin, pageHeight - 8);
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save(`${quote.number}-${cleanFileName(quote.client.name || "cliente")}.pdf`);
}
