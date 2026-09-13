"use client";

import {
  Check, ChevronLeft, ChevronRight, CircleDollarSign, Copy, Download, FileImage, FileText,
  LoaderCircle, PackagePlus, Paperclip, Plus, Save, Trash2, Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ClientInfo, FurnitureItem, ProjectAttachment, Quote } from "@/lib/types";
import { brl, emptyFurniture, quoteSubtotal, quoteTotal, statusLabel } from "@/lib/quote";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="field-label">{label}</span>{children}</label>;
}

function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
      <div><p className="mb-1 text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand)]">{eyebrow}</p><h1 className="text-[1.7rem] font-extrabold tracking-[-0.04em] text-[#172321] md:text-3xl">{title}</h1></div>
      {action}
    </div>
  );
}

function StepRail({ active, onChange }: { active: 1 | 2 | 3; onChange: (step: 1 | 2 | 3) => void }) {
  const labels = ["Cliente", "Móveis", "Fechamento"];
  return (
    <div className="mb-6 grid grid-cols-3 gap-2" aria-label={`Etapa ${active} de 3`}>
      {([1, 2, 3] as const).map((step) => (
        <button key={step} type="button" onClick={() => onChange(step)} className="text-left">
          <span className={`mb-1.5 block h-1.5 rounded-full transition-colors ${step <= active ? "bg-[var(--brand)]" : "bg-[#dbe5e2]"}`} />
          <span className={`text-xs font-bold ${step === active ? "text-[var(--brand)]" : "text-[#7b8a87]"}`}>{step}. {labels[step - 1]}</span>
        </button>
      ))}
    </div>
  );
}

