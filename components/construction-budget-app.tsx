"use client";

import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileClock,
  FileText,
  Folder,
  FolderOpen,
  Home,
  LogOut,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CompanyInfo, RegisteredClient } from "@/lib/types";
import { brl } from "@/lib/quote";
import {
  constructionSummary,
  constructionTotal,
  createConstructionQuote,
  emptyConstructionItem,
  itemTotal,
  phases,
  type ConstructionItem,
  type ConstructionQuote,
} from "@/lib/construction";
import { generateConstructionPdf } from "@/lib/construction-pdf";

type View = "dashboard" | "clients" | "quote" | "documents" | "settings";
type ConstructionClient = RegisteredClient & { projectName?: string };
type AccessInfo = {
  trial_ends_at: string;
  subscription_status: "trial" | "active" | "past_due" | "canceled";
  plan_type: "monthly" | "annual" | "lifetime" | null;
  access_expires_at: string | null;
};

const blankCompany: CompanyInfo = {
  name: "",
  tagline: "",
  document: "",
  contact: "",
  email: "",
  address: "",
  logo: "",
  primaryColor: "#A6400D",
  secondaryColor: "#E59A2E",
};

const navItems = [
  { id: "dashboard" as const, label: "Início", icon: Home },
  { id: "clients" as const, label: "Clientes", icon: FolderOpen },
  { id: "quote" as const, label: "Novo", icon: Plus },
  { id: "documents" as const, label: "PDFs", icon: FileText },
  { id: "settings" as const, label: "Ajustes", icon: Settings },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label>
    <span className="field-label">{label}</span>
    {children}
  </label>
);

function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
      <div>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand)]">{eyebrow}</p>
        <h1 className="text-[1.7rem] font-extrabold tracking-[-0.04em] text-[#172321] md:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function mixColor(hex: string, target: string, amount: number) {
  const read = (value: string, index: number) => Number.parseInt(value.slice(index, index + 2), 16);
  const channel = (from: number, to: number) => Math.round(from + (to - from) * amount).toString(16).padStart(2, "0");
  return `#${channel(read(hex, 1), read(target, 1))}${channel(read(hex, 3), read(target, 3))}${channel(read(hex, 5), read(target, 5))}`;
}

function companyTheme(company: CompanyInfo): React.CSSProperties {
  const primary = /^#[\da-f]{6}$/i.test(company.primaryColor) ? company.primaryColor : blankCompany.primaryColor;
  const secondary = /^#[\da-f]{6}$/i.test(company.secondaryColor) ? company.secondaryColor : blankCompany.secondaryColor;
  return {
    "--brand": primary,
    "--brand-dark": mixColor(primary, "#000000", 0.18),
    "--brand-soft": mixColor(primary, "#ffffff", 0.9),
    "--brand-border": mixColor(primary, "#ffffff", 0.58),
    "--accent": secondary,
  } as React.CSSProperties;
}

