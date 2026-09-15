"use client";

import { Building2, ChevronLeft, FileText, LogOut, Plus, Save, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountProfile, CompanyInfo, RegisteredClient } from "@/lib/types";
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

type View = "dashboard" | "clients" | "quote" | "documents";

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

export function ConstructionBudgetApp({
  userId,
  onSignOut,
}: {
  userId: string;
  profile: AccountProfile | null;
  onSignOut: () => void;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [view, setView] = useState<View>("dashboard");
  const [company, setCompany] = useState<CompanyInfo>(blankCompany);
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [quotes, setQuotes] = useState<ConstructionQuote[]>([]);
  const [quote, setQuote] = useState<ConstructionQuote | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          .map((row) => row.payload as ConstructionQuote)
          .filter((item) => item?.product === "obra-civil")
          .map((item, index) => ({
            ...item,
            pdfGeneratedAt:
              quotesResult.data?.[index]?.pdf_generated_at || item.pdfGeneratedAt || undefined,
          })),
      );

      setLoading(false);
    })();
  }, [supabase, userId]);

  const begin = (client?: RegisteredClient) => {
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

    const saved: ConstructionQuote = {
      ...quote,
      updatedAt: new Date().toISOString(),
    };
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
      const upload = await supabase.storage
        .from("quote-pdfs")
        .upload(pdfPath, pdf.blob, { contentType: "application/pdf", upsert: true });

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
        const currentClient: RegisteredClient = {
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
    const { error } = await supabase
      .from("construction_quotes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setNotice("Não foi possível excluir o orçamento de obra.");
      return;
    }

    setQuotes((items) => items.filter((item) => item.id !== id));
    setNotice("Orçamento excluído.");
  };

  const nav = (target: View) => (
    <button
      onClick={() => setView(target)}
      className={`rounded-xl px-3 py-2 text-sm font-bold ${
        view === target ? "bg-[#a6400d] text-white" : "text-[#66584e] hover:bg-[#fff1e8]"
      }`}
    >
      {target === "dashboard"
        ? "Painel"
        : target === "clients"
          ? "Clientes"
          : target === "documents"
            ? "PDFs"
            : "Orçamento"}
    </button>
  );

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8f3]">
        <Building2 className="animate-pulse text-[#a6400d]" size={32} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f3] text-[#2a2825]">
      <header className="border-b border-[#f0ded1] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/orcaobra-logo.png" alt="Logo do OrçaObra" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <b className="block leading-none">OrçaObra</b>
              <span className="text-xs text-[#8c7768]">Construção e reformas</span>
            </div>
          </div>
          <nav className="ml-auto flex gap-1">
            {nav("dashboard")}
            {nav("clients")}
            {nav("documents")}
          </nav>
          <button onClick={onSignOut} className="quiet-button !min-h-9 !px-3">
            <LogOut size={16} />Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {notice && (
          <p className="mb-5 rounded-xl bg-[#fff0df] px-4 py-3 text-sm font-semibold text-[#9a4d1d]">
            {notice}
          </p>
        )}
        {view === "dashboard" && (
          <Dashboard
            quotes={quotes}
            onNew={() => begin()}
            onEdit={(item) => {
              setQuote(item);
              setView("quote");
            }}
          />
        )}
        {view === "clients" && <Clients clients={clients} onNew={() => begin()} onChoose={begin} />}
        {view === "documents" && (
          <Documents
            quotes={quotes}
            onEdit={(item) => {
              setQuote(item);
              setView("quote");
            }}
            onDelete={remove}
          />
        )}
        {view === "quote" && quote && (
          <Editor
            quote={quote}
            setQuote={setQuote}
            onBack={() => setView("dashboard")}
            onSave={() => void save(false)}
            onGenerate={() => void save(true)}
            saving={saving}
          />
        )}
      </div>
    </main>
  );
}

