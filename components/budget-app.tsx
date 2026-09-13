"use client";

import {
  BadgeCheck, Building2, Check, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Copy,
  Download, FileClock, FilePlus2, Home, ImagePlus, Layers3, MoreHorizontal, PackagePlus, PencilLine,
  Plus, Save, Settings, Trash2, UserRound, WalletCards, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BrandMark } from "./brand-mark";
import type { AppView, ClientInfo, CompanyInfo, FurnitureItem, Quote, QuoteStatus } from "@/lib/types";
import { brl, createEmptyQuote, emptyCompany, emptyFurniture, nextQuoteNumber, quoteSubtotal, quoteTotal, statusLabel } from "@/lib/quote";
import { generateQuotePdf } from "@/lib/pdf";

const DRAFT_KEY = "orcamovel.draft.v1";
const HISTORY_KEY = "orcamovel.history.v1";
const COMPANY_KEY = "orcamovel.company.v1";

const navItems: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "client", label: "Cliente", icon: UserRound },
  { id: "furniture", label: "Móveis", icon: Layers3 },
  { id: "closing", label: "Fechamento", icon: WalletCards },
  { id: "settings", label: "Ajustes", icon: Settings },
];

const statusClass: Record<QuoteStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  declined: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="field-label">{label}</span>{children}</label>;
}

