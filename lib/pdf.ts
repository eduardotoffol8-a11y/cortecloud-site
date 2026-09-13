import type { CompanyInfo, FurnitureItem, Quote } from "./types";
import { brl, moneyValue, quoteSubtotal, quoteTotal } from "./quote";

const cleanFileName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface PdfProjectImage { name: string; dataUrl: string; }
export interface PdfProjectDocument { name: string; bytes: ArrayBuffer; }

const itemDetails = (item: FurnitureItem) => {
  const details: string[] = [];
  if (item.frontColor) details.push(`Frentes: ${item.frontColor}`);
  if (item.handle) details.push(`Puxador: ${item.handle}`);
  if (item.mirror) details.push("Espelho");
  if (item.glass) details.push("Vidro");
  if (item.aluminum) details.push("Perfil de alumínio");
  if (item.led) details.push("Iluminação LED");
  if (item.extras) details.push(item.extras);
  return details.join(" | ") || "Sem ferragens ou adicionais especificados";
};

const imageFormat = (dataUrl: string) => {
  const format = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);/i)?.[1]?.toUpperCase();
  return format === "JPG" ? "JPEG" : format || "JPEG";
};

export async function generateQuotePdf(quote: Quote, company: CompanyInfo, projectImages: PdfProjectImage[] = [], projectDocuments: PdfProjectDocument[] = []) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const pageWidth = 210, pageHeight = 297, margin = 16;
  const contentWidth = pageWidth - margin * 2, footerLimit = 279;
  const emerald: [number, number, number] = [12, 77, 70];
  const teal: [number, number, number] = [17, 126, 116];
  const gold: [number, number, number] = [181, 145, 78];
  const ink: [number, number, number] = [25, 34, 33];
  const muted: [number, number, number] = [92, 105, 102];
  const line: [number, number, number] = [218, 226, 223];
  const mist: [number, number, number] = [244, 248, 247];
  let y = 0;

  const textStyle = (color: [number, number, number] = ink, size = 10, style: "normal" | "bold" = "normal") => {
    doc.setTextColor(...color);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setLineHeightFactor(1.3);
    doc.setCharSpace(0);
  };

  const sectionTitle = (label: string) => {
    doc.setFillColor(...gold);
    doc.roundedRect(margin, y - 2.6, 1.5, 5.5, 0.7, 0.7, "F");
    textStyle(emerald, 8.5, "bold");
    doc.text(label.toUpperCase(), margin + 5, y + 1);
    y += 7;
  };

  const continuationHeader = () => {
    doc.setFillColor(...emerald); doc.rect(0, 0, pageWidth, 14, "F");
    doc.setFillColor(...gold); doc.rect(0, 14, pageWidth, 0.8, "F");
    textStyle([255, 255, 255], 8.5, "bold"); doc.text(company.name || "ORÇAMENTO", margin, 8.8);
    textStyle([225, 237, 234], 8.5); doc.text(quote.number, pageWidth - margin, 8.8, { align: "right" });
    y = 24;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= footerLimit) return;
    doc.addPage(); continuationHeader();
  };

  doc.setFillColor(...emerald); doc.rect(0, 0, pageWidth, 39, "F");
  doc.setFillColor(...gold); doc.rect(0, 39, pageWidth, 1.2, "F");
  let brandX = margin;
  if (company.logo) {
    try {
      doc.setFillColor(255, 255, 255); doc.roundedRect(margin, 10, 27, 24, 2, 2, "F");
      doc.addImage(company.logo, imageFormat(company.logo), margin + 1.5, 11.5, 24, 21, undefined, "FAST");
      brandX = margin + 33;
    } catch { /* Company name remains the letterhead. */ }
  }
  textStyle([255, 255, 255], 16, "bold"); doc.text(company.name || "Sua marcenaria", brandX, 17);
  textStyle([220, 235, 232], 8.5);
  const companyLine = [company.document, company.contact, company.email].filter(Boolean).join("  |  ");
  doc.text(doc.splitTextToSize(companyLine || "Marcenaria sob medida", 102).slice(0, 2), brandX, 23);
  if (company.address) doc.text(doc.splitTextToSize(company.address, 102)[0], brandX, 32);
  textStyle([223, 192, 131], 8, "bold"); doc.text("PROPOSTA COMERCIAL", pageWidth - margin, 13, { align: "right" });
  textStyle([255, 255, 255], 13.5, "bold"); doc.text(quote.number, pageWidth - margin, 21, { align: "right" });
  textStyle([220, 235, 232], 8.5); doc.text(new Date(quote.createdAt).toLocaleDateString("pt-BR"), pageWidth - margin, 28, { align: "right" });

  y = 49; sectionTitle("Cliente e projeto");
  doc.setFillColor(...mist); doc.roundedRect(margin, y, contentWidth, 28, 2.5, 2.5, "F");
  doc.setFillColor(...teal); doc.roundedRect(margin, y, 3, 28, 1.5, 1.5, "F");
  textStyle(ink, 12, "bold"); doc.text(quote.client.name || "Cliente não informado", margin + 8, y + 8);
  textStyle(muted, 8.7);
  const contact = [quote.client.phone, quote.client.email, quote.client.document].filter(Boolean).join("  |  ") || "Contato não informado";
  doc.text(doc.splitTextToSize(contact, contentWidth - 16).slice(0, 1), margin + 8, y + 14.5);
  textStyle(emerald, 8.5, "bold"); doc.text(quote.client.projectName || "Projeto sem nome", margin + 8, y + 20);
  textStyle(muted, 8.3); doc.text(doc.splitTextToSize(quote.client.address || "Local da obra não informado", contentWidth - 16).slice(0, 1), margin + 8, y + 25);
  y += 36; sectionTitle("Móveis e especificações");

  quote.furniture.forEach((item, index) => {
    const specs = `${item.width || "-"} L x ${item.height || "-"} A x ${item.depth || "-"} P mm  |  MDF ${item.mdfThickness || "-"} mm  |  ${item.mdfColor || "Cor não informada"}`;
    const specLines = doc.splitTextToSize(specs, contentWidth - 18) as string[];
    const detailLines = doc.splitTextToSize(itemDetails(item), contentWidth - 18) as string[];
    const rowHeight = Math.max(27, 18 + specLines.length * 4 + detailLines.length * 4);
    ensureSpace(rowHeight + 5);
    doc.setDrawColor(...line); doc.setLineWidth(0.25); doc.setFillColor(252, 253, 253);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 2.2, 2.2, "FD");
    doc.setFillColor(...emerald); doc.roundedRect(margin + 4, y + 5, 10, 8, 2, 2, "F");
    textStyle([255, 255, 255], 8, "bold"); doc.text(String(index + 1).padStart(2, "0"), margin + 9, y + 10.5, { align: "center" });
    textStyle(ink, 10.5, "bold"); doc.text(doc.splitTextToSize(`${item.environment || "Ambiente"} - ${item.name || "Móvel"}`, contentWidth - 75)[0], margin + 18, y + 10.5);
    textStyle(muted, 8.3); doc.text(`${Math.max(1, item.quantity || 1)} un.`, pageWidth - margin - 47, y + 10.5, { align: "right" });
    textStyle(emerald, 10.5, "bold"); doc.text(brl(moneyValue(item.unitPrice) * Math.max(1, item.quantity || 1)), pageWidth - margin - 4, y + 10.5, { align: "right" });
    let rowY = y + 17.5;
    textStyle(muted, 8.7); doc.text(specLines, margin + 5, rowY); rowY += specLines.length * 4 + 2;
    textStyle(ink, 8.5); doc.text(detailLines, margin + 5, rowY);
    y += rowHeight + 5;
  });

  ensureSpace(40);
  const subtotal = quoteSubtotal(quote), discount = moneyValue(quote.closing.discount), total = quoteTotal(quote);
  const totalHeight = discount > 0 ? 31 : 25, totalX = pageWidth - margin - 80;
  doc.setFillColor(...emerald); doc.roundedRect(totalX, y, 80, totalHeight, 2.5, 2.5, "F");
  textStyle([207, 226, 222], 8.5); doc.text("Subtotal", totalX + 6, y + 8); doc.text(brl(subtotal), totalX + 74, y + 8, { align: "right" });
  let totalLine = y + 18;
  if (discount > 0) {
    doc.text("Desconto", totalX + 6, y + 14); doc.text(`- ${brl(discount)}`, totalX + 74, y + 14, { align: "right" }); totalLine = y + 24;
  }
  textStyle([255, 255, 255], 11, "bold"); doc.text("TOTAL", totalX + 6, totalLine); doc.text(brl(total), totalX + 74, totalLine, { align: "right" });
  y += totalHeight + 10;

  const includedAttachments = quote.attachments?.filter((attachment) => attachment.includeInPdf !== false) || [];
  if (includedAttachments.length) {
    ensureSpace(16 + includedAttachments.length * 5); sectionTitle("Anexos incluídos");
    includedAttachments.forEach((attachment, index) => { ensureSpace(6); textStyle(ink, 8.5); doc.text(`${String(index + 1).padStart(2, "0")}  ${attachment.name}`, margin + 1, y); y += 5; });
    y += 3;
  }

  ensureSpace(58); sectionTitle("Condições comerciais");
  const terms: Array<[string, string]> = [
    ["Pagamento", [quote.closing.paymentMethod, quote.closing.paymentTerms].filter(Boolean).join(" - ")],
    ["Entrega", quote.closing.deliveryTime], ["Garantia", quote.closing.warranty], ["Validade", `${quote.closing.validityDays || "15"} dias`],
  ];
  const termLines = terms.map(([label, value]) => ({ label, lines: doc.splitTextToSize(value || "-", contentWidth - 43) as string[] }));
  const termsHeight = 5 + termLines.reduce((sum, term) => sum + Math.max(6, term.lines.length * 4 + 1.5), 0);
  doc.setFillColor(...mist); doc.roundedRect(margin, y, contentWidth, termsHeight, 2.3, 2.3, "F");
  let termY = y + 6;
  termLines.forEach(({ label, lines }) => {
    textStyle(emerald, 8.5, "bold"); doc.text(label, margin + 6, termY);
    textStyle(ink, 8.7); doc.text(lines, margin + 38, termY);
    termY += Math.max(6, lines.length * 4 + 1.5);
  });
  y += termsHeight + 8;

  if (quote.closing.notes) {
    const noteLines = doc.splitTextToSize(quote.closing.notes, contentWidth - 12) as string[];
    ensureSpace(noteLines.length * 4.4 + 18); textStyle(emerald, 8.5, "bold"); doc.text("OBSERVAÇÕES", margin, y);
    textStyle(muted, 8.5); doc.text(noteLines, margin, y + 6); y += noteLines.length * 4.4 + 12;
  }

  ensureSpace(11); y += 2;
  doc.setDrawColor(152, 166, 162); doc.line(margin, y, margin + 70, y); doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  textStyle(muted, 8); doc.text("Responsável pela marcenaria", margin + 35, y + 5, { align: "center" }); doc.text("Cliente", pageWidth - margin - 35, y + 5, { align: "center" });

  projectImages.forEach((image, index) => {
    doc.addPage(); continuationHeader(); sectionTitle(`Referência visual ${String(index + 1).padStart(2, "0")} / ${String(projectImages.length).padStart(2, "0")}`);
    try {
      const properties = doc.getImageProperties(image.dataUrl);
      const availableWidth = contentWidth, availableHeight = footerLimit - y - 14;
      const scale = Math.min(availableWidth / properties.width, availableHeight / properties.height);
      const imageWidth = properties.width * scale, imageHeight = properties.height * scale;
      const imageX = margin + (availableWidth - imageWidth) / 2;
      doc.setFillColor(...mist); doc.roundedRect(imageX - 2, y - 2, imageWidth + 4, imageHeight + 4, 2.5, 2.5, "F");
      doc.addImage(image.dataUrl, imageFormat(image.dataUrl), imageX, y, imageWidth, imageHeight, undefined, "FAST");
      textStyle(muted, 8); doc.text(doc.splitTextToSize(image.name, contentWidth)[0] || `Imagem ${index + 1}`, margin, y + imageHeight + 7);
    } catch { textStyle(muted, 9); doc.text(`Não foi possível inserir ${image.name}.`, margin, y + 5); }
  });

  const quotePages = doc.getNumberOfPages();
  for (let page = 1; page <= quotePages; page += 1) {
    doc.setPage(page); doc.setDrawColor(...line); doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    textStyle([112, 126, 122], 7.5); doc.text(`${company.name || "Orçamento profissional"} | ${quote.number}`, margin, pageHeight - 8);
    doc.text(`Página ${page} de ${quotePages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  let blob = doc.output("blob");
  if (projectDocuments.length) {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.load(await blob.arrayBuffer());
    for (const projectDocument of projectDocuments) {
      try {
        const source = await PDFDocument.load(projectDocument.bytes);
        const pagesToCopy = await merged.copyPages(source, source.getPageIndices());
        pagesToCopy.forEach((page) => merged.addPage(page));
      } catch { /* Keep the quote valid when an attached PDF is damaged. */ }
    }
    const mergedBytes = await merged.save();
    const mergedBuffer = new ArrayBuffer(mergedBytes.byteLength); new Uint8Array(mergedBuffer).set(mergedBytes);
    blob = new Blob([mergedBuffer], { type: "application/pdf" });
  }

  return { blob, fileName: `${quote.number}-${cleanFileName(quote.client.name || "cliente")}.pdf` };
}
