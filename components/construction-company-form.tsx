"use client";

import Image from "next/image";
import { Building2, Check, ImagePlus, Save, X } from "lucide-react";
import { useRef, useState } from "react";
import type { CompanyInfo } from "@/lib/types";

const primaryColors = ["#0C4D46", "#173B57", "#27324A", "#3F3151", "#5A293E", "#6B3028", "#3E4935", "#282828"];
const secondaryColors = ["#B5914E", "#C57B57", "#B86476", "#8C6BB1", "#5687B3", "#4C9B91", "#7D9B59", "#9A8172"];
const MAX_LOGO_UPLOAD = 8 * 1024 * 1024;
const LEGACY_LOGO_LIMIT = 760_000;

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`min-w-0 max-w-full ${className}`}><span className="field-label">{label}</span>{children}</label>;
}

async function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function prepareLogoFile(file: File) {
  if (file.size <= LEGACY_LOGO_LIMIT && /image\/(png|jpeg)/.test(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const image = document.createElement("img");
    image.src = url;
    await image.decode();
    let maximumSide = 2400;
    let best: Blob | null = null;
    for (let resizePass = 0; resizePass < 4; resizePass += 1) {
      const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.96, 0.93, 0.9, 0.86, 0.82]) {
        const candidate = await canvasBlob(canvas, quality);
        if (!candidate) continue;
        best = candidate;
        if (candidate.size <= LEGACY_LOGO_LIMIT) break;
      }
      if (best && best.size <= LEGACY_LOGO_LIMIT) break;
      maximumSide = Math.round(maximumSide * 0.82);
    }
    if (!best) throw new Error("Logo optimization failed");
    return new File([best], `${file.name.replace(/\.[^.]+$/, "") || "logo"}-otimizada.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ConstructionCompanyForm({ company, onChange, onLogo, onSave, saving = false }: {
  company: CompanyInfo;
  onChange: (company: CompanyInfo) => void;
  onLogo: (file?: File) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const logoInput = useRef<HTMLInputElement>(null);
  const [logoNotice, setLogoNotice] = useState("");
  const [preparingLogo, setPreparingLogo] = useState(false);

  const chooseLogo = async (file?: File) => {
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type)) return setLogoNotice("Use uma logo em PNG, JPG ou WebP.");
    if (file.size > MAX_LOGO_UPLOAD) return setLogoNotice("Envie uma imagem de até 8 MB.");
    setPreparingLogo(true);
    setLogoNotice("Preparando a logo em alta qualidade…");
    try {
      const prepared = await prepareLogoFile(file);
      onLogo(prepared);
      setLogoNotice(file.size > LEGACY_LOGO_LIMIT || file.type === "image/webp" ? "Logo otimizada em alta resolução para os PDFs." : "Logo pronta para uso.");
    } catch {
      setLogoNotice("Não foi possível preparar esta imagem. Tente outra logo em PNG ou JPG.");
    } finally {
      setPreparingLogo(false);
      if (logoInput.current) logoInput.current.value = "";
    }
  };

  const form = (
    <div className="grid w-full min-w-0 max-w-full gap-5 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="app-card h-fit min-w-0 max-w-full overflow-hidden p-5">
        <span className="field-label">Logo da empresa</span>
        <div className="mt-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-dashed border-[#aac1bc] bg-[#f4f8f7] p-4">
          {company.logo ? <Image src={company.logo} alt="Logo da empresa" width={1200} height={900} unoptimized className="max-h-full max-w-full object-contain" /> : <div className="text-center text-[#6d7e7a]"><ImagePlus size={30} className="mx-auto mb-2 text-[var(--brand)]" /><p className="text-sm font-bold">PNG, JPG ou WebP</p><p className="mt-1 text-xs">Envie até 8 MB</p></div>}
        </div>
        <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void chooseLogo(event.target.files?.[0])} />
        <button type="button" onClick={() => logoInput.current?.click()} disabled={preparingLogo} className="secondary-button mt-3 w-full"><ImagePlus size={17} />{preparingLogo ? "Preparando…" : company.logo ? "Trocar logo" : "Adicionar logo"}</button>
        {company.logo && <button type="button" onClick={() => onChange({ ...company, logo: "" })} className="quiet-button mt-1 w-full !text-rose-600"><X size={16} />Remover</button>}
        <p className={`mt-3 text-xs leading-5 ${logoNotice ? "text-[#536762]" : "text-[#7b8b87]"}`}>{logoNotice || "Para manter nitidez no PDF, imagens grandes são otimizadas automaticamente sem esticar a logo."}</p>
      </div>

      <div className="app-card min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Building2 size={20} /></div><div><h2 className="font-bold">Identificação da empresa</h2><p className="text-xs text-[#7b8b87]">Usada no cabeçalho dos PDFs do OrçaObra</p></div></div>
        <div className="grid min-w-0 max-w-full gap-4 md:grid-cols-2">
          <Field label="Nome da empresa" className="md:col-span-2"><input className="field-input" value={company.name} onChange={(event) => onChange({ ...company, name: event.target.value })} placeholder="Nome comercial" required /></Field>
          <Field label="Frase da marca" className="md:col-span-2"><input className="field-input" value={company.tagline || ""} maxLength={90} onChange={(event) => onChange({ ...company, tagline: event.target.value })} placeholder="Ex.: Construindo com qualidade e confiança" /><span className="mt-1.5 block text-xs text-[#7b8b87]">Aparece logo abaixo do nome da empresa no cabeçalho do orçamento.</span></Field>
          <Field label="CNPJ ou CPF"><input className="field-input" value={company.document} onChange={(event) => onChange({ ...company, document: event.target.value })} placeholder="Documento da empresa" /></Field>
          <Field label="Contato"><input className="field-input" value={company.contact} onChange={(event) => onChange({ ...company, contact: event.target.value })} placeholder="Telefone ou WhatsApp" required /></Field>
          <Field label="E-mail"><input className="field-input" value={company.email} onChange={(event) => onChange({ ...company, email: event.target.value })} inputMode="email" placeholder="contato@empresa.com" /></Field>
          <Field label="Endereço"><input className="field-input" value={company.address} onChange={(event) => onChange({ ...company, address: event.target.value })} placeholder="Cidade e endereço" /></Field>
        </div>

        <div className="mt-6 border-t border-[#e1e9e7] pt-5">
          <div className="mb-4"><h3 className="font-bold">Cores da sua marca</h3><p className="mt-1 text-xs text-[#7b8b87]">Elas serão aplicadas automaticamente nos PDFs do OrçaObra.</p></div>
          <div className="grid min-w-0 max-w-full gap-5 sm:grid-cols-2">
            <ColorPicker label="Cor principal" colors={primaryColors} value={company.primaryColor} onChange={(primaryColor) => onChange({ ...company, primaryColor })} />
            <ColorPicker label="Cor secundária" colors={secondaryColors} value={company.secondaryColor} onChange={(secondaryColor) => onChange({ ...company, secondaryColor })} />
          </div>
          <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#dde6e4] shadow-sm">
            <div className="flex min-h-20 min-w-0 flex-col items-start justify-center gap-2 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4" style={{ backgroundColor: company.primaryColor }}>
              <div className="w-full min-w-0 sm:w-auto"><span className="block truncate text-lg font-bold">{company.name || "Sua empresa"}</span><span className="mt-1 block truncate text-xs text-white/75">{company.tagline || "Sua frase de marca pode aparecer aqui"}</span></div>
              <span className="max-w-full text-[0.68rem] font-extrabold uppercase tracking-[0.14em] sm:shrink-0 sm:text-xs sm:tracking-widest" style={{ color: company.secondaryColor }}>Proposta comercial</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#47706a]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff1ed] text-[var(--brand)]"><Check size={13} strokeWidth={3} /></span>Sincronizado com sua conta</div>
          <button type="button" onClick={onSave} disabled={saving || preparingLogo} className="primary-button w-full sm:ml-auto sm:w-auto"><Save size={17} />{saving ? "Salvando…" : "Salvar alterações"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <details className="app-card w-full min-w-0 max-w-full overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Building2 size={20} /></span><div className="min-w-0"><p className="font-bold">Identidade e aparência</p><p className="mt-0.5 truncate text-sm text-[#74837f]">{company.name || "Configure sua empresa"} · logo, frase, contato e cores dos PDFs</p></div></div>
        <span className="shrink-0 text-sm font-bold text-[var(--brand)]">Editar</span>
      </summary>
      <div className="min-w-0 max-w-full overflow-hidden border-t border-[#e3ebe9] bg-[#f8fbfa] p-3 sm:p-5">{form}</div>
    </details>
  );
}

function ColorPicker({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset className="min-w-0 max-w-full"><legend className="field-label">{label}</legend><div className="flex flex-wrap gap-2.5">{colors.map((color) => <button key={color} type="button" onClick={() => onChange(color)} aria-label={`Escolher ${color}`} aria-pressed={value === color} className={`grid h-10 w-10 place-items-center rounded-full border-2 shadow-sm transition-transform hover:scale-105 ${value === color ? "border-[#172321] ring-2 ring-[#172321]/20 ring-offset-2" : "border-white"}`} style={{ backgroundColor: color }}>{value === color && <Check size={18} className="text-white drop-shadow" strokeWidth={3} />}</button>)}</div></fieldset>;
}