export function ConstructionBudgetApp({
  userId,
  userEmail,
  access,
  onOpenPlans,
  onSignOut,
}: {
  userId: string;
  userEmail: string;
  access: AccessInfo;
  onOpenPlans: () => void;
  onSignOut: () => void;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [view, setView] = useState<View>("dashboard");
  const [company, setCompany] = useState<CompanyInfo>(blankCompany);
  const [clients, setClients] = useState<ConstructionClient[]>([]);
  const [quotes, setQuotes] = useState<ConstructionQuote[]>([]);
  const [quote, setQuote] = useState<ConstructionQuote | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const nextNumber = () =>
    `OBR-${new Date().getFullYear()}-${String(
      quotes.reduce(
        (highest, item) => Math.max(highest, Number(item.number.match(/(\d+)$/)?.[1] || 0)),
        0,
      ) + 1,
    ).padStart(3, "0")}`;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void (async () => {
      const [companyResult, clientsResult, quotesResult] = await Promise.all([
        supabase
          .from("construction_company_profiles")
          .select("name,tagline,document,contact,email,address,logo_data,primary_color,secondary_color")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("construction_clients")
          .select("id,name,phone,email,document,project_name,address,created_at,updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("construction_quotes")
          .select("payload,pdf_generated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
      ]);

      if (companyResult.data) {
        const row = companyResult.data;
        setCompany({
          name: row.name || "",
          tagline: row.tagline || "",
          document: row.document || "",
          contact: row.contact || "",
          email: row.email || "",
          address: row.address || "",
          logo: row.logo_data || "",
          primaryColor: row.primary_color || "#A6400D",
          secondaryColor: row.secondary_color || "#E59A2E",
        });
      }

      setClients(
        (clientsResult.data || []).map((client) => ({
          id: client.id,
          name: client.name || "",
          phone: client.phone || "",
          email: client.email || "",
          document: client.document || "",
          address: client.address || "",
          projectName: client.project_name || "",
          createdAt: client.created_at,
          updatedAt: client.updated_at,
        })),
      );

      setQuotes(
        (quotesResult.data || [])
          .map((row) => ({ payload: row.payload as ConstructionQuote, pdfGeneratedAt: row.pdf_generated_at }))
          .filter(({ payload }) => payload?.product === "obra-civil")
          .map(({ payload, pdfGeneratedAt }) => ({
            ...payload,
            pdfGeneratedAt: pdfGeneratedAt || payload.pdfGeneratedAt || undefined,
          })),
      );

      setLoading(false);
    })();
  }, [supabase, userId]);

  const begin = (client?: ConstructionClient) => {
    const next = createConstructionQuote(nextNumber());
    if (client) {
      next.clientId = client.id;
      next.client = {
        name: client.name,
        phone: client.phone,
        email: client.email,
        document: client.document,
        projectName: client.projectName || "",
        address: client.address,
      };
      next.work.name = client.projectName || "";
      next.work.address = client.address || "";
    }
    setQuote(next);
    setView("quote");
  };

  const save = async (generate = false) => {
    if (!quote || !supabase) return;
    setSaving(true);
    setNotice("");

    const saved: ConstructionQuote = { ...quote, updatedAt: new Date().toISOString() };
    const clientId = saved.clientId || uid();
    const now = new Date().toISOString();

    const clientResult = await supabase.from("construction_clients").upsert({
      id: clientId,
      user_id: userId,
      name: saved.client.name,
      phone: saved.client.phone,
      email: saved.client.email,
      document: saved.client.document,
      address: saved.client.address || saved.work.address,
      project_name: saved.work.name,
      created_at: now,
      updated_at: now,
    });

    if (clientResult.error) {
      setNotice("Não foi possível salvar o contratante do OrçaObra.");
      setSaving(false);
      return;
    }

    if (generate) {
      const pdf = await generateConstructionPdf({ ...saved, clientId }, company);
      const pdfPath = `obra-civil/${userId}/${clientId}/${saved.id}/${pdf.fileName}`;
      const upload = await supabase.storage.from("quote-pdfs").upload(pdfPath, pdf.blob, { contentType: "application/pdf", upsert: true });
      if (upload.error) {
        setNotice("Orçamento salvo, mas o PDF não pôde ser arquivado.");
      } else {
        saved.pdfStoragePath = pdfPath;
        saved.pdfGeneratedAt = new Date().toISOString();
        const url = URL.createObjectURL(pdf.blob);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    const result = await supabase.from("construction_quotes").upsert({
      id: saved.id,
      user_id: userId,
      client_id: clientId,
      quote_number: saved.number,
      client_name: saved.client.name,
      payload: { ...saved, clientId },
      pdf_generated_at: saved.pdfGeneratedAt || null,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      setNotice("Não foi possível salvar o orçamento de obra.");
    } else {
      const current = { ...saved, clientId };
      setQuote(current);
      setQuotes((items) => [current, ...items.filter((item) => item.id !== current.id)]);
      setClients((items) => {
        const currentClient: ConstructionClient = {
          id: clientId,
          name: saved.client.name,
          phone: saved.client.phone,
          email: saved.client.email,
          document: saved.client.document,
          address: saved.client.address || saved.work.address,
          projectName: saved.work.name,
          createdAt: now,
          updatedAt: now,
        };
        return [currentClient, ...items.filter((item) => item.id !== clientId)];
      });
      setNotice(generate ? "PDF do OrçaObra gerado e arquivado." : "Orçamento de obra salvo.");
    }

    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Excluir este orçamento de obra?")) return;
    const { error } = await supabase.from("construction_quotes").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      setNotice("Não foi possível excluir o orçamento de obra.");
      return;
    }
    setQuotes((items) => items.filter((item) => item.id !== id));
    setNotice("Orçamento excluído.");
  };

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type)) return setNotice("Use uma logo em PNG, JPG ou WebP.");
    if (file.size > 8_000_000) return setNotice("A logo deve ter no máximo 8 MB.");
    const reader = new FileReader();
    reader.onload = () => setCompany((current) => ({ ...current, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const saveCompany = async () => {
    if (!supabase) return;
    if (!company.name.trim() || !company.contact.trim()) return setNotice("Informe o nome e o contato da empresa.");
    setSavingCompany(true);
    const { error } = await supabase.from("construction_company_profiles").upsert({
      user_id: userId,
      name: company.name.trim(),
      tagline: (company.tagline || "").trim(),
      document: company.document,
      contact: company.contact,
      email: company.email,
      address: company.address,
      logo_data: company.logo,
      primary_color: company.primaryColor,
      secondary_color: company.secondaryColor,
      updated_at: new Date().toISOString(),
    });
    setSavingCompany(false);
    setNotice(error ? "Não foi possível salvar os dados da empresa." : "Dados da empresa salvos.");
  };

  const filteredClients = clients.filter((client) => `${client.name} ${client.phone} ${client.email} ${client.address}`.toLowerCase().includes(search.toLowerCase()));
  const pdfs = quotes.filter((item) => item.pdfGeneratedAt).filter((item) => `${item.client.name} ${item.number} ${item.work.name}`.toLowerCase().includes(search.toLowerCase()));
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const trialDays = access.subscription_status === "active" ? null : Math.max(1, Math.ceil((new Date(access.trial_ends_at).getTime() - Date.now()) / 86_400_000));

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#fff8f3]"><BrandMark loading product="obra" /></main>;
  }

  const renderDashboard = () => {
    const approved = quotes.filter((item) => item.financial.status === "approved");
    const pending = quotes.filter((item) => item.financial.status === "pending");
    const approvedValue = approved.reduce((sum, item) => sum + constructionTotal(item), 0);
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Visão geral" title="Seu negócio" action={<button onClick={() => begin()} className="primary-button !min-h-11 !px-3 md:!px-4"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span><span className="sm:hidden">Novo</span></button>} />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="app-card col-span-2 overflow-hidden bg-[var(--brand-dark)] p-5 text-white lg:col-span-1"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-semibold text-white/75">Total aprovado</span><BadgeCheck size={19} style={{ color: "var(--accent)" }} /></div><p className="text-2xl font-extrabold tracking-[-0.04em]">{brl(approvedValue)}</p><p className="mt-1 text-sm text-white/70">{approved.length} {approved.length === 1 ? "obra" : "obras"}</p></div>
          <div className="app-card p-4 md:p-5"><FolderOpen size={19} className="mb-7 text-[var(--brand)]" /><p className="text-2xl font-extrabold">{clients.length}</p><p className="mt-1 text-sm text-[#74837f]">Clientes</p></div>
          <div className="app-card p-4 md:p-5"><FileClock size={19} className="mb-7 text-amber-600" /><p className="text-2xl font-extrabold">{pending.length}</p><p className="mt-1 text-sm text-[#74837f]">Pendentes</p></div>
          <div className="app-card p-4 md:p-5"><FileText size={19} className="mb-7 text-[var(--brand)]" /><p className="text-2xl font-extrabold">{pdfs.length}</p><p className="mt-1 text-sm text-[#74837f]">PDFs gerados</p></div>
        </div>
        <div className="app-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Orçamentos recentes</h2><button onClick={() => { setSearch(""); setView("documents"); }} className="text-sm font-bold text-[var(--brand)]">Ver PDFs</button></div>
          {quotes.length ? <div className="divide-y divide-[#e7eeec]">{quotes.slice(0, 6).map((item) => <button className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#fbfdfc] sm:px-5" onClick={() => { setQuote(item); setView("quote"); }} key={item.id}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Building2 size={21} /></span><span className="min-w-0 flex-1"><b className="block truncate">{item.work.name || item.client.name || "Obra sem nome"}</b><small className="mt-1 block truncate text-[#74837f]">{item.number} · {constructionSummary(item)}</small></span><b className="text-[var(--brand)]">{brl(constructionTotal(item))}</b></button>)}</div> : <Empty text="Crie o primeiro orçamento com etapas, serviços e custos da obra." action={() => begin()} />}
        </div>
      </section>
    );
  };

  const renderClients = () => {
    if (selectedClient) {
      const clientQuotes = quotes.filter((item) => item.clientId === selectedClient.id);
      return (
        <section className="view-enter">
          <button onClick={() => setSelectedClientId(null)} className="quiet-button mb-4 !px-2"><ChevronLeft size={18} />Todos os clientes</button>
          <PageHeading eyebrow="Pasta do cliente" title={selectedClient.name || "Cliente sem nome"} action={<button onClick={() => begin(selectedClient)} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Nova obra</span></button>} />
          <div className="mb-5 grid gap-3 md:grid-cols-3"><div className="app-card p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#81908c]">Contato</p><p className="mt-2 font-semibold">{selectedClient.phone || "Não informado"}</p><p className="mt-1 break-all text-sm text-[#687875]">{selectedClient.email || "Sem e-mail"}</p></div><div className="app-card p-4 md:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-[#81908c]">Local da obra</p><p className="mt-2 text-sm font-semibold leading-6">{selectedClient.address || "Não informado"}</p></div></div>
          <div className="app-card overflow-hidden"><div className="border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Obras e orçamentos</h2></div>{clientQuotes.length ? <div className="divide-y divide-[#e7eeec]">{clientQuotes.map((item) => <button key={item.id} onClick={() => { setQuote(item); setView("quote"); }} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-[#f8fbfa] sm:px-5"><FileText className="text-[var(--brand)]" size={20} /><span className="min-w-0 flex-1"><b className="block truncate">{item.work.name || item.number}</b><small className="text-[#74837f]">{item.number} · {brl(constructionTotal(item))}</small></span><ChevronRight size={19} className="text-[#93a19e]" /></button>)}</div> : <Empty text="Nenhuma obra cadastrada para este cliente." action={() => begin(selectedClient)} />}</div>
        </section>
      );
    }
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Cadastro" title="Clientes" action={<button onClick={() => begin()} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Adicionar cliente</span></button>} />
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar cliente" />
        <div className="app-card overflow-hidden">{filteredClients.length ? <div className="divide-y divide-[#e7eeec]">{filteredClients.map((client) => <button key={client.id} onClick={() => setSelectedClientId(client.id)} className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f8fbfa] sm:px-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Folder size={22} fill="currentColor" className="opacity-90" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold">{client.name || "Cliente sem nome"}</span><span className="mt-1 block truncate text-sm text-[#74837f]">{client.phone || client.address || "Sem contato"}</span></span><ChevronRight size={19} className="shrink-0 text-[#93a19e]" /></button>)}</div> : <Empty text={search ? "Nenhum cliente encontrado." : "Os clientes aparecem aqui ao salvar o primeiro orçamento."} action={() => begin()} />}</div>
      </section>
    );
  };

  const renderDocuments = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Arquivo" title="PDFs gerados" action={<button onClick={() => begin()} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span></button>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Buscar PDF por cliente ou número" />
      <div className="app-card overflow-hidden">{pdfs.length ? <div className="divide-y divide-[#e7eeec]">{pdfs.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-4 sm:px-5"><FileText className="text-[var(--brand)]" /><span className="min-w-0 flex-1"><b className="block truncate">{item.work.name || item.client.name}</b><small className="text-[#74837f]">{item.number} · {item.pdfGeneratedAt ? `PDF em ${date(item.pdfGeneratedAt)}` : "Ainda não gerado"}</small></span><button onClick={() => { setQuote(item); setView("quote"); }} className="quiet-button !min-h-9">Editar</button><button onClick={() => void remove(item.id)} className="quiet-button !min-h-9 !px-2 text-rose-600"><Trash2 size={16} /></button></div>)}</div> : <div className="grid min-h-64 place-items-center p-6 text-center text-sm text-[#74837f]">Nenhum PDF arquivado.</div>}</div>
    </section>
  );

  const renderSettings = () => {
    const activePlan = access.subscription_status === "active" && access.plan_type;
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Perfil" title="Dados da empresa" />
        <div className="app-card overflow-hidden">
          <div className="border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Identidade e aparência</h2><p className="mt-1 text-sm text-[#74837f]">Esses dados aparecem nos PDFs do OrçaObra.</p></div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Nome da empresa"><input className="field-input" value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} placeholder="Sua construtora ou empresa" /></Field>
            <Field label="Frase da marca"><input className="field-input" value={company.tagline || ""} onChange={(event) => setCompany({ ...company, tagline: event.target.value })} placeholder="Construindo com qualidade e confiança" /></Field>
            <Field label="CPF/CNPJ"><input className="field-input" value={company.document} onChange={(event) => setCompany({ ...company, document: event.target.value })} /></Field>
            <Field label="Contato"><input className="field-input" value={company.contact} onChange={(event) => setCompany({ ...company, contact: event.target.value })} /></Field>
            <Field label="E-mail"><input className="field-input" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} /></Field>
            <Field label="Endereço"><input className="field-input" value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} /></Field>
            <label className="md:col-span-2"><span className="field-label">Logo da empresa</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleLogo(event.target.files?.[0])} className="field-input file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-soft)] file:px-3 file:py-2 file:font-bold file:text-[var(--brand)]" /></label>
            {company.logo && <div className="md:col-span-2"><img src={company.logo} alt="Logo da empresa" className="h-28 max-w-full rounded-2xl border border-[#e3ebe9] bg-white object-contain p-3" /></div>}
            <Field label="Cor principal"><input type="color" className="h-12 w-full rounded-xl border border-[#d9e3e0] bg-white p-1" value={company.primaryColor} onChange={(event) => setCompany({ ...company, primaryColor: event.target.value })} /></Field>
            <Field label="Cor secundária"><input type="color" className="h-12 w-full rounded-xl border border-[#d9e3e0] bg-white p-1" value={company.secondaryColor} onChange={(event) => setCompany({ ...company, secondaryColor: event.target.value })} /></Field>
          </div>
          <div className="flex justify-end border-t border-[#e3ebe9] p-5"><button disabled={savingCompany} onClick={() => void saveCompany()} className="primary-button w-full sm:w-auto"><Save size={17} />{savingCompany ? "Salvando…" : "Salvar alterações"}</button></div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e6a85a] bg-[linear-gradient(135deg,#fff9ed,#fff0dc)] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9a571d]">Plano do OrçaObra</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-extrabold text-[#2d2119]">{activePlan ? `Plano ${access.plan_type === "monthly" ? "Mensal" : access.plan_type === "annual" ? "Anual" : "Vitalício"}` : `Período grátis${trialDays ? ` · ${trialDays} dias restantes` : ""}`}</h2><p className="mt-1 text-sm text-[#765e4e]">Pagamentos avulsos por período. Não há renovação automática.</p></div>
            <button type="button" onClick={onOpenPlans} className="min-h-12 rounded-xl bg-[#e4571f] px-5 font-extrabold text-white shadow-[0_10px_24px_rgba(228,87,31,0.24)] transition-colors hover:bg-[#c94416]">{activePlan ? "Ver upgrades" : "Ver planos"}</button>
          </div>
        </div>

        <div className="app-card mt-5 p-5"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><Users size={22} /></span><div className="min-w-0"><p className="font-bold">Conta</p><p className="mt-1 truncate text-sm text-[#74837f]">{userEmail}</p></div><button onClick={onSignOut} className="quiet-button ml-auto !min-h-10"><LogOut size={17} />Sair</button></div></div>
      </section>
    );
  };

  return (
    <div className="min-h-screen" style={companyTheme(company)}>
      <header className="sticky top-0 z-30 border-b border-[#dce6e3]/80 bg-white/88 backdrop-blur-xl"><div className="mx-auto flex h-[4.65rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"><BrandMark product="obra" /><div className="flex items-center gap-2">{trialDays && <span className="hidden rounded-full bg-[#fff0df] px-3 py-1.5 text-xs font-bold text-[#8a4a16] sm:block">{trialDays} {trialDays === 1 ? "dia grátis" : "dias grátis"}</span>}<button type="button" onClick={onOpenPlans} className="hidden min-h-10 rounded-xl bg-[#e4571f] px-4 text-sm font-extrabold text-white shadow-sm sm:inline-flex sm:items-center">Planos</button></div></div></header>
      <main className="content-safe mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        {notice && <div role="status" className="mb-5 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand)]">{notice}</div>}
        {view === "dashboard" && renderDashboard()}
        {view === "clients" && renderClients()}
        {view === "documents" && renderDocuments()}
        {view === "settings" && renderSettings()}
        {view === "quote" && quote && <Editor quote={quote} setQuote={setQuote} onBack={() => setView("dashboard")} onSave={() => void save(false)} onGenerate={() => void save(true)} saving={saving} />}
      </main>
      <nav className="app-bottom-nav nav-safe fixed inset-x-0 bottom-0 z-40 border-t bg-white/94 px-2 pt-2 shadow-[0_-10px_35px_rgba(24,52,48,0.09)] backdrop-blur-xl" style={{ borderTopColor: "var(--accent)" }} aria-label="Navegação principal"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; const isNew = item.id === "quote"; return <button key={item.id} onClick={() => isNew ? begin() : (setSearch(""), setSelectedClientId(null), setView(item.id))} aria-current={active ? "page" : undefined} className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors ${active ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[#758580] hover:bg-[#f2f6f5] hover:text-[#30413e]"}`}><span className={isNew ? "grid h-7 w-7 place-items-center rounded-full bg-[var(--brand)] text-white shadow-md" : ""}><Icon size={isNew ? 18 : 20} strokeWidth={active || isNew ? 2.6 : 2} /></span><span className="text-xs font-bold">{item.label}</span></button>; })}</div></nav>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative mb-4 block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83918e]" size={18} /><input className="field-input !pl-11" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}

function Empty({ text, action }: { text: string; action: () => void }) {
  return <div className="grid min-h-64 place-items-center p-6 text-center"><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><Building2 size={25} /></div><p className="mx-auto max-w-xs text-sm leading-6 text-[#74837f]">{text}</p><button onClick={action} className="secondary-button mt-5"><Plus size={17} />Começar</button></div></div>;
}

function Editor({
  quote,
  setQuote,
  onBack,
  onSave,
  onGenerate,
  saving,
}: {
  quote: ConstructionQuote;
  setQuote: (quote: ConstructionQuote) => void;
  onBack: () => void;
  onSave: () => void;
  onGenerate: () => void;
  saving: boolean;
}) {
  const update = (path: "client" | "work" | "financial", field: string, value: string) => setQuote({ ...quote, [path]: { ...quote[path], [field]: value } } as ConstructionQuote);
  const updateItem = (id: string, field: keyof ConstructionItem, value: string) => setQuote({ ...quote, items: quote.items.map((item) => item.id === id ? { ...item, [field]: value } : item) });
  const add = () => setQuote({ ...quote, items: [...quote.items, emptyConstructionItem()] });
  const del = (id: string) => setQuote({ ...quote, items: quote.items.length > 1 ? quote.items.filter((item) => item.id !== id) : quote.items });

  return (
    <section className="view-enter">
      <button onClick={onBack} className="quiet-button mb-4 !px-2"><ChevronLeft size={18} />Voltar</button>
      <PageHeading eyebrow={`${quote.number} · REV. ${String(quote.revision || 1).padStart(2, "0")}`} title="Orçamento de obra" action={<span className="rounded-full bg-[var(--brand-soft)] px-3 py-2 text-sm font-extrabold text-[var(--brand)]">{brl(constructionTotal(quote))}</span>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="space-y-5">
          <section className="app-card p-5"><h2 className="font-extrabold">1. Contratante e identificação da obra</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Nome / razão social"><input className="field-input" value={quote.client.name} onChange={(event) => update("client", "name", event.target.value)} /></Field><Field label="CPF/CNPJ"><input className="field-input" value={quote.client.document} onChange={(event) => update("client", "document", event.target.value)} /></Field><Field label="Telefone"><input className="field-input" value={quote.client.phone} onChange={(event) => update("client", "phone", event.target.value)} /></Field><Field label="E-mail"><input className="field-input" value={quote.client.email} onChange={(event) => update("client", "email", event.target.value)} /></Field><Field label="Nome da obra"><input className="field-input" value={quote.work.name} onChange={(event) => update("work", "name", event.target.value)} placeholder="Ex.: Reforma residência Silva" /></Field><Field label="Tipo"><input className="field-input" value={quote.work.type} onChange={(event) => update("work", "type", event.target.value)} /></Field><Field label="Endereço da obra"><input className="field-input" value={quote.work.address} onChange={(event) => update("work", "address", event.target.value)} /></Field><Field label="Área estimada (m²)"><input inputMode="decimal" className="field-input" value={quote.work.area} onChange={(event) => update("work", "area", event.target.value)} /></Field><Field label="Prazo previsto"><input className="field-input" value={quote.work.duration} onChange={(event) => update("work", "duration", event.target.value)} placeholder="Ex.: 90 dias" /></Field><Field label="Responsável técnico"><input className="field-input" value={quote.work.technicalResponsible} onChange={(event) => update("work", "technicalResponsible", event.target.value)} placeholder="Nome / CREA ou CAU, quando aplicável" /></Field><Field label="Referência de preços"><input className="field-input" value={quote.work.priceReference} onChange={(event) => update("work", "priceReference", event.target.value)} placeholder="Ex.: Mercado local · set/2026" /></Field></div><Field label="Escopo e premissas"><textarea className="field-input mt-1 min-h-24" value={quote.work.scope} onChange={(event) => update("work", "scope", event.target.value)} placeholder="Descreva o que será executado, condições do local e premissas de medição." /></Field></section>
          <section className="app-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ebe9] p-5"><div><h2 className="font-extrabold">2. Planilha de serviços</h2><p className="mt-1 text-sm text-[#74837f]">Separe materiais, mão de obra e equipamentos para formar o custo direto.</p></div><button onClick={add} className="quiet-button text-[var(--brand)]"><Plus size={16} />Adicionar serviço</button></div><div className="space-y-4 p-4">{quote.items.map((item, index) => <article key={item.id} className="rounded-2xl border border-[#e3ebe9] p-4"><div className="mb-3 flex items-center justify-between"><b className="text-sm text-[var(--brand)]">SERVIÇO {String(index + 1).padStart(2, "0")}</b><button onClick={() => del(item.id)} className="text-sm font-bold text-rose-600">Remover</button></div><div className="grid gap-3 md:grid-cols-6"><Field label="Etapa"><select className="field-input" value={item.phase} onChange={(event) => updateItem(item.id, "phase", event.target.value)}>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></Field><Field label="Código"><input className="field-input" value={item.code} onChange={(event) => updateItem(item.id, "code", event.target.value)} placeholder="SINAPI opcional" /></Field><Field label="Serviço"><input className="field-input md:col-span-2" value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} placeholder="Ex.: Alvenaria de vedação" /></Field><Field label="Unidade"><input className="field-input" value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)} placeholder="m², m³, un" /></Field><Field label="Quantidade"><input inputMode="decimal" className="field-input" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></Field><Field label="Materiais (un.)"><input inputMode="decimal" className="field-input" value={item.material} onChange={(event) => updateItem(item.id, "material", event.target.value)} placeholder="R$ 0,00" /></Field><Field label="Mão de obra (un.)"><input inputMode="decimal" className="field-input" value={item.labor} onChange={(event) => updateItem(item.id, "labor", event.target.value)} placeholder="R$ 0,00" /></Field><Field label="Equipamentos (un.)"><input inputMode="decimal" className="field-input" value={item.equipment} onChange={(event) => updateItem(item.id, "equipment", event.target.value)} placeholder="R$ 0,00" /></Field><Field label="Observação"><input className="field-input" value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} placeholder="Especificação, marca ou ressalva" /></Field><div className="rounded-xl bg-[var(--brand-soft)] p-3 md:col-span-2"><span className="text-xs font-bold text-[#74837f]">TOTAL DO SERVIÇO</span><b className="mt-1 block text-[var(--brand)]">{brl(itemTotal(item))}</b></div></div></article>)}</div></section>
          <section className="app-card p-5"><h2 className="font-extrabold">3. Condições e fechamento</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="BDI / custos indiretos (%)"><input inputMode="decimal" className="field-input" value={quote.financial.bdi} onChange={(event) => update("financial", "bdi", event.target.value)} placeholder="Ex.: 20" /></Field><Field label="Desconto"><input inputMode="decimal" className="field-input" value={quote.financial.discount} onChange={(event) => update("financial", "discount", event.target.value)} placeholder="R$ 0,00" /></Field><Field label="Validade (dias)"><input inputMode="numeric" className="field-input" value={quote.financial.validityDays} onChange={(event) => update("financial", "validityDays", event.target.value)} /></Field></div><Field label="Condições de pagamento"><textarea className="field-input mt-1 min-h-20" value={quote.financial.paymentTerms} onChange={(event) => update("financial", "paymentTerms", event.target.value)} /></Field><Field label="Incluso"><textarea className="field-input mt-1 min-h-20" value={quote.financial.inclusions} onChange={(event) => update("financial", "inclusions", event.target.value)} /></Field><Field label="Não incluso"><textarea className="field-input mt-1 min-h-20" value={quote.financial.exclusions} onChange={(event) => update("financial", "exclusions", event.target.value)} /></Field><Field label="Observações"><textarea className="field-input mt-1 min-h-20" value={quote.financial.notes} onChange={(event) => update("financial", "notes", event.target.value)} /></Field></section>
        </div>
        <aside className="app-card h-fit p-5 lg:sticky lg:top-24"><p className="text-xs font-extrabold tracking-[.16em] text-[var(--brand)]">RESUMO</p><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Custo direto</span><b>{brl(quote.items.reduce((sum, item) => sum + itemTotal(item), 0))}</b></div><div className="flex justify-between"><span>BDI / indiretos</span><b>{quote.financial.bdi || 0}%</b></div><div className="border-t border-[#e3ebe9] pt-3 text-base font-extrabold text-[var(--brand)]"><span>Valor da proposta</span><b className="mt-1 block text-2xl">{brl(constructionTotal(quote))}</b></div></div><button disabled={saving} onClick={onGenerate} className="primary-button mt-6 w-full">{saving ? "Gerando…" : "Gerar e arquivar PDF"}</button><button disabled={saving} onClick={onSave} className="secondary-button mt-2 w-full">Salvar orçamento</button><p className="mt-4 text-xs leading-5 text-[#74837f]">O PDF mostra custos diretos, BDI, escopo, etapas, condições e aceite.</p></aside>
      </div>
    </section>
  );
}
