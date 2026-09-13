"use client";

import Image from "next/image";
import { Building2, Check, ImagePlus, Save, X } from "lucide-react";
import { useRef } from "react";
import type { CompanyInfo } from "@/lib/types";

const primaryColors = ["#0C4D46", "#173B57", "#27324A", "#3F3151", "#5A293E", "#6B3028", "#3E4935", "#282828"];
const secondaryColors = ["#B5914E", "#C57B57", "#B86476", "#8C6BB1", "#5687B3", "#4C9B91", "#7D9B59", "#9A8172"];

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="field-label">{label}</span>{children}</label>;
}

export function CompanyForm({
  company,
  onChange,
  onLogo,
  onSave,
  saving = false,
  onboarding = false,
}: {
  company: CompanyInfo;
  onChange: (company: CompanyInfo) => void;
  onLogo: (file?: File) => void;
  onSave: () => void;
  saving?: boolean;
  onboarding?: boolean;
}) {
  const logoInput = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="app-card h-fit p-5">
        <span className="field-label">Logo da empresa</span>
        <div className="mt-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-dashed border-[#aac1bc] bg-[#f4f8f7] p-5">
          {company.logo ? <Image src={company.logo} alt="Logo da marcenaria" width={800} height={600} unoptimized className="max-h-full max-w-full object-contain" /> : <div className="text-center text-[#6d7e7a]"><ImagePlus size={28} className="mx-auto mb-2 text-[#0f766e]" /><p className="text-sm font-bold">PNG ou JPG</p><p className="mt-1 text-xs">Até 800 KB</p></div>}
        </div>
        <input ref={logoInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => onLogo(event.target.files?.[0])} />
        <button type="button" onClick={() => logoInput.current?.click()} className="secondary-button mt-3 w-full"><ImagePlus size={17} />{company.logo ? "Trocar logo" : "Adicionar logo"}</button>
        {company.logo && <button type="button" onClick={() => onChange({ ...company, logo: "" })} className="quiet-button mt-1 w-full !text-rose-600"><X size={16} />Remover</button>}
      </div>
      <div className="app-card p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2f0] text-[#0f766e]"><Building2 size={20} /></div>
          <div><h2 className="font-bold">Identificação da empresa</h2><p className="text-xs text-[#7b8b87]">{onboarding ? "Configure antes de criar o primeiro orçamento" : "Usada no cabeçalho dos PDFs"}</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da marcenaria" className="md:col-span-2"><input className="field-input" value={company.name} onChange={(event) => onChange({ ...company, name: event.target.value })} placeholder="Nome comercial" required /></Field>
          <Field label="CNPJ ou CPF"><input className="field-input" value={company.document} onChange={(event) => onChange({ ...company, document: event.target.value })} placeholder="Documento da empresa" /></Field>
          <Field label="Contato"><input className="field-input" value={company.contact} onChange={(event) => onChange({ ...company, contact: event.target.value })} placeholder="Telefone ou WhatsApp" required /></Field>
          <Field label="E-mail"><input className="field-input" value={company.email} onChange={(event) => onChange({ ...company, email: event.target.value })} inputMode="email" placeholder="contato@empresa.com" /></Field>
          <Field label="Endereço"><input className="field-input" value={company.address} onChange={(event) => onChange({ ...company, address: event.target.value })} placeholder="Cidade e endereço" /></Field>
        </div>
        <div className="mt-6 border-t border-[#e1e9e7] pt-5">
          <div className="mb-4"><h3 className="font-bold">Cores da sua marca</h3><p className="mt-1 text-xs text-[#7b8b87]">Elas serão aplicadas automaticamente em todos os seus PDFs.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorPicker label="Cor principal" colors={primaryColors} value={company.primaryColor} onChange={(primaryColor) => onChange({ ...company, primaryColor })} />
            <ColorPicker label="Cor secundária" colors={secondaryColors} value={company.secondaryColor} onChange={(secondaryColor) => onChange({ ...company, secondaryColor })} />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#dde6e4]">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 text-white" style={{ backgroundColor: company.primaryColor }}><span className="font-bold">{company.name || "Sua marcenaria"}</span><span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: company.secondaryColor }}>Proposta comercial</span></div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!onboarding && <div className="flex items-center gap-2 text-sm font-semibold text-[#47706a]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff1ed] text-[#0f766e]"><Check size={13} strokeWidth={3} /></span>Sincronizado com sua conta</div>}
          <button type="button" onClick={onSave} disabled={saving} className="primary-button sm:ml-auto"><Save size={17} />{saving ? "Salvando…" : onboarding ? "Salvar e começar" : "Salvar alterações"}</button>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset><legend className="field-label">{label}</legend><div className="flex flex-wrap gap-2.5">{colors.map((color) => <button key={color} type="button" onClick={() => onChange(color)} aria-label={`Escolher ${color}`} aria-pressed={value === color} className={`grid h-10 w-10 place-items-center rounded-full border-2 shadow-sm transition-transform hover:scale-105 ${value === color ? "border-[#172321] ring-2 ring-[#172321]/20 ring-offset-2" : "border-white"}`} style={{ backgroundColor: color }}>{value === color && <Check size={18} className="text-white drop-shadow" strokeWidth={3} />}</button>)}</div></fieldset>;
}