function Dashboard({
  quotes,
  onNew,
  onEdit,
}: {
  quotes: ConstructionQuote[];
  onNew: () => void;
  onEdit: (quote: ConstructionQuote) => void;
}) {
  const total = quotes.reduce((sum, quote) => sum + constructionTotal(quote), 0);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-[#a6400d]">ORÇAMENTOS DE OBRA</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em]">Sua obra, planejada antes de começar.</h1>
        </div>
        <button className="primary-button !bg-[#a6400d]" onClick={onNew}>
          <Plus size={18} />Novo orçamento
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Orçamentos" value={String(quotes.length)} icon={<FileText />} />
        <Stat label="Valor em propostas" value={brl(total)} icon={<Building2 />} />
        <Stat
          label="Para revisar"
          value={String(quotes.filter((quote) => quote.financial.status !== "approved").length)}
          icon={<Save />}
        />
      </div>

      <section className="app-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#f0e5dd] p-5">
          <h2 className="font-extrabold">Orçamentos recentes</h2>
          <button className="text-sm font-bold text-[#a6400d]" onClick={onNew}>Criar orçamento</button>
        </div>
        {quotes.length ? (
          <div className="divide-y divide-[#f0e5dd]">
            {quotes.slice(0, 6).map((quote) => (
              <button
                className="flex w-full items-center gap-4 p-5 text-left hover:bg-[#fffaf6]"
                onClick={() => onEdit(quote)}
                key={quote.id}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0df] text-[#a6400d]">
                  <Building2 size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{quote.work.name || quote.client.name || "Obra sem nome"}</b>
                  <small className="text-[#8c7768]">{quote.number} · {constructionSummary(quote)}</small>
                </span>
                <b className="text-[#a6400d]">{brl(constructionTotal(quote))}</b>
              </button>
            ))}
          </div>
        ) : (
          <Empty text="Crie o primeiro orçamento com etapas, serviços e custos da obra." action={onNew} />
        )}
      </section>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <article className="app-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0df] text-[#a6400d]">{icon}</span>
      <p className="mt-4 text-sm font-semibold text-[#8c7768]">{label}</p>
      <b className="mt-1 block text-2xl">{value}</b>
    </article>
  );
}

