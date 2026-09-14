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
  const muted: [number, number, number] = [87, 100, 97];
  const line: [number, number, number] = [218, 226, 223];
  const mist = paleColor(emerald);
  let y = 0;

  const textStyle = (color: [number, number, number] = ink, size = 10.8, style: "normal" | "bold" = "normal") => {
    doc.setTextColor(...color);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setLineHeightFactor(1.34);
    doc.setCharSpace(0);
  };

  const sectionTitle = (label: string) => {
    doc.setFillColor(...gold);
    doc.roundedRect(margin, y - 2.7, 1.8, 6.2, 0.8, 0.8, "F");
    textStyle(emerald, 9.8, "bold");
    doc.text(label.toUpperCase(), margin + 5.5, y + 1.2);
    y += 8;
  };

  const continuationHeader = () => {
    doc.setFillColor(...emerald); doc.rect(0, 0, pageWidth, 16, "F");
    doc.setFillColor(...gold); doc.rect(0, 16, pageWidth, 0.9, "F");
    textStyle([255, 255, 255], 9.2, "bold"); doc.text(company.name || "ORÇAMENTO", margin, 9.8);
    textStyle([225, 237, 234], 9); doc.text(quote.number, pageWidth - margin, 9.8, { align: "right" });
    y = 26;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= footerLimit) return;
    doc.addPage(); continuationHeader();
  };

  // Premium letterhead with a larger logo area and more breathing room.
  const headerHeight = 41;
  doc.setFillColor(...emerald); doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setFillColor(...gold); doc.rect(0, headerHeight, pageWidth, 1.2, "F");
  let brandX = margin;
  if (company.logo) {
    try {
      const boxX = margin, boxY = 6, boxW = 31, boxH = 29;
      doc.setFillColor(255, 255, 255); doc.roundedRect(boxX, boxY, boxW, boxH, 2.8, 2.8, "F");
      const properties = doc.getImageProperties(company.logo);
      const maxW = 27, maxH = 25;
      const scale = Math.min(maxW / properties.width, maxH / properties.height);
      const logoW = properties.width * scale, logoH = properties.height * scale;
      const logoX = boxX + (boxW - logoW) / 2, logoY = boxY + (boxH - logoH) / 2;
      doc.addImage(company.logo, imageFormat(company.logo), logoX, logoY, logoW, logoH, undefined, "FAST");
      brandX = margin + 37;
    } catch { /* Company name remains the letterhead. */ }
  }

  const brandWidth = company.logo ? 87 : 118;
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(18.2);
  doc.setLineHeightFactor(1.12);
  doc.setCharSpace(0.12);
  const companyNameLines = (doc.splitTextToSize(company.name || "Sua marcenaria", brandWidth) as string[]).slice(0, 2);
  doc.text(companyNameLines, brandX, 13.8);
  const taglineY = 14.2 + companyNameLines.length * 6.3 + 1.5;
  const tagline = company.tagline?.trim() || "Marcenaria sob medida";
  textStyle([220, 235, 232], 9.5); doc.text((doc.splitTextToSize(tagline, brandWidth) as string[]).slice(0, 1), brandX, Math.min(taglineY, 31));

  textStyle([229, 195, 132], 8.7, "bold"); doc.text("PROPOSTA COMERCIAL", pageWidth - margin, 10.5, { align: "right" });
  textStyle([255, 255, 255], 14.2, "bold"); doc.text(quote.number, pageWidth - margin, 19, { align: "right" });
  textStyle([219, 235, 232], 7.8); doc.text("ORÇAMENTO PROFISSIONAL", pageWidth - margin, 26.5, { align: "right" });

  // Document control follows the familiar fiscal-document reading order.
  y = 49;
  const controlGap = 2.2;
  const controlWidth = (contentWidth - controlGap * 2) / 3;
  const validUntil = new Date(quote.createdAt);
  validUntil.setDate(validUntil.getDate() + Number(quote.closing.validityDays || 15));
  const controls: Array<[string, string]> = [
    ["NÚMERO DO ORÇAMENTO", quote.number],
    ["DATA DE EMISSÃO", new Date(quote.createdAt).toLocaleDateString("pt-BR")],
    ["VÁLIDO ATÉ", validUntil.toLocaleDateString("pt-BR")],
  ];
  controls.forEach(([label, value], index) => {
    const x = margin + index * (controlWidth + controlGap);
    doc.setFillColor(...mist); doc.setDrawColor(...line); doc.roundedRect(x, y, controlWidth, 17, 2, 2, "FD");
    doc.setFillColor(...gold); doc.roundedRect(x + 3, y + 3, 1.2, 4.2, 0.5, 0.5, "F");
    textStyle(muted, 7.7, "bold"); doc.text(label, x + 6.5, y + 6.2);
    textStyle(ink, 10.8, "bold"); doc.text(value, x + 6.5, y + 13.1);
  });

  y = 76; sectionTitle("Identificação das partes");
  const partyGap = 4, partyWidth = (contentWidth - partyGap) / 2;
  const partyRows = (name: string, document: string, contact: string, email: string, address: string) => {
    const nameLines = (doc.splitTextToSize(name || "Não informado", partyWidth - 10) as string[]).slice(0, 2);
    const rows = [["CPF/CNPJ", document], ["CONTATO", contact], ["E-MAIL", email], ["ENDEREÇO", address]] as const;
    return { nameLines, rows: rows.map(([label, value]) => ({ label, lines: (doc.splitTextToSize(value || "Não informado", partyWidth - 30) as string[]).slice(0, label === "ENDEREÇO" ? 3 : 2) })) };
  };
  const companyParty = partyRows(company.name, company.document, company.contact, company.email, company.address);
  const clientParty = partyRows(quote.client.name, quote.client.document, quote.client.phone, quote.client.email, quote.client.address);
  const partyContentHeight = (party: ReturnType<typeof partyRows>) => 23 + party.nameLines.length * 4.6 + party.rows.reduce((sum, row) => sum + Math.max(5.7, row.lines.length * 4 + 1.2), 0);
  const partyHeight = Math.max(52, partyContentHeight(companyParty), partyContentHeight(clientParty));
  const drawParty = (x: number, title: string, name: string, document: string, contact: string, email: string, address: string) => {
    doc.setDrawColor(...line); doc.setFillColor(252, 253, 253); doc.roundedRect(x, y, partyWidth, partyHeight, 2.5, 2.5, "FD");
    doc.setFillColor(...emerald); doc.roundedRect(x, y, partyWidth, 9, 2.5, 2.5, "F"); doc.rect(x, y + 4.5, partyWidth, 4.5, "F");
    textStyle([255, 255, 255], 8.6, "bold"); doc.text(title, x + 5, y + 6.2);
    const party = partyRows(name, document, contact, email, address);
    textStyle(ink, 11.3, "bold"); doc.text(party.nameLines, x + 5, y + 15.5);
    let rowY = y + 20 + party.nameLines.length * 4.6;
    party.rows.forEach(({ label, lines }) => {
      textStyle(muted, 7.5, "bold"); doc.text(label, x + 5, rowY);
      textStyle(ink, 9.2); doc.text(lines, x + 28, rowY);
      rowY += Math.max(5.7, lines.length * 4 + 1.2);
    });
  };
  drawParty(margin, "EMITENTE / MARCENARIA", company.name, company.document, company.contact, company.email, company.address);
  drawParty(margin + partyWidth + partyGap, "DESTINATÁRIO / CLIENTE", quote.client.name, quote.client.document, quote.client.phone, quote.client.email, quote.client.address);

  y += partyHeight + 8;
  doc.setFillColor(...mist); doc.setDrawColor(...line); doc.roundedRect(margin, y, contentWidth, 13.5, 2.2, 2.2, "FD");
  textStyle(muted, 7.3, "bold"); doc.text("PROJETO / LOCAL DA OBRA", margin + 5, y + 5);
  textStyle(emerald, 10.2, "bold"); doc.text((doc.splitTextToSize(quote.client.projectName || quote.client.address || "Projeto não informado", contentWidth - 10) as string[]).slice(0, 1), margin + 5, y + 10.8);
  y += 22; sectionTitle("Móveis e especificações");

  quote.furniture.forEach((item, index) => {
    const specs = `${item.width || "-"} L x ${item.height || "-"} A x ${item.depth || "-"} P mm  |  MDF ${item.mdfThickness || "-"} mm  |  ${item.mdfColor || "Cor não informada"}`;
    const specLines = doc.splitTextToSize(specs, contentWidth - 18) as string[];
    const detailLines = doc.splitTextToSize(itemDetails(item), contentWidth - 18) as string[];
    const rowHeight = Math.max(31.5, 19.5 + specLines.length * 4.8 + detailLines.length * 4.8);
    ensureSpace(rowHeight + 5);
    doc.setDrawColor(...line); doc.setLineWidth(0.25); doc.setFillColor(252, 253, 253);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 2.4, 2.4, "FD");
    doc.setFillColor(...emerald); doc.roundedRect(margin + 4, y + 5, 10.5, 8.5, 2, 2, "F");
    textStyle([255, 255, 255], 8.4, "bold"); doc.text(String(index + 1).padStart(2, "0"), margin + 9.25, y + 10.8, { align: "center" });
    textStyle(ink, 11.7, "bold"); doc.text(doc.splitTextToSize(`${item.environment || "Ambiente"} - ${item.name || "Móvel"}`, contentWidth - 75)[0], margin + 18, y + 11);
    textStyle(muted, 9.2); doc.text(`${Math.max(1, item.quantity || 1)} un.`, pageWidth - margin - (quote.closing.showItemPrices !== false ? 47 : 4), y + 11, { align: "right" });
    if (quote.closing.showItemPrices !== false) {
      textStyle(emerald, 11.7, "bold"); doc.text(brl(moneyValue(item.unitPrice) * Math.max(1, item.quantity || 1)), pageWidth - margin - 4, y + 11, { align: "right" });
    }
    let rowY = y + 18.5;
    textStyle(muted, 9.7); doc.text(specLines, margin + 5, rowY); rowY += specLines.length * 4.8 + 2.2;
    textStyle(ink, 9.5); doc.text(detailLines, margin + 5, rowY);
    y += rowHeight + 5;
  });

  ensureSpace(42);
  const subtotal = quoteSubtotal(quote), discount = moneyValue(quote.closing.discount), total = quoteTotal(quote);
  const onlyTotal = quote.closing.showItemPrices === false;
  const totalHeight = onlyTotal ? 20 : discount > 0 ? 32 : 27, totalX = pageWidth - margin - 82;
  doc.setFillColor(...emerald); doc.roundedRect(totalX, y, 82, totalHeight, 3, 3, "F");
  doc.setFillColor(...gold); doc.roundedRect(totalX + 4, y + 4, 1.5, totalHeight - 8, 0.7, 0.7, "F");
  if (!onlyTotal) {
    textStyle([207, 226, 222], 9); doc.text("Subtotal", totalX + 8, y + 8.5); doc.text(brl(subtotal), totalX + 76, y + 8.5, { align: "right" });
  }
  let totalLine = onlyTotal ? y + 13 : y + 19;
  if (!onlyTotal && discount > 0) {
    doc.text("Desconto", totalX + 8, y + 14.8); doc.text(`- ${brl(discount)}`, totalX + 76, y + 14.8, { align: "right" }); totalLine = y + 25;
  }
  textStyle([255, 255, 255], 11.8, "bold"); doc.text("TOTAL", totalX + 8, totalLine); doc.text(brl(total), totalX + 76, totalLine, { align: "right" });
  y += totalHeight + 11;

  const includedAttachments = quote.attachments?.filter((attachment) => attachment.includeInPdf !== false) || [];
  if (includedAttachments.length) {
    ensureSpace(17 + includedAttachments.length * 5.5); sectionTitle("Anexos incluídos");
    includedAttachments.forEach((attachment, index) => { ensureSpace(6); textStyle(ink, 9.1); doc.text(`${String(index + 1).padStart(2, "0")}  ${attachment.name}`, margin + 1, y); y += 5.5; });
    y += 3;
  }

  const conditionsOnNewPage = y + 74 > footerLimit;
  if (conditionsOnNewPage) {
    doc.addPage(); continuationHeader();
    textStyle(emerald, 16.5, "bold"); doc.text("Condições e aceite", margin, y + 2);
    textStyle(muted, 9.2); doc.text("Resumo final da proposta para conferência e aprovação.", margin, y + 9.5);
    y += 19;
    const summaryWidth = (contentWidth - 6) / 3;
    const summaries: Array<[string, string]> = [
      ["VALOR DA PROPOSTA", brl(total)],
      ["ITENS ORÇADOS", `${quote.furniture.length} ${quote.furniture.length === 1 ? "móvel" : "móveis"}`],
      ["VALIDADE", `${quote.closing.validityDays || "15"} dias`],
    ];
    summaries.forEach(([label, value], index) => {
      const x = margin + index * (summaryWidth + 3);
      doc.setFillColor(index === 0 ? emerald[0] : mist[0], index === 0 ? emerald[1] : mist[1], index === 0 ? emerald[2] : mist[2]);
      doc.roundedRect(x, y, summaryWidth, 22, 2.4, 2.4, "F");
      textStyle(index === 0 ? [211, 229, 225] : muted, 7.3, "bold"); doc.text(label, x + 4, y + 6.5);
      textStyle(index === 0 ? [255, 255, 255] : ink, 11, "bold"); doc.text(value, x + 4, y + 14.8);
    });
    y += 32;
  } else {
    ensureSpace(74);
  }
  sectionTitle("Condições comerciais");
  const includedServices = [quote.closing.measurementIncluded !== false && "Medição técnica", quote.closing.deliveryIncluded !== false && "Entrega", quote.closing.installationIncluded !== false && "Montagem"].filter(Boolean).join(" • ");
  const terms: Array<[string, string]> = [
    ["Pagamento", [quote.closing.paymentMethod, quote.closing.paymentTerms].filter(Boolean).join(" - ")],
    ["Prazo", quote.closing.deliveryTime], ["Serviços", includedServices || "Nenhum serviço adicional incluído"],
    ["Garantia", quote.closing.warranty], ["Validade", `${quote.closing.validityDays || "15"} dias`],
  ];
  const termLines = terms.map(([label, value]) => ({ label, lines: doc.splitTextToSize(value || "-", contentWidth - 43) as string[] }));
  const termsHeight = 6 + termLines.reduce((sum, term) => sum + Math.max(6.5, term.lines.length * 4.5 + 1.6), 0);
  doc.setFillColor(...mist); doc.setDrawColor(...line); doc.roundedRect(margin, y, contentWidth, termsHeight, 2.5, 2.5, "FD");
  let termY = y + 6.5;
  termLines.forEach(({ label, lines }) => {
    textStyle(emerald, 9.5, "bold"); doc.text(label, margin + 6, termY);
    textStyle(ink, 9.7); doc.text(lines, margin + 38, termY);
    termY += Math.max(6.5, lines.length * 4.5 + 1.6);
  });
  y += termsHeight + 9;

  if (quote.closing.exclusions) {
    const exclusionLines = doc.splitTextToSize(quote.closing.exclusions, contentWidth - 12) as string[];
    ensureSpace(exclusionLines.length * 4.7 + 19); textStyle(emerald, 9.1, "bold"); doc.text("ITENS NÃO INCLUÍDOS", margin, y);
    textStyle(muted, 9.1); doc.text(exclusionLines, margin, y + 6.5); y += exclusionLines.length * 4.7 + 13;
  }

  if (quote.closing.notes) {
    const noteLines = doc.splitTextToSize(quote.closing.notes, contentWidth - 12) as string[];
    ensureSpace(noteLines.length * 4.7 + 19); textStyle(emerald, 9.1, "bold"); doc.text("OBSERVAÇÕES", margin, y);
    textStyle(muted, 9.1); doc.text(noteLines, margin, y + 6.5); y += noteLines.length * 4.7 + 13;
  }

  ensureSpace(28);
  textStyle(muted, 8.9);
  const acceptance = "Ao assinar, o cliente declara estar de acordo com o escopo, os valores e as condições comerciais desta proposta.";
  doc.text(doc.splitTextToSize(acceptance, contentWidth), margin, y + 1);
  y += 14;
  doc.setDrawColor(152, 166, 162); doc.line(margin, y, margin + 70, y); doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  textStyle(muted, 8.9); doc.text("Responsável pela marcenaria", margin + 35, y + 5.5, { align: "center" }); doc.text("Cliente", pageWidth - margin - 35, y + 5.5, { align: "center" });

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
      textStyle(muted, 8.6); doc.text(doc.splitTextToSize(image.name, contentWidth)[0] || `Imagem ${index + 1}`, margin, y + imageHeight + 7);
    } catch { textStyle(muted, 9.2); doc.text(`Não foi possível inserir ${image.name}.`, margin, y + 5); }
  });

  const quotePages = doc.getNumberOfPages();
  for (let page = 1; page <= quotePages; page += 1) {
    doc.setPage(page); doc.setDrawColor(...line); doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    textStyle([112, 126, 122], 8); doc.text(`${company.name || "Orçamento profissional"} | ${quote.number}`, margin, pageHeight - 8);
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
