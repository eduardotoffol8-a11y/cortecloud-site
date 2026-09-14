import { brl, moneyValue } from "./quote";
import type { CompanyInfo } from "./types";
import { bdiValue, constructionTotal, directCost, itemTotal, itemUnitCost, type ConstructionQuote } from "./construction";

const color = (value: string | undefined, fallback: [number, number, number]): [number, number, number] => {
  const m = value?.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i); return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : fallback;
};
const fileName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-");

export async function generateConstructionPdf(quote: ConstructionQuote, company: CompanyInfo) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const W=210, H=297, m=14, cw=W-m*2, primary=color(company.primaryColor,[166,64,13]), accent=color(company.secondaryColor,[229,154,46]); let y=0;
  const text=(size=9, bold=false, rgb:[number,number,number]=[35,42,40])=>{doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.setTextColor(...rgb);doc.setLineHeightFactor(1.28)};
  const header=(first=false)=>{doc.setFillColor(...primary);doc.rect(0,0,W,first?48:17,"F");doc.setFillColor(...accent);doc.rect(0,first?48:17,W,1,"F"); if(first){text(15,true,[255,255,255]);doc.text(company.name||"Sua construtora",m,13);text(8,false,[255,236,216]);doc.text(company.tagline||"Construção e reformas",m,19);text(8,true,[255,220,169]);doc.text("PROPOSTA DE OBRA",W-m,11,{align:"right"});text(14,true,[255,255,255]);doc.text(quote.number,W-m,18,{align:"right"});text(7.5,false,[255,236,216]);doc.text(`REV. ${String(quote.revision||1).padStart(2,"0")}  ·  EMISSÃO ${new Date(quote.createdAt).toLocaleDateString("pt-BR")}`,W-m,24,{align:"right"});const contact=[company.document&&`CNPJ/CPF: ${company.document}`,company.contact&&`Contato: ${company.contact}`,company.email].filter(Boolean).join("  •  ");text(7,false,[255,243,232]);doc.text(contact,m,36);if(company.address)doc.text(company.address,m,41);y=58;}else{ text(8,true,[255,255,255]);doc.text(company.name||"ORÇAOBRA",m,10);doc.text(quote.number,W-m,10,{align:"right"});y=26; }};
  const space=(n:number)=>{if(y+n>279){doc.addPage();header(false);}};
  const section=(label:string)=>{space(12);doc.setFillColor(...accent);doc.roundedRect(m,y-3,2,6,1,1,"F");text(9,true,primary);doc.text(label.toUpperCase(),m+5,y+1);y+=9;};
  const box=(label:string,value:string,x:number,w:number,h=17)=>{doc.setDrawColor(226,229,226);doc.setFillColor(253,253,252);doc.roundedRect(x,y,w,h,2,2,"FD");text(6.8,true,[103,109,105]);doc.text(label,x+4,y+5);text(9,true);doc.text(doc.splitTextToSize(value||"Não informado",w-8),x+4,y+11);};
  header(true);
  section("Cliente e obra");
  box("CLIENTE / CONTRATANTE",quote.client.name,m,(cw-3)/2);box("CPF/CNPJ",quote.client.document,m+(cw+3)/2,(cw-3)/2);y+=20;
  box("CONTATO",quote.client.phone||quote.client.email,m,(cw-3)/2);box("LOCAL DA OBRA",quote.work.address||quote.client.address,m+(cw+3)/2,(cw-3)/2);y+=24;
  const meta=[["OBRA",quote.work.name||quote.client.projectName],["TIPO",quote.work.type],["ÁREA",quote.work.area ? `${quote.work.area} m²` : "Não informada"],["PRAZO",quote.work.duration||"A definir"],["INÍCIO",quote.work.start||"A definir"],["REFERÊNCIA",quote.work.priceReference||"Mercado local"]];
  meta.forEach((v,i)=>{const w=(cw-4)/3;box(v[0],v[1],m+(i%3)*(w+2),w,16);if(i%3===2)y+=19;}); y+=5;
  if(quote.work.scope){section("Escopo e premissas");const l=doc.splitTextToSize(quote.work.scope,cw-10);space(l.length*4.2+12);doc.setFillColor(253,253,252);doc.setDrawColor(226,229,226);doc.roundedRect(m,y,cw,l.length*4.2+10,2,2,"FD");text(8.8);doc.text(l,m+5,y+6);y+=l.length*4.2+15;}
  section("Planilha de serviços");
  const cols=[m,m+11,m+85,m+98,m+113,m+132,m+151,m+170]; const heads=["ITEM","SERVIÇO / ETAPA","UN.","QTDE.","MAT.","M.O.","EQUIP.","TOTAL"];
  const tableHead=()=>{doc.setFillColor(...primary);doc.roundedRect(m,y,cw,8,1.5,1.5,"F");text(6.5,true,[255,255,255]);heads.forEach((h,i)=>doc.text(h,cols[i]+(i===0?2:1),y+5));y+=8;}; tableHead();
  quote.items.forEach((item,i)=>{const title=doc.splitTextToSize(`${item.phase} — ${item.description||"Serviço não informado"}`,70);const h=Math.max(11,title.length*3.8+4);space(h+2);if(y>270){doc.addPage();header(false);section("Planilha de serviços (continuação)");tableHead();}doc.setFillColor(i%2?250:255,i%2?250:255,i%2?248:255);doc.rect(m,y,cw,h,"F");text(7.1);doc.text(String(i+1).padStart(2,"0"),cols[0]+2,y+5);text(7.2,true);doc.text(title,cols[1]+1,y+4.7);text(7.1);doc.text(item.unit||"un",cols[2]+1,y+5);doc.text(String(moneyValue(item.quantity)),cols[3]+1,y+5);doc.text(brl(moneyValue(item.material)),cols[4]+1,y+5);doc.text(brl(moneyValue(item.labor)),cols[5]+1,y+5);doc.text(brl(moneyValue(item.equipment)),cols[6]+1,y+5);text(7.2,true);doc.text(brl(itemTotal(item)),W-m-1,y+5,{align:"right"});y+=h;});
  y+=5;space(46);doc.setFillColor(250,246,239);doc.setDrawColor(...accent);doc.roundedRect(m,y,cw,39,2.5,2.5,"FD");const direct=directCost(quote), bdi=bdiValue(quote), total=constructionTotal(quote);text(8,true,primary);doc.text("RESUMO FINANCEIRO",m+5,y+7);const totals=[["Custo direto",brl(direct)],[`BDI / indiretos (${quote.financial.bdi||0}%)`,brl(bdi)],["Desconto",brl(moneyValue(quote.financial.discount))],["VALOR TOTAL DA PROPOSTA",brl(total)]];totals.forEach(([l,v],i)=>{text(i===3?10:8,i===3,i===3?primary:[74,80,77]);doc.text(l,m+5,y+14+i*6);doc.text(v,W-m-5,y+14+i*6,{align:"right"});});y+=47;
  [["CONDIÇÕES DE PAGAMENTO",quote.financial.paymentTerms],["INCLUSO",quote.financial.inclusions],["NÃO INCLUSO",quote.financial.exclusions],["OBSERVAÇÕES",quote.financial.notes]].filter(([,v])=>v).forEach(([l,v])=>{section(l);const lines=doc.splitTextToSize(v,cw-10);space(lines.length*4+10);text(8.5);doc.text(lines,m+4,y+4);y+=lines.length*4+8;});
  section("Aceite");space(28);text(8);doc.text(`Validade desta proposta: ${quote.financial.validityDays||15} dias.`,m,y+3);doc.setDrawColor(110,110,110);doc.line(m,y+21,m+75,y+21);doc.line(W-m-61,y+21,W-m,y+21);text(7);doc.text("Contratante",m+30,y+26,{align:"center"});doc.text(company.name||"Contratada",W-m-30,y+26,{align:"center"});
  const pages=doc.getNumberOfPages(); for(let p=1;p<=pages;p++){doc.setPage(p);text(7,false,[105,110,107]);doc.text(`${quote.number}  •  Página ${p} de ${pages}`,W/2,289,{align:"center"});}
  const blob=doc.output("blob"); return {blob,fileName:`${fileName(quote.number)}-${fileName(quote.work.name||quote.client.name||"obra")}.pdf`};
}
