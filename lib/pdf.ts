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

const colorFromHex = (value: string | undefined, fallback: [number, number, number]): [number, number, number] => {
  const match = value?.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return match ? [Number.parseInt(match[1], 16), Number.parseInt(match[2], 16), Number.parseInt(match[3], 16)] : fallback;
};

const paleColor = ([r, g, b]: [number, number, number]): [number, number, number] => [
  Math.round(r + (255 - r) * 0.91), Math.round(g + (255 - g) * 0.91), Math.round(b + (255 - b) * 0.91),
];

export async function generateQuotePdf(quote: Quote, company: CompanyInfo, projectImages: PdfProjectImage[] = [], projectDocuments: PdfProjectDocument[] = []) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const pageWidth = 210, pageHeight = 297, margin = 16;
  const contentWidth = pageWidth - margin * 2, footerLimit = 279;
  const emerald = colorFromHex(company.primaryColor, [12, 77, 70]);
  const gold = colorFromHex(company.secondaryColor, [181, 145, 78]);
  const ink: [number, number, number] = [25, 34, 33];
  const muted: [number, number, number] = [92, 105, 102];
  const line: [number, number, number] = [218, 226, 223];
  const mist = paleColor(emerald);
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

  doc.setFillColor(...emerald); doc.rect(0, 0, pageWidth, 34, "F");
  doc.setFillColor(...gold); doc.rect(0, 34, pageWidth, 1.2, "F");
  let brandX = margin;
  if (company.logo) {
    try {
      doc.setFillColor(255, 255, 255); doc.roundedRect(margin, 6, 24, 22, 2, 2, "F");
      doc.addImage(company.logo, imageFormat(company.logo), margin + 1.5, 7.5, 21, 19, undefined, "FAST");
      brandX = margin + 30;
    } catch { /* Company name remains the letterhead. */ }
  }
  textStyle([255, 255, 255], 15, "bold"); doc.text(company.name || "Sua marcenaria", brandX, 14);
  textStyle([220, 235, 232], 8.5); doc.text("MARCENARIA SOB MEDIDA", brandX, 21);
  textStyle([223, 192, 131], 8, "bold"); doc.text("PROPOSTA COMERCIAL", pageWidth - margin, 11, { align: "right" });
  textStyle([255, 255, 255], 13, "bold"); doc.text(quote.number, pageWidth - margin, 19, { align: "right" });

  // Document control follows the familiar fiscal-document reading order.
  y = 43;
  const controlWidth = contentWidth / 3;
  const validUntil = new Date(quote.createdAt);
  validUntil.setDate(validUntil.getDate() + Number(quote.closing.validityDays || 15));
  const controls: Array<[string, string]> = [
    ["NÚMERO DO ORÇAMENTO", quote.number],
    ["DATA DE EMISSÃO", new Date(quote.createdAt).toLocaleDateString("pt-BR")],
    ["VÁLIDO ATÉ", validUntil.toLocaleDateString("pt-BR")],
  ];
  controls.forEach(([label, value], index) => {
    const x = margin + index * controlWidth;
    doc.setFillColor(...mist); doc.rect(x, y, controlWidth - (index < 2 ? 1.5 : 0), 15, "F");
    textStyle(muted, 6.8, "bold"); doc.text(label, x + 4, y + 5);
    textStyle(ink, 9.5, "bold"); doc.text(value, x + 4, y + 11.5);
  });

  y = 66; sectionTitle("Identificação das partes");
  const partyGap = 4, partyWidth = (contentWidth - partyGap) / 2;
  const partyRows = (name: string, document: string, contact: string, email: string, address: string) => {
    const nameLines = (doc.splitTextToSize(name || "Não informado", partyWidth - 10) as string[]).slice(0, 2);
    const rows = [["CPF/CNPJ", document], ["CONTATO", contact], ["E-MAIL", email], ["ENDEREÇO", address]] as const;
    return { nameLines, rows: rows.map(([label, value]) => ({ label, lines: (doc.splitTextToSize(value || "Não informado", partyWidth - 30) as string[]).slice(0, label === "ENDEREÇO" ? 3 : 2) })) };
  };
  const companyParty = partyRows(company.name, company.document, company.contact, company.email, company.address);
  const clientParty = partyRows(quote.client.name, quote.client.document, quote.client.phone, quote.client.email, quote.client.address);
  const partyContentHeight = (party: ReturnType<typeof partyRows>) => 21 + party.nameLines.length * 4 + party.rows.reduce((sum, row) => sum + Math.max(5, row.lines.length * 3.6 + 1), 0);
  const partyHeight = Math.max(47, partyContentHeight(companyParty), partyContentHeight(clientParty));
  const drawParty = (x: number, title: string, name: string, document: string, contact: string, email: string, address: string) => {
    doc.setDrawColor(...line); doc.setFillColor(252, 253, 253); doc.roundedRect(x, y, partyWidth, partyHeight, 2.3, 2.3, "FD");
    doc.setFillColor(...emerald); doc.roundedRect(x, y, partyWidth, 8, 2.3, 2.3, "F"); doc.rect(x, y + 4, partyWidth, 4, "F");
    textStyle([255, 255, 255], 7.5, "bold"); doc.text(title, x + 5, y + 5.5);
    const party = partyRows(name, document, contact, email, address);
    textStyle(ink, 10, "bold"); doc.text(party.nameLines, x + 5, y + 14);
    let rowY = y + 18 + party.nameLines.length * 4;
    party.rows.forEach(({ label, lines }) => {
      textStyle(muted, 6.5, "bold"); doc.text(label, x + 5, rowY);
      textStyle(ink, 7.8); doc.text(lines, x + 28, rowY);
      rowY += Math.max(5, lines.length * 3.6 + 1);
    });
  };
  drawParty(margin, "EMITENTE / MARCENARIA", company.name, company.document, company.contact, company.email, company.address);
  drawParty(margin + partyWidth + partyGap, "DESTINATÁRIO / CLIENTE", quote.client.name, quote.client.document, quote.client.phone, quote.client.email, quote.client.address);

  y += partyHeight + 7;
  doc.setFillColor(...mist); doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
  textStyle(muted, 6.8, "bold"); doc.text("PROJETO / LOCAL DA OBRA", margin + 5, y + 4.5);
  textStyle(emerald, 9.2, "bold"); doc.text((doc.splitTextToSize(quote.client.projectName || quote.client.address || "Projeto não informado", contentWidth - 10) as string[]).slice(0, 1), margin + 5, y + 9.5);
  y += 20; sectionTitle("Móveis e especificações");

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

  const conditionsOnNewPage = y + 70 > footerLimit;
  if (conditionsOnNewPage) {
    doc.addPage(); continuationHeader();
    textStyle(emerald, 16, "bold"); doc.text("Condições e aceite", margin, y + 2);
    textStyle(muted, 8.5); doc.text("Resumo final da proposta para conferência e aprovação.", margin, y + 9);
    y += 18;
    const summaryWidth = (contentWidth - 6) / 3;
    const summaries: Array<[string, string]> = [
      ["VALOR DA PROPOSTA", brl(total)],
      ["ITENS ORÇADOS", `${quote.furniture.length} ${quote.furniture.length === 1 ? "móvel" : "móveis"}`],
      ["VALIDADE", `${quote.closing.validityDays || "15"} dias`],
    ];
    summaries.forEach(([label, value], index) => {
      const x = margin + index * (summaryWidth + 3);
      doc.setFillColor(index === 0 ? emerald[0] : mist[0], index === 0 ? emerald[1] : mist[1], index === 0 ? emerald[2] : mist[2]);
      doc.roundedRect(x, y, summaryWidth, 21, 2.2, 2.2, "F");
      textStyle(index === 0 ? [211, 229, 225] : muted, 6.8, "bold"); doc.text(label, x + 4, y + 6);
      textStyle(index === 0 ? [255, 255, 255] : ink, 10.5, "bold"); doc.text(value, x + 4, y + 14);
    });
    y += 31;
  } else {
    ensureSpace(70);
  }
  sectionTitle("Condições comerciais");
  const includedServices = [quote.closing.measurementIncluded !== false && "Medição técnica", quote.closing.deliveryIncluded !== false && "Entrega", quote.closing.installationIncluded !== false && "Montagem"].filter(Boolean).join(" • ");
  const terms: Array<[string, string]> = [
    ["Pagamento", [quote.closing.paymentMethod, quote.closing.paymentTerms].filter(Boolean).join(" - ")],
    ["Prazo", quote.closing.deliveryTime], ["Serviços", includedServices || "Nenhum serviço adicional incluído"],
    ["Garantia", quote.closing.warranty], ["Validade", `${quote.closing.validityDays || "15"} dias`],
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

  if (quote.closing.exclusions) {
    const exclusionLines = doc.splitTextToSize(quote.closing.exclusions, contentWidth - 12) as string[];
    ensureSpace(exclusionLines.length * 4.4 + 18); textStyle(emerald, 8.5, "bold"); doc.text("ITENS NÃO INCLUÍDOS", margin, y);
    textStyle(muted, 8.5); doc.text(exclusionLines, margin, y + 6); y += exclusionLines.length * 4.4 + 12;
  }

  if (quote.closing.notes) {
    const noteLines = doc.splitTextToSize(quote.closing.notes, contentWidth - 12) as string[];
    ensureSpace(noteLines.length * 4.4 + 18); textStyle(emerald, 8.5, "bold"); doc.text("OBSERVAÇÕES", margin, y);
    textStyle(muted, 8.5); doc.text(noteLines, margin, y + 6); y += noteLines.length * 4.4 + 12;
  }

  ensureSpace(26);
  textStyle(muted, 7.8);
  const acceptance = "Ao assinar, o cliente declara estar de acordo com o escopo, os valores e as condições comerciais desta proposta.";
  doc.text(doc.splitTextToSize(acceptance, contentWidth), margin, y + 1);
  y += 13;
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