function Empty({ text, action }: { text: string; action: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-[#8c7768]">{text}</p>
      <button onClick={action} className="primary-button mt-4 !bg-[#a6400d]">
        <Plus size={17} />Começar
      </button>
    </div>
  );
}

function Clients({
  clients,
  onNew,
  onChoose,
}: {
  clients: RegisteredClient[];
  onNew: () => void;
  onChoose: (client: RegisteredClient) => void;
}) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-[#a6400d]">CLIENTES</p>
          <h1 className="mt-1 text-3xl font-extrabold">Contratantes e obras</h1>
        </div>
        <button className="primary-button !bg-[#a6400d]" onClick={onNew}>
          <Plus size={17} />Novo cliente
        </button>
      </div>
      <section className="app-card mt-6 overflow-hidden">
        {clients.length ? (
          <div className="divide-y divide-[#f0e5dd]">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => onChoose(client)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-[#fffaf6]"
              >
                <Users className="text-[#a6400d]" />
                <span>
                  <b className="block">{client.name || "Cliente sem nome"}</b>
                  <small className="text-[#8c7768]">{client.phone || client.address || "Sem contato"}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Empty text="Os clientes aparecem aqui ao salvar o primeiro orçamento." action={onNew} />
        )}
      </section>
    </>
  );
}

function Documents({
  quotes,
  onEdit,
  onDelete,
}: {
  quotes: ConstructionQuote[];
  onEdit: (quote: ConstructionQuote) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <p className="text-xs font-extrabold tracking-[.16em] text-[#a6400d]">DOCUMENTOS</p>
      <h1 className="mt-1 text-3xl font-extrabold">Propostas e PDFs</h1>
      <section className="app-card mt-6 overflow-hidden">
        {quotes.length ? (
          <div className="divide-y divide-[#f0e5dd]">
            {quotes.map((quote) => (
              <div key={quote.id} className="flex items-center gap-3 p-4">
                <FileText className="text-[#a6400d]" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{quote.work.name || quote.client.name}</b>
                  <small className="text-[#8c7768]">
                    {quote.number} · {quote.pdfGeneratedAt ? `PDF em ${date(quote.pdfGeneratedAt)}` : "Ainda não gerado"}
                  </small>
                </span>
                <button onClick={() => onEdit(quote)} className="quiet-button !min-h-9">Editar</button>
                <button onClick={() => onDelete(quote.id)} className="quiet-button !min-h-9 !px-2 text-rose-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#8c7768]">Os PDFs gerados ficam organizados aqui.</div>
        )}
      </section>
    </>
  );
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
  const update = (path: "client" | "work" | "financial", field: string, value: string) =>
    setQuote({ ...quote, [path]: { ...quote[path], [field]: value } } as ConstructionQuote);
  const updateItem = (id: string, field: keyof ConstructionItem, value: string) =>
    setQuote({ ...quote, items: quote.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)) });
  const add = () => setQuote({ ...quote, items: [...quote.items, emptyConstructionItem()] });
  const del = (id: string) =>
    setQuote({ ...quote, items: quote.items.length > 1 ? quote.items.filter((item) => item.id !== id) : quote.items });

  return (
    <>
      <button onClick={onBack} className="quiet-button mb-5">
        <ChevronLeft size={17} />Voltar ao painel
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-[#a6400d]">
            {quote.number} · REV. {String(quote.revision || 1).padStart(2, "0")}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">Orçamento de obra</h1>
        </div>
        <span className="rounded-full bg-[#fff0df] px-3 py-2 text-sm font-extrabold text-[#a6400d]">
          Total: {brl(constructionTotal(quote))}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="space-y-5">
          <section className="app-card p-5">
            <h2 className="font-extrabold">1. Contratante e identificação da obra</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nome / razão social"><input className="field-input" value={quote.client.name} onChange={(event) => update("client", "name", event.target.value)} /></Field>
              <Field label="CPF/CNPJ"><input className="field-input" value={quote.client.document} onChange={(event) => update("client", "document", event.target.value)} /></Field>
              <Field label="Telefone"><input className="field-input" value={quote.client.phone} onChange={(event) => update("client", "phone", event.target.value)} /></Field>
              <Field label="E-mail"><input className="field-input" value={quote.client.email} onChange={(event) => update("client", "email", event.target.value)} /></Field>
              <Field label="Nome da obra"><input className="field-input" value={quote.work.name} onChange={(event) => update("work", "name", event.target.value)} placeholder="Ex.: Reforma residência Silva" /></Field>
              <Field label="Tipo"><input className="field-input" value={quote.work.type} onChange={(event) => update("work", "type", event.target.value)} /></Field>
              <Field label="Endereço da obra"><input className="field-input" value={quote.work.address} onChange={(event) => update("work", "address", event.target.value)} /></Field>
              <Field label="Área estimada (m²)"><input inputMode="decimal" className="field-input" value={quote.work.area} onChange={(event) => update("work", "area", event.target.value)} /></Field>
              <Field label="Prazo previsto"><input className="field-input" value={quote.work.duration} onChange={(event) => update("work", "duration", event.target.value)} placeholder="Ex.: 90 dias" /></Field>
              <Field label="Responsável técnico"><input className="field-input" value={quote.work.technicalResponsible} onChange={(event) => update("work", "technicalResponsible", event.target.value)} placeholder="Nome / CREA ou CAU, quando aplicável" /></Field>
              <Field label="Referência de preços"><input className="field-input" value={quote.work.priceReference} onChange={(event) => update("work", "priceReference", event.target.value)} placeholder="Ex.: Mercado local · set/2026" /></Field>
            </div>
            <Field label="Escopo e premissas"><textarea className="field-input mt-1 min-h-24" value={quote.work.scope} onChange={(event) => update("work", "scope", event.target.value)} placeholder="Descreva o que será executado, condições do local e premissas de medição." /></Field>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e5dd] p-5">
              <div>
                <h2 className="font-extrabold">2. Planilha de serviços</h2>
                <p className="mt-1 text-sm text-[#8c7768]">Separe materiais, mão de obra e equipamentos para formar o custo direto.</p>
              </div>
              <button onClick={add} className="quiet-button text-[#a6400d]"><Plus size={16} />Adicionar serviço</button>
            </div>
            <div className="space-y-4 p-4">
              {quote.items.map((item, index) => (
                <article key={item.id} className="rounded-2xl border border-[#f0e5dd] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <b className="text-sm text-[#a6400d]">SERVIÇO {String(index + 1).padStart(2, "0")}</b>
                    <button onClick={() => del(item.id)} className="text-sm font-bold text-rose-600">Remover</button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-6">
                    <Field label="Etapa"><select className="field-input" value={item.phase} onChange={(event) => updateItem(item.id, "phase", event.target.value)}>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></Field>
                    <Field label="Código"><input className="field-input" value={item.code} onChange={(event) => updateItem(item.id, "code", event.target.value)} placeholder="SINAPI opcional" /></Field>
                    <Field label="Serviço"><input className="field-input md:col-span-2" value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} placeholder="Ex.: Alvenaria de vedação" /></Field>
                    <Field label="Unidade"><input className="field-input" value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)} placeholder="m², m³, un" /></Field>
                    <Field label="Quantidade"><input inputMode="decimal" className="field-input" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></Field>
                    <Field label="Materiais (un.)"><input inputMode="decimal" className="field-input" value={item.material} onChange={(event) => updateItem(item.id, "material", event.target.value)} placeholder="R$ 0,00" /></Field>
                    <Field label="Mão de obra (un.)"><input inputMode="decimal" className="field-input" value={item.labor} onChange={(event) => updateItem(item.id, "labor", event.target.value)} placeholder="R$ 0,00" /></Field>
                    <Field label="Equipamentos (un.)"><input inputMode="decimal" className="field-input" value={item.equipment} onChange={(event) => updateItem(item.id, "equipment", event.target.value)} placeholder="R$ 0,00" /></Field>
                    <Field label="Observação"><input className="field-input" value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} placeholder="Especificação, marca ou ressalva" /></Field>
                    <div className="rounded-xl bg-[#fff6f0] p-3 md:col-span-2">
                      <span className="text-xs font-bold text-[#8c7768]">TOTAL DO SERVIÇO</span>
                      <b className="mt-1 block text-[#a6400d]">{brl(itemTotal(item))}</b>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="app-card p-5">
            <h2 className="font-extrabold">3. Condições e fechamento</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="BDI / custos indiretos (%)"><input inputMode="decimal" className="field-input" value={quote.financial.bdi} onChange={(event) => update("financial", "bdi", event.target.value)} placeholder="Ex.: 20" /></Field>
              <Field label="Desconto"><input inputMode="decimal" className="field-input" value={quote.financial.discount} onChange={(event) => update("financial", "discount", event.target.value)} placeholder="R$ 0,00" /></Field>
              <Field label="Validade (dias)"><input inputMode="numeric" className="field-input" value={quote.financial.validityDays} onChange={(event) => update("financial", "validityDays", event.target.value)} /></Field>
            </div>
            <Field label="Condições de pagamento"><textarea className="field-input mt-1 min-h-20" value={quote.financial.paymentTerms} onChange={(event) => update("financial", "paymentTerms", event.target.value)} /></Field>
            <Field label="Incluso"><textarea className="field-input mt-1 min-h-20" value={quote.financial.inclusions} onChange={(event) => update("financial", "inclusions", event.target.value)} /></Field>
            <Field label="Não incluso"><textarea className="field-input mt-1 min-h-20" value={quote.financial.exclusions} onChange={(event) => update("financial", "exclusions", event.target.value)} /></Field>
            <Field label="Observações"><textarea className="field-input mt-1 min-h-20" value={quote.financial.notes} onChange={(event) => update("financial", "notes", event.target.value)} /></Field>
          </section>
        </div>

        <aside className="app-card h-fit p-5 lg:sticky lg:top-5">
          <p className="text-xs font-extrabold tracking-[.16em] text-[#a6400d]">RESUMO</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Custo direto</span><b>{brl(quote.items.reduce((sum, item) => sum + itemTotal(item), 0))}</b></div>
            <div className="flex justify-between"><span>BDI / indiretos</span><b>{quote.financial.bdi || 0}%</b></div>
            <div className="border-t border-[#f0e5dd] pt-3 text-base font-extrabold text-[#a6400d]">
              <span>Valor da proposta</span>
              <b className="mt-1 block text-2xl">{brl(constructionTotal(quote))}</b>
            </div>
          </div>
          <button disabled={saving} onClick={onGenerate} className="primary-button mt-6 w-full !bg-[#a6400d]">
            {saving ? "Gerando…" : "Gerar e arquivar PDF"}
          </button>
          <button disabled={saving} onClick={onSave} className="secondary-button mt-2 w-full">Salvar orçamento</button>
          <p className="mt-4 text-xs leading-5 text-[#8c7768]">
            O PDF mostra custos diretos, BDI, escopo, etapas, condições e aceite sem expor dados internos desnecessários.
          </p>
        </aside>
      </div>
    </>
  );
}