export function QuoteEditor({
  quote,
  onChange,
  onSave,
  onGenerate,
  isGenerating,
  onUpload,
  onDownloadAttachment,
  onRemoveAttachment,
  onSetAttachmentIncluded,
  isUploading,
}: {
  quote: Quote;
  onChange: (quote: Quote) => void;
  onSave: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onUpload: (files: FileList) => void;
  onDownloadAttachment: (attachment: ProjectAttachment) => void;
  onRemoveAttachment: (attachment: ProjectAttachment) => void;
  onSetAttachmentIncluded: (attachment: ProjectAttachment, included: boolean) => void;
  isUploading: boolean;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const subtotal = useMemo(() => quoteSubtotal(quote), [quote]);
  const total = useMemo(() => quoteTotal(quote), [quote]);

  const updateClient = (field: keyof ClientInfo, value: string) => onChange({ ...quote, client: { ...quote.client, [field]: value } });
  const updateFurniture = (id: string, field: keyof FurnitureItem, value: string | number | boolean) => onChange({ ...quote, furniture: quote.furniture.map((item) => item.id === id ? { ...item, [field]: value } : item) });
  const updateClosing = (field: keyof Quote["closing"], value: string | boolean) => onChange({ ...quote, closing: { ...quote.closing, [field]: value } });

  const addFurniture = () => onChange({ ...quote, furniture: [...quote.furniture, emptyFurniture()] });
  const duplicateFurniture = (item: FurnitureItem) => onChange({ ...quote, furniture: [...quote.furniture, { ...item, id: emptyFurniture().id, name: item.name ? `${item.name} — cópia` : "" }] });
  const removeFurniture = (id: string) => {
    if (quote.furniture.length === 1) return;
    onChange({ ...quote, furniture: quote.furniture.filter((item) => item.id !== id) });
  };

  if (step === 1) {
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Novo orçamento" title="Informações do cliente" action={<span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#657570] ring-1 ring-[#dce5e2] sm:block">{quote.number}</span>} />
        <StepRail active={step} onChange={setStep} />
        <div className="app-card p-4 sm:p-6 md:p-7"><div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do cliente" className="md:col-span-2"><input className="field-input" value={quote.client.name} onChange={(event) => updateClient("name", event.target.value)} placeholder="Nome completo ou razão social" autoComplete="name" /></Field>
          <Field label="Telefone"><input className="field-input" value={quote.client.phone} onChange={(event) => updateClient("phone", event.target.value)} placeholder="(95) 99999-9999" inputMode="tel" autoComplete="tel" /></Field>
          <Field label="E-mail"><input className="field-input" value={quote.client.email} onChange={(event) => updateClient("email", event.target.value)} placeholder="cliente@email.com" inputMode="email" autoComplete="email" /></Field>
          <Field label="CPF ou CNPJ"><input className="field-input" value={quote.client.document} onChange={(event) => updateClient("document", event.target.value)} placeholder="Opcional" inputMode="numeric" /></Field>
          <Field label="Nome do projeto"><input className="field-input" value={quote.client.projectName} onChange={(event) => updateClient("projectName", event.target.value)} placeholder="Ex.: Cozinha apartamento 302" /></Field>
          <Field label="Endereço / local da obra" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.client.address} onChange={(event) => updateClient("address", event.target.value)} placeholder="Rua, número, bairro e cidade" autoComplete="street-address" /></Field>
        </div></div>
        <div className="mt-5 flex justify-end"><button type="button" onClick={() => setStep(2)} className="primary-button w-full sm:w-auto">Continuar para móveis <ChevronRight size={18} /></button></div>
      </section>
    );
  }

  if (step === 2) {
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Etapa 2 de 3" title="Móveis do projeto" action={<button type="button" onClick={addFurniture} className="secondary-button !min-h-11 !px-3"><PackagePlus size={18} /><span className="hidden sm:inline">Adicionar móvel</span><span className="sm:hidden">Adicionar</span></button>} />
        <StepRail active={step} onChange={setStep} />
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-[var(--brand-dark)] px-4 py-3 text-white shadow-lg shadow-[#123d39]/10 sm:px-5"><div><p className="text-xs font-semibold text-[#a9d8d2]">{quote.furniture.length} {quote.furniture.length === 1 ? "módulo" : "módulos"}</p><p className="mt-0.5 font-bold">Subtotal do projeto</p></div><p className="text-xl font-extrabold tracking-tight">{brl(subtotal)}</p></div>
        <div className="space-y-4">{quote.furniture.map((item, index) => (
          <article key={item.id} className="app-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e2ebe8] bg-[#fbfdfc] px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-sm font-extrabold text-[var(--brand)]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h2 className="truncate font-bold">{item.name || `Novo móvel ${index + 1}`}</h2><p className="truncate text-xs text-[#7b8b87]">{item.environment || "Ambiente não definido"}</p></div></div>
              <div className="flex items-center gap-1"><button type="button" onClick={() => duplicateFurniture(item)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Duplicar móvel"><Copy size={17} /></button><button type="button" onClick={() => removeFurniture(item.id)} disabled={quote.furniture.length === 1} className="quiet-button !min-h-10 !w-10 !p-0 hover:!bg-rose-50 hover:!text-rose-600 disabled:opacity-30" aria-label="Excluir móvel"><Trash2 size={17} /></button></div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Ambiente"><input className="field-input" list="environments" value={item.environment} onChange={(event) => updateFurniture(item.id, "environment", event.target.value)} placeholder="Ex.: Cozinha" /><datalist id="environments"><option value="Cozinha"/><option value="Dormitório"/><option value="Sala"/><option value="Banheiro"/><option value="Lavanderia"/><option value="Escritório"/></datalist></Field>
                <Field label="Nome do móvel"><input className="field-input" value={item.name} onChange={(event) => updateFurniture(item.id, "name", event.target.value)} placeholder="Ex.: Armário aéreo" /></Field>
              </div>
              <div className="my-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#dfe9e6] bg-[#f7faf9] p-3 sm:gap-4 sm:p-4">
                {(["width", "height", "depth"] as const).map((dimension) => {
                  const labels = { width: "Largura", height: "Altura", depth: "Profundidade" };
                  return <Field key={dimension} label={labels[dimension]}><div className="relative"><input className="field-input !pr-8" value={item[dimension]} onChange={(event) => updateFurniture(item.id, dimension, event.target.value)} inputMode="numeric" placeholder="0" /><span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#81908c]">mm</span></div></Field>;
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Cor do MDF"><input className="field-input" value={item.mdfColor} onChange={(event) => updateFurniture(item.id, "mdfColor", event.target.value)} placeholder="Ex.: Carvalho Natural" /></Field>
                <Field label="Espessura"><select className="field-input" value={item.mdfThickness} onChange={(event) => updateFurniture(item.id, "mdfThickness", event.target.value)}><option value="6">6 mm</option><option value="9">9 mm</option><option value="12">12 mm</option><option value="15">15 mm</option><option value="18">18 mm</option><option value="25">25 mm</option></select></Field>
                <Field label="Cor das frentes"><input className="field-input" value={item.frontColor} onChange={(event) => updateFurniture(item.id, "frontColor", event.target.value)} placeholder="Se for diferente" /></Field>
                <Field label="Tipo de puxador"><input className="field-input" list="handles" value={item.handle} onChange={(event) => updateFurniture(item.id, "handle", event.target.value)} placeholder="Ex.: Cava usinada" /><datalist id="handles"><option value="Cava usinada"/><option value="Perfil gola"/><option value="Puxador alça"/><option value="Fecho toque"/><option value="Sem puxador"/></datalist></Field>
                <Field label="Quantidade"><input className="field-input" type="number" min="1" value={item.quantity} onChange={(event) => updateFurniture(item.id, "quantity", Math.max(1, Number(event.target.value)))} /></Field>
                <Field label="Valor unitário"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6f817c]">R$</span><input className="field-input !pl-10" value={item.unitPrice} onChange={(event) => updateFurniture(item.id, "unitPrice", event.target.value)} inputMode="decimal" placeholder="0,00" /></div></Field>
              </div>
              <div className="mt-5"><span className="field-label">Acabamentos e extras</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([["mirror", "Espelho"], ["glass", "Vidro"], ["aluminum", "Alumínio"], ["led", "Fita LED"]] as const).map(([field, label]) => (
                  <label key={field} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm font-bold transition-colors ${item[field] ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-[#dce5e2] bg-white text-[#566661]"}`}><input type="checkbox" className="sr-only" checked={item[field]} onChange={(event) => updateFurniture(item.id, field, event.target.checked)} /><span className={`grid h-5 w-5 place-items-center rounded-md border ${item[field] ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[#bdcbc8]"}`}>{item[field] && <Check size={13} strokeWidth={3} />}</span>{label}</label>
                ))}
              </div></div>
              <Field label="Ferragens e detalhes" className="mt-4 block"><textarea className="field-input min-h-24 resize-y" value={item.extras} onChange={(event) => updateFurniture(item.id, "extras", event.target.value)} placeholder="Dobradiças, corrediças, perfis, divisões internas ou observações técnicas" /></Field>
            </div>
          </article>
        ))}</div>
        <button type="button" onClick={addFurniture} className="mt-4 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[#eff7f5] font-bold text-[var(--brand)] transition-colors hover:bg-[#e5f2ef]"><Plus size={19} />Adicionar outro móvel</button>
        <section className="app-card mt-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Paperclip size={20} /></span>
            <div className="min-w-0 flex-1"><h2 className="font-bold">Fotos e arquivos do projeto</h2><p className="mt-1 text-sm leading-5 text-[#72817e]">JPG, PNG, WebP ou PDF · até 10 MB por arquivo</p></div>
          </div>
          <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => { if (event.target.files?.length) onUpload(event.target.files); event.target.value = ""; }} />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={isUploading} className="secondary-button mt-4 w-full">
            {isUploading ? <LoaderCircle className="animate-spin" size={18} /> : <Upload size={18} />}{isUploading ? "Enviando…" : "Adicionar fotos ou PDF"}
          </button>
          {!!quote.attachments?.length && <div className="mt-3 divide-y divide-[#e1e9e7] rounded-xl border border-[#e1e9e7]">{quote.attachments.map((attachment) => <AttachmentRow key={attachment.id} attachment={attachment} onDownload={() => onDownloadAttachment(attachment)} onRemove={() => onRemoveAttachment(attachment)} onSetIncluded={(included) => onSetAttachmentIncluded(attachment, included)} />)}</div>}
        </section>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep(1)} className="secondary-button"><ChevronLeft size={18} />Voltar</button><button type="button" onClick={() => setStep(3)} className="primary-button">Ir para fechamento <ChevronRight size={18} /></button></div>
      </section>
    );
  }

  return (
    <section className="view-enter">
      <PageHeading eyebrow="Etapa 3 de 3" title="Fechamento" /><StepRail active={step} onChange={setStep} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="app-card p-4 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold"><CircleDollarSign size={19} className="text-[var(--brand)]" />Condições comerciais</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Método de pagamento"><select className="field-input" value={quote.closing.paymentMethod} onChange={(event) => updateClosing("paymentMethod", event.target.value)}><option>PIX ou transferência</option><option>Cartão de crédito</option><option>Boleto bancário</option><option>Dinheiro</option><option>Financiamento</option></select></Field>
            <Field label="Condição de pagamento"><input className="field-input" value={quote.closing.paymentTerms} onChange={(event) => updateClosing("paymentTerms", event.target.value)} placeholder="Ex.: 50% entrada e 50% entrega" /></Field>
            <Field label="Prazo de entrega"><input className="field-input" value={quote.closing.deliveryTime} onChange={(event) => updateClosing("deliveryTime", event.target.value)} /></Field>
            <Field label="Validade do orçamento"><div className="relative"><input className="field-input !pr-14" value={quote.closing.validityDays} onChange={(event) => updateClosing("validityDays", event.target.value)} inputMode="numeric" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71817d]">dias</span></div></Field>
            <Field label="Termos de garantia" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.closing.warranty} onChange={(event) => updateClosing("warranty", event.target.value)} /></Field>
            <label className="md:col-span-2 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#dce5e2] bg-[#f8fbfa] p-4">
              <span><span className="block font-bold text-[#253431]">Exibir valores de cada móvel no PDF</span><span className="mt-1 block text-sm leading-5 text-[#71817d]">Desative para apresentar somente o valor total da proposta.</span></span>
              <input type="checkbox" checked={quote.closing.showItemPrices !== false} onChange={(event) => updateClosing("showItemPrices", event.target.checked)} className="h-6 w-6 shrink-0 accent-[var(--brand)]" />
            </label>
            <div className="md:col-span-2"><span className="field-label">Serviços incluídos</span><div className="grid gap-2 sm:grid-cols-3">{([['measurementIncluded','Medição técnica'],['deliveryIncluded','Entrega'],['installationIncluded','Montagem']] as const).map(([field,label]) => <label key={field} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm font-bold ${quote.closing[field] ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]' : 'border-[#dce5e2] bg-white text-[#566661]'}`}><input type="checkbox" className="sr-only" checked={quote.closing[field]} onChange={(event) => updateClosing(field,event.target.checked)} /><span className={`grid h-5 w-5 place-items-center rounded-md border ${quote.closing[field] ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[#bdcbc8]'}`}>{quote.closing[field] && <Check size={13} strokeWidth={3}/>}</span>{label}</label>)}</div></div>
            <Field label="Não está incluído" className="md:col-span-2"><textarea className="field-input min-h-20 resize-y" value={quote.closing.exclusions} onChange={(event) => updateClosing("exclusions", event.target.value)} placeholder="Ex.: elétrica, hidráulica, alvenaria e pintura" /></Field>
            <Field label="Observações" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.closing.notes} onChange={(event) => updateClosing("notes", event.target.value)} placeholder="Acesso ao local, responsabilidades do cliente ou observações finais" /></Field>
          </div>
        </div>
        <aside className="app-card h-fit overflow-hidden lg:sticky lg:top-6">
          <div className="bg-[var(--brand-dark)] px-5 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9d8d2]">Resumo</p><p className="mt-2 truncate text-lg font-extrabold">{quote.client.name || "Novo orçamento"}</p><p className="mt-1 text-sm text-[#c6e1dd]">{quote.furniture.length} {quote.furniture.length === 1 ? "móvel" : "móveis"}</p></div>
          <div className="p-5">
            <div className="space-y-3 text-sm"><div className="flex justify-between gap-3 text-[#657570]"><span>Subtotal</span><strong className="text-[#253431]">{brl(subtotal)}</strong></div><div className="flex items-center justify-between gap-3"><label htmlFor="discount" className="text-[#657570]">Desconto</label><div className="relative w-32"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6d7d79]">R$</span><input id="discount" className="field-input !min-h-9 !rounded-lg !py-1 !pl-8 !pr-2 text-right !text-sm" value={quote.closing.discount} onChange={(event) => updateClosing("discount", event.target.value)} inputMode="decimal" placeholder="0,00" /></div></div></div>
            <div className="my-5 border-t border-[#dfe8e6] pt-5"><div className="flex items-end justify-between"><span className="font-bold">Total</span><span className="text-2xl font-extrabold tracking-[-0.04em] text-[var(--brand)]">{brl(total)}</span></div></div>
            <Field label="Status"><select className="field-input" value={quote.closing.status} onChange={(event) => updateClosing("status", event.target.value)}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <div className="mt-5 grid gap-2"><button type="button" onClick={onGenerate} disabled={isGenerating} className="primary-button w-full"><Download size={18} />{isGenerating ? "Gerando…" : "Gerar e arquivar PDF"}</button><button type="button" onClick={onSave} className="secondary-button w-full"><Save size={17} />Salvar orçamento</button></div>
          </div>
        </aside>
      </div>
      <button type="button" onClick={() => setStep(2)} className="secondary-button mt-5"><ChevronLeft size={18} />Voltar para móveis</button>
    </section>
  );
}

function AttachmentRow({ attachment, onDownload, onRemove, onSetIncluded }: { attachment: ProjectAttachment; onDownload: () => void; onRemove: () => void; onSetIncluded: (included: boolean) => void }) {
  const Icon = attachment.mimeType === "application/pdf" ? FileText : FileImage;
  const size = attachment.size < 1_000_000 ? `${Math.ceil(attachment.size / 1_000)} KB` : `${(attachment.size / 1_000_000).toFixed(1)} MB`;
  return <div className="flex flex-wrap items-center gap-3 px-3 py-3"><Icon size={19} className="shrink-0 text-[var(--brand)]" /><button type="button" onClick={onDownload} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold">{attachment.name}</span><span className="text-xs text-[#7b8b87]">{size}</span></button><button type="button" onClick={onRemove} className="quiet-button !min-h-9 !w-9 !p-0 !text-rose-600" aria-label={`Excluir ${attachment.name}`}><Trash2 size={16} /></button><label className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[#f3f7f6] px-3 py-2 text-sm font-semibold text-[#48605b]"><span>Incluir no orçamento</span><input type="checkbox" checked={attachment.includeInPdf} onChange={(event) => onSetIncluded(event.target.checked)} className="h-5 w-5 accent-[var(--brand)]" /></label></div>;
}