function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
      <div>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.17em] text-[#0f766e]">{eyebrow}</p>
        <h1 className="text-[1.7rem] font-extrabold tracking-[-0.04em] text-[#172321] md:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function StepRail({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center gap-2" aria-label={`Etapa ${active} de 3`}>
      {[1, 2, 3].map((step) => <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${step <= active ? "bg-[#0f766e]" : "bg-[#dbe5e2]"}`} />)}
      <span className="ml-1 text-xs font-bold text-[#73827f]">{active}/3</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(" de ", " ");
}

function isQuoteStarted(quote: Quote) {
  return Boolean(quote.client.name || quote.client.projectName || quote.furniture.some((item) => item.name || item.unitPrice));
}

export function BudgetApp() {
  const [view, setView] = useState<AppView>("dashboard");
  const [history, setHistory] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote>(() => createEmptyQuote());
  const [company, setCompany] = useState<CompanyInfo>(emptyCompany);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [menuQuote, setMenuQuote] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Quote[];
      const storedCompany = JSON.parse(localStorage.getItem(COMPANY_KEY) || "null") as CompanyInfo | null;
      const storedDraft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Quote | null;
      // Browser storage is the source of truth after the client mounts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory(storedHistory);
      if (storedCompany) setCompany(storedCompany);
      if (storedDraft) setQuote(storedDraft);
      else setQuote(createEmptyQuote(nextQuoteNumber(storedHistory)));
    } catch {
      setNotice("Não foi possível recuperar os dados salvos neste aparelho.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...quote, updatedAt: new Date().toISOString() }));
  }, [quote, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(company)); }
    catch { /* Quota failures do not interrupt the current editing session. */ }
  }, [company, hydrated]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const subtotal = useMemo(() => quoteSubtotal(quote), [quote]);
  const total = useMemo(() => quoteTotal(quote), [quote]);

  const startNewQuote = useCallback(() => {
    if (isQuoteStarted(quote) && !window.confirm("Iniciar um novo orçamento? O rascunho atual será substituído.")) return;
    setQuote(createEmptyQuote(nextQuoteNumber(history)));
    setView("client");
    setNotice("Novo orçamento iniciado.");
  }, [history, quote]);

  const updateClient = (field: keyof ClientInfo, value: string) => setQuote((current) => ({ ...current, client: { ...current.client, [field]: value } }));
  const updateFurniture = (id: string, field: keyof FurnitureItem, value: string | number | boolean) => setQuote((current) => ({ ...current, furniture: current.furniture.map((item) => item.id === id ? { ...item, [field]: value } : item) }));

  const addFurniture = useCallback(() => {
    setQuote((current) => ({ ...current, furniture: [...current.furniture, emptyFurniture()] }));
    setNotice("Móvel adicionado.");
  }, []);

  const duplicateFurniture = (item: FurnitureItem) => {
    const copy = { ...item, id: emptyFurniture().id, name: item.name ? `${item.name} — cópia` : "" };
    setQuote((current) => ({ ...current, furniture: [...current.furniture, copy] }));
    setNotice("Configurações duplicadas.");
  };

  const removeFurniture = (id: string) => {
    if (quote.furniture.length === 1) return setNotice("O orçamento precisa ter pelo menos um móvel.");
    setQuote((current) => ({ ...current, furniture: current.furniture.filter((item) => item.id !== id) }));
  };

  const updateClosing = (field: keyof Quote["closing"], value: string) => setQuote((current) => ({ ...current, closing: { ...current.closing, [field]: value } }));

  const saveQuote = useCallback((showNotice = true) => {
    const saved = { ...quote, updatedAt: new Date().toISOString() };
    setHistory((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setQuote(saved);
    if (showNotice) setNotice("Orçamento salvo no histórico.");
    return saved;
  }, [quote]);

  const handleGeneratePdf = async () => {
    if (!company.name) { setView("settings"); return setNotice("Cadastre o nome da marcenaria antes de gerar o PDF."); }
    if (!quote.client.name) { setView("client"); return setNotice("Informe o nome do cliente."); }
    if (!quote.furniture.some((item) => item.name)) { setView("furniture"); return setNotice("Adicione o nome de pelo menos um móvel."); }
    try {
      setIsGenerating(true);
      const saved = saveQuote(false);
      await generateQuotePdf(saved, company);
      setNotice("PDF gerado e orçamento salvo.");
    } catch {
      setNotice("Não foi possível gerar o PDF. Tente novamente.");
    } finally { setIsGenerating(false); }
  };

  const openQuote = (selected: Quote) => { setQuote(selected); setView("client"); setMenuQuote(null); };
  const updateQuoteStatus = (id: string, status: QuoteStatus) => {
    setHistory((current) => current.map((item) => item.id === id ? { ...item, closing: { ...item.closing, status } } : item));
    if (quote.id === id) setQuote((current) => ({ ...current, closing: { ...current.closing, status } }));
  };
  const deleteQuote = (id: string) => {
    if (!window.confirm("Excluir este orçamento do histórico?")) return;
    setHistory((current) => current.filter((item) => item.id !== id));
    setMenuQuote(null);
  };

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type)) return setNotice("Use uma logo em PNG ou JPG.");
    if (file.size > 1_500_000) return setNotice("A logo deve ter no máximo 1,5 MB.");
    const reader = new FileReader();
    reader.onload = () => setCompany((current) => ({ ...current, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown };
    type WebMcpDocument = Document & { modelContext?: { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> } };
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);

    void register({ name: "start_new_quote", title: "Iniciar novo orçamento", description: "Abre um orçamento vazio e mostra a etapa de dados do cliente.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { startNewQuote(); return { status: "started" }; } });
    void register({
      name: "set_client_information", title: "Preencher dados do cliente", description: "Preenche nome, telefone e local da obra no orçamento atual.",
      inputSchema: { type: "object", properties: { name: { type: "string" }, phone: { type: "string" }, address: { type: "string" } }, required: ["name"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const data = input as Partial<ClientInfo>;
        if (!data.name?.trim()) throw new Error("O nome do cliente é obrigatório.");
        setQuote((current) => ({ ...current, client: { ...current.client, name: data.name!.trim(), phone: data.phone || current.client.phone, address: data.address || current.client.address } }));
        setView("client");
        return { status: "updated", client: data.name.trim() };
      },
    });
    void register({
      name: "add_furniture_module", title: "Adicionar móvel", description: "Adiciona um móvel com ambiente, nome e dimensões ao orçamento atual.",
      inputSchema: { type: "object", properties: { environment: { type: "string" }, name: { type: "string" }, width: { type: "number" }, height: { type: "number" }, depth: { type: "number" } }, required: ["environment", "name", "width", "height", "depth"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const data = input as { environment?: string; name?: string; width?: number; height?: number; depth?: number };
        if (!data.name || !data.environment || !data.width || !data.height || !data.depth) throw new Error("Preencha ambiente, nome e dimensões.");
        const item = { ...emptyFurniture(), environment: data.environment, name: data.name, width: String(data.width), height: String(data.height), depth: String(data.depth) };
        setQuote((current) => ({ ...current, furniture: current.furniture[0]?.name ? [...current.furniture, item] : [item] }));
        setView("furniture");
        return { status: "added", furniture: data.name };
      },
    });
    return () => lifecycle.abort();
  }, [startNewQuote]);

  const renderDashboard = () => {
    const approved = history.filter((item) => item.closing.status === "approved");
    const pending = history.filter((item) => item.closing.status === "pending");
    const approvedValue = approved.reduce((sum, item) => sum + quoteTotal(item), 0);
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Visão geral" title="Seus orçamentos" action={<button onClick={startNewQuote} className="primary-button !min-h-11 !px-3 md:!px-4"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span><span className="sm:hidden">Novo</span></button>} />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="app-card col-span-2 overflow-hidden p-5 lg:col-span-1">
            <div className="mb-8 flex items-center justify-between"><span className="text-sm font-semibold text-[#63736f]">Total aprovado</span><BadgeCheck size={19} className="text-emerald-600" /></div>
            <p className="text-2xl font-extrabold tracking-[-0.04em] text-[#173b37]">{brl(approvedValue)}</p><p className="mt-1 text-sm text-[#81908c]">{approved.length} {approved.length === 1 ? "projeto" : "projetos"}</p>
          </div>
          <div className="app-card p-4 md:p-5"><FileClock size={19} className="mb-7 text-amber-600" /><p className="text-2xl font-extrabold">{pending.length}</p><p className="mt-1 text-sm text-[#74837f]">Pendentes</p></div>
          <div className="app-card p-4 md:p-5"><ClipboardList size={19} className="mb-7 text-[#0f766e]" /><p className="text-2xl font-extrabold">{history.length}</p><p className="mt-1 text-sm text-[#74837f]">Orçamentos</p></div>
        </div>

        <div className="app-card overflow-visible">
          <div className="flex items-center justify-between border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Histórico</h2><span className="text-sm text-[#7c8a87]">Mais recentes</span></div>
          {history.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-6 text-center"><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f3f1] text-[#0f766e]"><FilePlus2 size={25} /></div><h3 className="font-bold">Nenhum orçamento ainda</h3><p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-[#74837f]">Crie o primeiro e acompanhe a aprovação por aqui.</p><button onClick={startNewQuote} className="secondary-button mt-5"><Plus size={17} />Criar orçamento</button></div></div>
          ) : (
            <div className="divide-y divide-[#e7eeec]">{history.map((item) => (
              <article key={item.id} className="relative grid gap-3 px-4 py-4 transition-colors hover:bg-[#fbfdfc] sm:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] sm:items-center sm:px-5">
                <button onClick={() => openQuote(item)} className="min-w-0 text-left"><p className="truncate font-bold text-[#1e2c2a]">{item.client.name || "Cliente sem nome"}</p><p className="mt-1 truncate text-sm text-[#758580]">{item.client.projectName || `${item.furniture.length} ${item.furniture.length === 1 ? "móvel" : "móveis"}`} · {item.number}</p></button>
                <p className="text-sm font-bold sm:text-right">{brl(quoteTotal(item))}</p>
                <select aria-label={`Status de ${item.client.name}`} value={item.closing.status} onChange={(event) => updateQuoteStatus(item.id, event.target.value as QuoteStatus)} className={`w-fit cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${statusClass[item.closing.status]}`}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <div className="flex items-center justify-between gap-2 sm:justify-end"><span className="text-xs text-[#8a9894] sm:hidden">{formatDate(item.updatedAt)}</span><button aria-label="Mais opções" onClick={() => setMenuQuote(menuQuote === item.id ? null : item.id)} className="quiet-button !min-h-10 !w-10 !p-0"><MoreHorizontal size={19} /></button></div>
                {menuQuote === item.id && <div className="absolute bottom-3 right-14 z-20 flex w-40 flex-col rounded-xl border border-[#dbe5e2] bg-white p-1.5 shadow-xl sm:bottom-auto sm:right-12 sm:top-11"><button onClick={() => openQuote(item)} className="quiet-button !min-h-9 !justify-start !rounded-lg !px-2.5"><PencilLine size={15} />Editar</button><button onClick={() => deleteQuote(item.id)} className="quiet-button !min-h-9 !justify-start !rounded-lg !px-2.5 !text-rose-600"><Trash2 size={15} />Excluir</button></div>}
              </article>
            ))}</div>
          )}
        </div>
      </section>
    );
  };

  const renderClient = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Etapa 1" title="Informações do cliente" action={<span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#657570] ring-1 ring-[#dce5e2] sm:block">{quote.number}</span>} />
      <StepRail active={1} />
      <div className="app-card p-4 sm:p-6 md:p-7"><div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do cliente" className="md:col-span-2"><input className="field-input" value={quote.client.name} onChange={(event) => updateClient("name", event.target.value)} placeholder="Nome completo ou razão social" autoComplete="name" /></Field>
        <Field label="Telefone"><input className="field-input" value={quote.client.phone} onChange={(event) => updateClient("phone", event.target.value)} placeholder="(95) 99999-9999" inputMode="tel" autoComplete="tel" /></Field>
        <Field label="E-mail"><input className="field-input" value={quote.client.email} onChange={(event) => updateClient("email", event.target.value)} placeholder="cliente@email.com" inputMode="email" autoComplete="email" /></Field>
        <Field label="CPF ou CNPJ"><input className="field-input" value={quote.client.document} onChange={(event) => updateClient("document", event.target.value)} placeholder="Opcional" inputMode="numeric" /></Field>
        <Field label="Nome do projeto"><input className="field-input" value={quote.client.projectName} onChange={(event) => updateClient("projectName", event.target.value)} placeholder="Ex.: Cozinha apartamento 302" /></Field>
        <Field label="Endereço / local da obra" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.client.address} onChange={(event) => updateClient("address", event.target.value)} placeholder="Rua, número, bairro e cidade" autoComplete="street-address" /></Field>
      </div></div>
      <div className="mt-5 flex justify-end"><button onClick={() => setView("furniture")} className="primary-button w-full sm:w-auto">Continuar para móveis <ChevronRight size={18} /></button></div>
    </section>
  );

  const renderFurniture = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Etapa 2" title="Móveis do projeto" action={<button onClick={addFurniture} className="secondary-button !min-h-11 !px-3"><PackagePlus size={18} /><span className="hidden sm:inline">Adicionar móvel</span><span className="sm:hidden">Adicionar</span></button>} />
      <StepRail active={2} />
      <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#123d39] px-4 py-3 text-white shadow-lg shadow-[#123d39]/10 sm:px-5"><div><p className="text-xs font-semibold text-[#a9d8d2]">{quote.furniture.length} {quote.furniture.length === 1 ? "módulo" : "módulos"}</p><p className="mt-0.5 font-bold">Subtotal do projeto</p></div><p className="text-xl font-extrabold tracking-tight">{brl(subtotal)}</p></div>
      <div className="space-y-4">{quote.furniture.map((item, index) => (
        <article key={item.id} className="app-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e2ebe8] bg-[#fbfdfc] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dff0ed] text-sm font-extrabold text-[#0f766e]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h2 className="truncate font-bold">{item.name || `Novo móvel ${index + 1}`}</h2><p className="truncate text-xs text-[#7b8b87]">{item.environment || "Ambiente não definido"}</p></div></div>
            <div className="flex items-center gap-1"><button onClick={() => duplicateFurniture(item)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Duplicar móvel"><Copy size={17} /></button><button onClick={() => removeFurniture(item.id)} className="quiet-button !min-h-10 !w-10 !p-0 hover:!bg-rose-50 hover:!text-rose-600" aria-label="Excluir móvel"><Trash2 size={17} /></button></div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ambiente"><input className="field-input" list="environments" value={item.environment} onChange={(event) => updateFurniture(item.id, "environment", event.target.value)} placeholder="Ex.: Cozinha" /><datalist id="environments"><option value="Cozinha"/><option value="Dormitório"/><option value="Sala"/><option value="Banheiro"/><option value="Lavanderia"/><option value="Escritório"/></datalist></Field>
              <Field label="Nome do móvel"><input className="field-input" value={item.name} onChange={(event) => updateFurniture(item.id, "name", event.target.value)} placeholder="Ex.: Armário aéreo" /></Field>
            </div>
            <div className="my-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#dfe9e6] bg-[#f7faf9] p-3 sm:gap-4 sm:p-4">
              {(["width", "height", "depth"] as const).map((dimension) => {
                const labels = { width: "Largura", height: "Altura", depth: "Profundidade" };
                return <Field key={dimension} label={labels[dimension]}><div className="relative"><input className="field-input !pr-9" value={item[dimension]} onChange={(event) => updateFurniture(item.id, dimension, event.target.value)} inputMode="numeric" placeholder="0" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#81908c]">mm</span></div></Field>;
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
                <label key={field} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm font-bold transition-colors ${item[field] ? "border-[#58a89f] bg-[#e9f5f3] text-[#0d665f]" : "border-[#dce5e2] bg-white text-[#566661]"}`}><input type="checkbox" className="sr-only" checked={item[field]} onChange={(event) => updateFurniture(item.id, field, event.target.checked)} /><span className={`grid h-5 w-5 place-items-center rounded-md border ${item[field] ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-[#bdcbc8]"}`}>{item[field] && <Check size={13} strokeWidth={3} />}</span>{label}</label>
              ))}
            </div></div>
            <Field label="Ferragens e detalhes" className="mt-4 block"><textarea className="field-input min-h-24 resize-y" value={item.extras} onChange={(event) => updateFurniture(item.id, "extras", event.target.value)} placeholder="Dobradiças, corrediças, perfis, divisões internas ou observações técnicas" /></Field>
          </div>
        </article>
      ))}</div>
      <button onClick={addFurniture} className="mt-4 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#9fbdb7] bg-[#eff7f5] font-bold text-[#0f6b63] transition-colors hover:bg-[#e5f2ef]"><Plus size={19} />Adicionar outro móvel</button>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button onClick={() => setView("client")} className="secondary-button"><ChevronLeft size={18} />Voltar</button><button onClick={() => setView("closing")} className="primary-button">Ir para fechamento <ChevronRight size={18} /></button></div>
    </section>
  );

  const renderClosing = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Etapa 3" title="Fechamento" /><StepRail active={3} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="app-card p-4 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold"><CircleDollarSign size={19} className="text-[#0f766e]" />Condições comerciais</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Método de pagamento"><select className="field-input" value={quote.closing.paymentMethod} onChange={(event) => updateClosing("paymentMethod", event.target.value)}><option>PIX ou transferência</option><option>Cartão de crédito</option><option>Boleto bancário</option><option>Dinheiro</option><option>Financiamento</option></select></Field>
            <Field label="Condição de pagamento"><input className="field-input" value={quote.closing.paymentTerms} onChange={(event) => updateClosing("paymentTerms", event.target.value)} placeholder="Ex.: 50% entrada e 50% entrega" /></Field>
            <Field label="Prazo de entrega"><input className="field-input" value={quote.closing.deliveryTime} onChange={(event) => updateClosing("deliveryTime", event.target.value)} /></Field>
            <Field label="Validade do orçamento"><div className="relative"><input className="field-input !pr-14" value={quote.closing.validityDays} onChange={(event) => updateClosing("validityDays", event.target.value)} inputMode="numeric" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71817d]">dias</span></div></Field>
            <Field label="Termos de garantia" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.closing.warranty} onChange={(event) => updateClosing("warranty", event.target.value)} /></Field>
            <Field label="Observações" className="md:col-span-2"><textarea className="field-input min-h-24 resize-y" value={quote.closing.notes} onChange={(event) => updateClosing("notes", event.target.value)} placeholder="Itens não inclusos, condições de instalação ou observações finais" /></Field>
          </div>
        </div>
        <aside className="app-card h-fit overflow-hidden lg:sticky lg:top-6">
          <div className="bg-[#123d39] px-5 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9d8d2]">Resumo</p><p className="mt-2 truncate text-lg font-extrabold">{quote.client.name || "Novo orçamento"}</p><p className="mt-1 text-sm text-[#c6e1dd]">{quote.furniture.length} {quote.furniture.length === 1 ? "móvel" : "móveis"}</p></div>
          <div className="p-5">
            <div className="space-y-3 text-sm"><div className="flex justify-between gap-3 text-[#657570]"><span>Subtotal</span><strong className="text-[#253431]">{brl(subtotal)}</strong></div><div className="flex items-center justify-between gap-3"><label htmlFor="discount" className="text-[#657570]">Desconto</label><div className="relative w-32"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6d7d79]">R$</span><input id="discount" className="field-input !min-h-9 !rounded-lg !py-1 !pl-8 !pr-2 text-right !text-sm" value={quote.closing.discount} onChange={(event) => updateClosing("discount", event.target.value)} inputMode="decimal" placeholder="0,00" /></div></div></div>
            <div className="my-5 border-t border-[#dfe8e6] pt-5"><div className="flex items-end justify-between"><span className="font-bold">Total</span><span className="text-2xl font-extrabold tracking-[-0.04em] text-[#0f6d65]">{brl(total)}</span></div></div>
            <Field label="Status"><select className="field-input" value={quote.closing.status} onChange={(event) => updateClosing("status", event.target.value)}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <div className="mt-5 grid gap-2"><button onClick={handleGeneratePdf} disabled={isGenerating} className="primary-button w-full"><Download size={18} />{isGenerating ? "Gerando…" : "Gerar PDF"}</button><button onClick={() => saveQuote()} className="secondary-button w-full"><Save size={17} />Salvar no histórico</button></div>
          </div>
        </aside>
      </div>
      <button onClick={() => setView("furniture")} className="secondary-button mt-5"><ChevronLeft size={18} />Voltar para móveis</button>
    </section>
  );

  const renderSettings = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Perfil" title="Dados da marcenaria" />
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="app-card h-fit p-5">
          <span className="field-label">Logo da empresa</span>
          <div className="mt-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-dashed border-[#aac1bc] bg-[#f4f8f7] p-5">{company.logo ? <Image src={company.logo} alt="Logo da marcenaria" width={800} height={600} unoptimized className="max-h-full max-w-full object-contain" /> : <div className="text-center text-[#6d7e7a]"><ImagePlus size={28} className="mx-auto mb-2 text-[#0f766e]" /><p className="text-sm font-bold">PNG ou JPG</p><p className="mt-1 text-xs">Até 1,5 MB</p></div>}</div>
          <input ref={logoInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => handleLogo(event.target.files?.[0])} />
          <button onClick={() => logoInput.current?.click()} className="secondary-button mt-3 w-full"><ImagePlus size={17} />{company.logo ? "Trocar logo" : "Adicionar logo"}</button>
          {company.logo && <button onClick={() => setCompany((current) => ({ ...current, logo: "" }))} className="quiet-button mt-1 w-full !text-rose-600"><X size={16} />Remover</button>}
        </div>
        <div className="app-card p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2f0] text-[#0f766e]"><Building2 size={20} /></div><div><h2 className="font-bold">Identificação da empresa</h2><p className="text-xs text-[#7b8b87]">Aparece no cabeçalho do PDF</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da marcenaria" className="md:col-span-2"><input className="field-input" value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} placeholder="Nome comercial" /></Field>
            <Field label="CNPJ ou CPF"><input className="field-input" value={company.document} onChange={(event) => setCompany({ ...company, document: event.target.value })} placeholder="Documento da empresa" /></Field>
            <Field label="Contato"><input className="field-input" value={company.contact} onChange={(event) => setCompany({ ...company, contact: event.target.value })} placeholder="Telefone ou WhatsApp" /></Field>
            <Field label="E-mail"><input className="field-input" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} inputMode="email" placeholder="contato@empresa.com" /></Field>
            <Field label="Endereço"><input className="field-input" value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} placeholder="Cidade e endereço" /></Field>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#47706a]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff1ed] text-[#0f766e]"><Check size={13} strokeWidth={3} /></span>Salvo automaticamente neste aparelho</div>
        </div>
      </div>
    </section>
  );

  const views: Record<AppView, () => React.ReactNode> = { dashboard: renderDashboard, client: renderClient, furniture: renderFurniture, closing: renderClosing, settings: renderSettings };

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#dce6e3]/80 bg-white/80 backdrop-blur-xl"><div className="mx-auto flex h-[4.65rem] max-w-6xl items-center justify-between px-4 sm:px-6"><BrandMark /><div className="flex items-center gap-2"><span className="hidden text-xs font-semibold text-[#74837f] sm:block">Rascunho salvo</span><span className="h-2 w-2 rounded-full bg-[#2aaa85]" /></div></div></header>
      <main className="content-safe mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">{views[view]()}</main>
      <nav className="app-bottom-nav nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#d5e1de] bg-white/94 px-2 pt-2 shadow-[0_-10px_35px_rgba(24,52,48,0.09)] backdrop-blur-xl" aria-label="Navegação principal"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} onClick={() => setView(item.id)} aria-current={active ? "page" : undefined} className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors ${active ? "bg-[#e7f3f1] text-[#0c6d65]" : "text-[#758580] hover:bg-[#f2f6f5] hover:text-[#30413e]"}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} /><span className="text-xs font-bold">{item.label}</span></button>; })}</div></nav>
      {notice && <div role="status" aria-live="polite" className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl bg-[#173d39] px-4 py-3 text-sm font-semibold text-white shadow-2xl"><Check size={17} className="shrink-0 text-[#62d2c5]" />{notice}</div>}
    </div>
  );
}
