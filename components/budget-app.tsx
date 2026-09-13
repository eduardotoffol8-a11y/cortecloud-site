"use client";

import {
  BadgeCheck, Check, ChevronLeft, ChevronRight, Download, FileClock, FilePlus2, FileText,
  FileImage, Folder, FolderOpen, Home, MoreHorizontal, Paperclip, PencilLine, Plus, Search, Settings, Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import { CompanyForm } from "./company-form";
import { InstallAppButton } from "./install-app-button";
import { AccountSecurity } from "./account-security";
import { PasskeyCard } from "./passkey-card";
import { QuoteEditor } from "./quote-editor";
import type { AccountProfile, AppView, CompanyInfo, ProjectAttachment, Quote, QuoteStatus } from "@/lib/types";
import { brl, createEmptyQuote, emptyCompany, nextQuoteNumber, quoteTotal, statusLabel } from "@/lib/quote";
import { generateQuotePdf, type PdfProjectDocument, type PdfProjectImage } from "@/lib/pdf";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DRAFT_KEY = "orcamovel.draft.v2";
const HISTORY_KEY = "orcamovel.history.v2";
const COMPANY_KEY = "orcamovel.company.v2";

const navItems: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "clients", label: "Clientes", icon: FolderOpen },
  { id: "quote", label: "Novo", icon: Plus },
  { id: "documents", label: "PDFs", icon: FileText },
  { id: "settings", label: "Ajustes", icon: Settings },
];

const statusClass: Record<QuoteStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  declined: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
      <div><p className="mb-1 text-xs font-extrabold uppercase tracking-[0.17em] text-[#0f766e]">{eyebrow}</p><h1 className="text-[1.7rem] font-extrabold tracking-[-0.04em] text-[#172321] md:text-3xl">{title}</h1></div>
      {action}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(" de ", " ");
}

function isQuoteStarted(quote: Quote) {
  return Boolean(quote.client.name || quote.client.projectName || quote.furniture.some((item) => item.name || item.unitPrice));
}

function isUuid(value?: string) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function normalizeQuote(input: Quote): Quote {
  return {
    ...input,
    id: isUuid(input.id) ? input.id : crypto.randomUUID(),
    clientId: isUuid(input.clientId) ? input.clientId : crypto.randomUUID(),
    attachments: (input.attachments || []).map((attachment) => ({ ...attachment, includeInPdf: attachment.includeInPdf !== false })),
  };
}

function safeFileName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "arquivo";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function optimizeImageForPdf(blob: Blob) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const maximumSide = 1600;
  const scale = Math.min(1, maximumSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

type ClientFolder = { id: string; info: Quote["client"]; quotes: Quote[]; updatedAt: string };

export function BudgetApp({ userId, userEmail, profile, onSignOut }: { userId: string; userEmail: string; profile: AccountProfile | null; onSignOut: () => void }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [now] = useState(() => Date.now());
  const [view, setView] = useState<AppView>("dashboard");
  const [history, setHistory] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote>(() => createEmptyQuote());
  const [company, setCompany] = useState<CompanyInfo>(emptyCompany);
  const [hydrated, setHydrated] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [notice, setNotice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [menuQuote, setMenuQuote] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      let storedHistory: Quote[] = [];
      let storedCompany: CompanyInfo = emptyCompany;
      let storedDraft: Quote | null = null;
      try {
        storedHistory = (JSON.parse(localStorage.getItem(HISTORY_KEY) || localStorage.getItem("orcamovel.history.v1") || "[]") as Quote[]).map(normalizeQuote);
        storedCompany = JSON.parse(localStorage.getItem(COMPANY_KEY) || localStorage.getItem("orcamovel.company.v1") || "null") || emptyCompany;
        const rawDraft = JSON.parse(localStorage.getItem(DRAFT_KEY) || localStorage.getItem("orcamovel.draft.v1") || "null") as Quote | null;
        storedDraft = rawDraft ? normalizeQuote(rawDraft) : null;
      } catch {
        setNotice("Não foi possível recuperar os dados deste aparelho.");
      }

      let nextHistory = storedHistory;
      let nextCompany = storedCompany;
      let needsOnboarding = true;

      if (supabase) {
        const [companyResult, quotesResult, attachmentsResult] = await Promise.all([
          supabase.from("company_profiles").select("name,document,contact,email,address,logo_data").eq("user_id", userId).maybeSingle(),
          supabase.from("quotes").select("payload,pdf_generated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
          supabase.from("project_attachments").select("id,quote_id,file_name,storage_path,mime_type,size_bytes,created_at,include_in_pdf").eq("user_id", userId).order("created_at", { ascending: false }),
        ]);
        if (companyResult.data?.name) {
          nextCompany = { name: companyResult.data.name, document: companyResult.data.document || "", contact: companyResult.data.contact || "", email: companyResult.data.email || "", address: companyResult.data.address || "", logo: companyResult.data.logo_data || "" };
          needsOnboarding = false;
        }
        if (quotesResult.data?.length) {
          nextHistory = quotesResult.data.map((row) => {
            const payload = row.payload as Quote;
            const attachments = (attachmentsResult.data || []).filter((file) => file.quote_id === payload.id).map((file) => ({ id: file.id, name: file.file_name, path: file.storage_path, mimeType: file.mime_type, size: Number(file.size_bytes), createdAt: file.created_at, includeInPdf: file.include_in_pdf !== false }));
            return normalizeQuote({ ...payload, attachments, pdfGeneratedAt: row.pdf_generated_at || payload.pdfGeneratedAt });
          });
        }
      }

      if (!active) return;
      setCompany(nextCompany);
      setHistory(nextHistory);
      setQuote(storedDraft || createEmptyQuote(nextQuoteNumber(nextHistory)));
      setOnboarding(needsOnboarding);
      setHydrated(true);
    };
    void initialize();
    return () => { active = false; };
  }, [supabase, userId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...quote, updatedAt: new Date().toISOString() }));
  }, [quote, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(company)); } catch { /* Keep the form usable if device storage is full. */ }
  }, [company, hydrated]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const persistQuote = useCallback(async (saved: Quote) => {
    if (!supabase) return;
    const clientResult = await supabase.from("clients").upsert({
      id: saved.clientId, user_id: userId, name: saved.client.name || "Cliente sem nome", phone: saved.client.phone,
      email: saved.client.email, document: saved.client.document, project_name: saved.client.projectName,
      address: saved.client.address, updated_at: saved.updatedAt,
    });
    if (clientResult.error) throw clientResult.error;
    const quoteResult = await supabase.from("quotes").upsert({
      id: saved.id, user_id: userId, client_id: saved.clientId, quote_number: saved.number,
      client_name: saved.client.name, payload: saved, pdf_generated_at: saved.pdfGeneratedAt || null,
      created_at: saved.createdAt, updated_at: saved.updatedAt,
    });
    if (quoteResult.error) throw quoteResult.error;
  }, [supabase, userId]);

  const startNewQuote = useCallback(() => {
    if (isQuoteStarted(quote) && !window.confirm("Iniciar um novo orçamento? O rascunho atual será substituído.")) return;
    setQuote(createEmptyQuote(nextQuoteNumber(history)));
    setView("quote");
    setSelectedClientId(null);
    setNotice("Novo orçamento iniciado.");
  }, [history, quote]);

  const saveQuote = useCallback(async (showNotice = true) => {
    if (!quote.client.name.trim()) {
      setView("quote");
      setNotice("Informe o nome do cliente.");
      return null;
    }
    const saved = { ...quote, updatedAt: new Date().toISOString() };
    setHistory((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setQuote(saved);
    try {
      await persistQuote(saved);
      if (showNotice) setNotice("Orçamento salvo na sua conta.");
      return saved;
    } catch {
      setNotice("O orçamento ficou salvo neste aparelho e será sincronizado depois.");
      return saved;
    }
  }, [persistQuote, quote]);

  const loadIncludedProjectFiles = useCallback(async (source: Quote) => {
    if (!supabase) return { projectImages: [] as PdfProjectImage[], projectDocuments: [] as PdfProjectDocument[] };
    const included = (source.attachments || []).filter((attachment) => attachment.includeInPdf);
    const prepared = await Promise.all(included.map(async (attachment) => {
      const result = await supabase.storage.from("project-files").download(attachment.path);
      if (result.error || !result.data) throw result.error || new Error("Attachment unavailable");
      if (attachment.mimeType === "application/pdf") {
        return { document: { name: attachment.name, bytes: await result.data.arrayBuffer() } as PdfProjectDocument };
      }
      if (attachment.mimeType.startsWith("image/")) {
        return { image: { name: attachment.name, dataUrl: await optimizeImageForPdf(result.data) } as PdfProjectImage };
      }
      return {};
    }));
    return {
      projectImages: prepared.flatMap((item) => item.image ? [item.image] : []),
      projectDocuments: prepared.flatMap((item) => item.document ? [item.document] : []),
    };
  }, [supabase]);

  const handleGeneratePdf = async () => {
    if (!company.name) { setView("settings"); return setNotice("Cadastre a marcenaria antes de gerar o PDF."); }
    if (!quote.client.name) return setNotice("Informe o nome do cliente.");
    if (!quote.furniture.some((item) => item.name)) return setNotice("Adicione o nome de pelo menos um móvel.");
    setIsGenerating(true);
    try {
      const timestamp = new Date().toISOString();
      const pdfStoragePath = quote.pdfStoragePath || `${userId}/${quote.id}.pdf`;
      const saved = { ...quote, updatedAt: timestamp, pdfGeneratedAt: timestamp, pdfStoragePath };
      const { projectImages, projectDocuments } = await loadIncludedProjectFiles(saved);
      const generated = await generateQuotePdf(saved, company, projectImages, projectDocuments);
      const upload = await supabase!.storage.from("quote-pdfs").upload(pdfStoragePath, generated.blob, { contentType: "application/pdf", upsert: true });
      if (upload.error) throw upload.error;
      await persistQuote(saved);
      setQuote(saved);
      setHistory((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      downloadBlob(generated.blob, generated.fileName);
      setNotice(quote.pdfGeneratedAt ? "PDF atualizado e arquivado." : "PDF gerado e arquivado.");
    } catch {
      setNotice("Não foi possível gerar o PDF. Confira os dados e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSavedPdf = async (saved: Quote) => {
    try {
      if (saved.pdfStoragePath && supabase) {
        const stored = await supabase.storage.from("quote-pdfs").download(saved.pdfStoragePath);
        if (!stored.error && stored.data) {
          downloadBlob(stored.data, `${saved.number}-${safeFileName(saved.client.name || "cliente")}.pdf`);
          setNotice("Download iniciado.");
          return;
        }
      }
      const { projectImages, projectDocuments } = await loadIncludedProjectFiles(saved);
      const generated = await generateQuotePdf(saved, company, projectImages, projectDocuments);
      downloadBlob(generated.blob, generated.fileName);
      setNotice("Download iniciado.");
    } catch {
      setNotice("Não foi possível baixar este PDF.");
    }
  };

  const openQuote = (selected: Quote) => {
    setQuote(selected);
    setView("quote");
    setMenuQuote(null);
    setSelectedClientId(null);
  };

  const updateQuoteStatus = async (id: string, status: QuoteStatus) => {
    const selected = history.find((item) => item.id === id);
    if (!selected) return;
    const updated = { ...selected, updatedAt: new Date().toISOString(), closing: { ...selected.closing, status } };
    setHistory((current) => current.map((item) => item.id === id ? updated : item));
    if (quote.id === id) setQuote(updated);
    try { await persistQuote(updated); } catch { setNotice("Status salvo neste aparelho; sincronização pendente."); }
  };

  const deleteQuote = async (id: string) => {
    if (!window.confirm("Excluir este orçamento?")) return;
    const selected = history.find((item) => item.id === id);
    const remaining = history.filter((item) => item.id !== id);
    setHistory(remaining);
    setMenuQuote(null);
    if (supabase) {
      const paths = selected?.attachments?.map((attachment) => attachment.path) || [];
      if (paths.length) await supabase.storage.from("project-files").remove(paths);
      if (selected?.pdfStoragePath) await supabase.storage.from("quote-pdfs").remove([selected.pdfStoragePath]);
      await supabase.from("quotes").delete().eq("id", id).eq("user_id", userId);
      if (selected && !remaining.some((item) => item.clientId === selected.clientId)) await supabase.from("clients").delete().eq("id", selected.clientId).eq("user_id", userId);
    }
  };

  const uploadProjectFiles = async (files: FileList) => {
    if (!supabase) return;
    if (!quote.client.name.trim()) return setNotice("Informe o nome do cliente antes de anexar arquivos.");
    const selectedFiles = Array.from(files);
    const invalid = selectedFiles.find((file) => !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 10_485_760);
    if (invalid) return setNotice("Use JPG, PNG, WebP ou PDF com até 10 MB.");
    setIsUploading(true);
    const saved = { ...quote, updatedAt: new Date().toISOString() };
    const additions: ProjectAttachment[] = [];
    try {
      await persistQuote(saved);
      for (const file of selectedFiles) {
        const id = crypto.randomUUID();
        const path = `${userId}/${saved.clientId}/${saved.id}/${id}-${safeFileName(file.name)}`;
        const upload = await supabase.storage.from("project-files").upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        const createdAt = new Date().toISOString();
        const metadata = await supabase.from("project_attachments").insert({ id, user_id: userId, client_id: saved.clientId, quote_id: saved.id, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size, created_at: createdAt, include_in_pdf: true });
        if (metadata.error) {
          await supabase.storage.from("project-files").remove([path]);
          throw metadata.error;
        }
        additions.push({ id, name: file.name, path, mimeType: file.type, size: file.size, createdAt, includeInPdf: true });
      }
      const updated = { ...saved, attachments: [...(saved.attachments || []), ...additions], updatedAt: new Date().toISOString() };
      await persistQuote(updated);
      setQuote(updated);
      setHistory((current) => current.some((item) => item.id === updated.id) ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current]);
      setNotice(`${additions.length} ${additions.length === 1 ? "arquivo adicionado" : "arquivos adicionados"}.`);
    } catch {
      setNotice("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadAttachment = async (attachment: ProjectAttachment) => {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from("project-files").download(attachment.path);
    if (error || !data) return setNotice("Não foi possível abrir este arquivo.");
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const removeAttachment = async (attachment: ProjectAttachment) => {
    if (!supabase || !window.confirm(`Excluir ${attachment.name}?`)) return;
    const storageResult = await supabase.storage.from("project-files").remove([attachment.path]);
    if (storageResult.error) return setNotice("Não foi possível excluir este arquivo.");
    await supabase.from("project_attachments").delete().eq("id", attachment.id).eq("user_id", userId);
    const updated = { ...quote, attachments: (quote.attachments || []).filter((file) => file.id !== attachment.id), updatedAt: new Date().toISOString() };
    setQuote(updated);
    setHistory((current) => current.map((item) => item.id === updated.id ? updated : item));
    await persistQuote(updated);
    setNotice("Arquivo excluído.");
  };

  const setAttachmentIncluded = async (attachment: ProjectAttachment, includeInPdf: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from("project_attachments").update({ include_in_pdf: includeInPdf }).eq("id", attachment.id).eq("user_id", userId);
    if (error) return setNotice("Não foi possível alterar este arquivo.");
    const updateAttachments = (attachments: ProjectAttachment[] = []) => attachments.map((file) => file.id === attachment.id ? { ...file, includeInPdf } : file);
    const updated = { ...quote, attachments: updateAttachments(quote.attachments), updatedAt: new Date().toISOString() };
    setQuote(updated);
    setHistory((current) => current.map((item) => item.id === updated.id ? updated : item));
    await persistQuote(updated);
    setNotice(includeInPdf ? "Arquivo será incluído no orçamento." : "Arquivo ficará apenas na pasta do projeto.");
  };

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type)) return setNotice("Use uma logo em PNG ou JPG.");
    if (file.size > 800_000) return setNotice("A logo deve ter no máximo 800 KB.");
    const reader = new FileReader();
    reader.onload = () => setCompany((current) => ({ ...current, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const saveCompany = async () => {
    if (!company.name.trim() || !company.contact.trim()) return setNotice("Informe o nome e o contato da marcenaria.");
    setSavingCompany(true);
    try {
      const { error } = await supabase!.from("company_profiles").upsert({
        user_id: userId, name: company.name.trim(), document: company.document, contact: company.contact,
        email: company.email, address: company.address, logo_data: company.logo, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setOnboarding(false);
      setNotice("Dados da marcenaria salvos.");
      if (view === "settings") setView("dashboard");
    } catch {
      setNotice("Não foi possível salvar os dados da empresa.");
    } finally {
      setSavingCompany(false);
    }
  };

  const clientFolders = useMemo(() => {
    const folders = new Map<string, ClientFolder>();
    history.forEach((item) => {
      const current = folders.get(item.clientId);
      if (current) {
        current.quotes.push(item);
        if (new Date(item.updatedAt) > new Date(current.updatedAt)) {
          current.info = item.client;
          current.updatedAt = item.updatedAt;
        }
      } else folders.set(item.clientId, { id: item.clientId, info: item.client, quotes: [item], updatedAt: item.updatedAt });
    });
    return Array.from(folders.values()).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [history]);

  const filteredClients = clientFolders.filter((client) => `${client.info.name} ${client.info.phone} ${client.info.email} ${client.info.address}`.toLowerCase().includes(search.toLowerCase()));
  const selectedClient = clientFolders.find((client) => client.id === selectedClientId);
  const pdfs = history.filter((item) => item.pdfGeneratedAt).filter((item) => `${item.client.name} ${item.number} ${item.client.projectName}`.toLowerCase().includes(search.toLowerCase()));

  const renderDashboard = () => {
    const approved = history.filter((item) => item.closing.status === "approved");
    const pending = history.filter((item) => item.closing.status === "pending");
    const approvedValue = approved.reduce((sum, item) => sum + quoteTotal(item), 0);
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Visão geral" title="Seu negócio" action={<button onClick={startNewQuote} className="primary-button !min-h-11 !px-3 md:!px-4"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span><span className="sm:hidden">Novo</span></button>} />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="app-card col-span-2 overflow-hidden bg-[#123d39] p-5 text-white lg:col-span-1"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-semibold text-[#c2ded9]">Total aprovado</span><BadgeCheck size={19} className="text-[#66d4c7]" /></div><p className="text-2xl font-extrabold tracking-[-0.04em]">{brl(approvedValue)}</p><p className="mt-1 text-sm text-[#a9cec8]">{approved.length} {approved.length === 1 ? "projeto" : "projetos"}</p></div>
          <div className="app-card p-4 md:p-5"><FolderOpen size={19} className="mb-7 text-[#0f766e]" /><p className="text-2xl font-extrabold">{clientFolders.length}</p><p className="mt-1 text-sm text-[#74837f]">Clientes</p></div>
          <div className="app-card p-4 md:p-5"><FileClock size={19} className="mb-7 text-amber-600" /><p className="text-2xl font-extrabold">{pending.length}</p><p className="mt-1 text-sm text-[#74837f]">Pendentes</p></div>
          <div className="app-card p-4 md:p-5"><FileText size={19} className="mb-7 text-[#0f766e]" /><p className="text-2xl font-extrabold">{pdfs.length}</p><p className="mt-1 text-sm text-[#74837f]">PDFs gerados</p></div>
        </div>
        <div className="app-card overflow-visible">
          <div className="flex items-center justify-between border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Orçamentos recentes</h2><button onClick={() => { setSearch(""); setView("documents"); }} className="text-sm font-bold text-[#0f766e]">Ver PDFs</button></div>
          {history.length === 0 ? <EmptyState icon={<FilePlus2 size={25} />} title="Nenhum orçamento ainda" text="Crie o primeiro para começar seu histórico." action={<button onClick={startNewQuote} className="secondary-button mt-5"><Plus size={17} />Criar orçamento</button>} /> : <div className="divide-y divide-[#e7eeec]">{history.slice(0, 6).map((item) => <QuoteRow key={item.id} item={item} onOpen={() => openQuote(item)} onStatus={(status) => void updateQuoteStatus(item.id, status)} menuOpen={menuQuote === item.id} onMenu={() => setMenuQuote(menuQuote === item.id ? null : item.id)} onDelete={() => void deleteQuote(item.id)} />)}</div>}
        </div>
      </section>
    );
  };

  const renderClients = () => {
    if (selectedClient) return (
      <section className="view-enter">
        <button onClick={() => setSelectedClientId(null)} className="quiet-button mb-4 !px-2"><ChevronLeft size={18} />Todos os clientes</button>
        <PageHeading eyebrow="Pasta do cliente" title={selectedClient.info.name || "Cliente sem nome"} action={<button onClick={startNewQuote} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span></button>} />
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="app-card p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#81908c]">Contato</p><p className="mt-2 font-semibold">{selectedClient.info.phone || "Não informado"}</p><p className="mt-1 break-all text-sm text-[#687875]">{selectedClient.info.email || "Sem e-mail"}</p></div>
          <div className="app-card p-4 md:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-[#81908c]">Local da obra</p><p className="mt-2 text-sm font-semibold leading-6">{selectedClient.info.address || "Não informado"}</p></div>
        </div>
        <div className="app-card overflow-hidden"><div className="border-b border-[#e3ebe9] px-5 py-4"><h2 className="font-bold">Orçamentos</h2></div><div className="divide-y divide-[#e7eeec]">{selectedClient.quotes.map((item) => <DocumentRow key={item.id} item={item} onOpen={() => openQuote(item)} onDownload={() => void downloadSavedPdf(item)} showDownload={Boolean(item.pdfGeneratedAt)} />)}</div></div>
        {selectedClient.quotes.some((item) => item.attachments?.length) && <div className="app-card mt-5 overflow-hidden"><div className="flex items-center gap-2 border-b border-[#e3ebe9] px-5 py-4"><Paperclip size={18} className="text-[#0f766e]" /><h2 className="font-bold">Arquivos do projeto</h2></div><div className="divide-y divide-[#e7eeec]">{selectedClient.quotes.flatMap((item) => item.attachments || []).map((attachment) => <ClientAttachmentRow key={attachment.id} attachment={attachment} onDownload={() => void downloadAttachment(attachment)} />)}</div></div>}
      </section>
    );
    return (
      <section className="view-enter">
        <PageHeading eyebrow="Cadastro" title="Clientes" action={<button onClick={startNewQuote} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Adicionar cliente</span></button>} />
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar cliente" />
        <div className="app-card overflow-hidden">
          {filteredClients.length === 0 ? <EmptyState icon={<Folder size={25} />} title={search ? "Nenhum cliente encontrado" : "Nenhuma pasta de cliente"} text={search ? "Tente outro nome ou telefone." : "Ao salvar um orçamento, a pasta do cliente aparece aqui."} /> : <div className="divide-y divide-[#e7eeec]">{filteredClients.map((client) => (
            <button key={client.id} onClick={() => setSelectedClientId(client.id)} className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f8fbfa] sm:px-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e5f2f0] text-[#0f766e]"><Folder size={22} fill="currentColor" className="opacity-90" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate font-bold">{client.info.name || "Cliente sem nome"}</span><span className="mt-1 block truncate text-sm text-[#74837f]">{client.info.phone || client.info.address || "Sem contato"} · {client.quotes.length} {client.quotes.length === 1 ? "orçamento" : "orçamentos"}</span></span>
              <ChevronRight size={19} className="shrink-0 text-[#93a19e]" />
            </button>
          ))}</div>}
        </div>
      </section>
    );
  };

  const renderDocuments = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Arquivo" title="PDFs gerados" action={<button onClick={startNewQuote} className="primary-button !min-h-11 !px-3"><Plus size={18} /><span className="hidden sm:inline">Novo orçamento</span></button>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Buscar PDF por cliente ou número" />
      <div className="app-card overflow-hidden">
        {pdfs.length === 0 ? <EmptyState icon={<FileText size={25} />} title={search ? "Nenhum PDF encontrado" : "Nenhum PDF arquivado"} text={search ? "Tente outro nome ou número." : "Os documentos gerados aparecem aqui para baixar novamente."} /> : <div className="divide-y divide-[#e7eeec]">{pdfs.map((item) => <DocumentRow key={item.id} item={item} onOpen={() => openQuote(item)} onDownload={() => void downloadSavedPdf(item)} showDownload />)}</div>}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="view-enter">
      <PageHeading eyebrow="Perfil" title="Dados da marcenaria" />
      <CompanyForm company={company} onChange={setCompany} onLogo={handleLogo} onSave={() => void saveCompany()} saving={savingCompany} />
      <AccountSecurity email={userEmail} onSignOut={onSignOut} />
    </section>
  );

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: object; execute: () => unknown };
    type WebMcpDocument = Document & { modelContext?: { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> } };
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({ name: "start_new_quote", title: "Iniciar novo orçamento", description: "Abre um orçamento vazio na primeira etapa.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { startNewQuote(); return { status: "started" }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [startNewQuote]);

  if (!hydrated) return <div className="grid min-h-screen place-items-center"><BrandMark /></div>;
  if (onboarding) return (
    <main className="min-h-screen bg-[#f2f6f5] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-2"><BrandMark /><div className="flex items-center gap-2"><InstallAppButton /><span className="hidden rounded-full bg-[#dff1ed] px-3 py-1.5 text-xs font-bold text-[#0f6d65] sm:inline">1ª configuração</span></div></div>
        <PageHeading eyebrow="Antes de começar" title="Configure sua marcenaria" />
        <CompanyForm company={company} onChange={setCompany} onLogo={handleLogo} onSave={() => void saveCompany()} saving={savingCompany} onboarding />
        <div className="mt-5"><PasskeyCard compact /></div>
      </div>
      {notice && <Notice text={notice} />}
    </main>
  );

  const trialDays = profile?.subscriptionStatus === "active" || !profile ? null : Math.max(1, Math.ceil((new Date(profile.trialEndsAt).getTime() - now) / 86_400_000));
  const views: Record<Exclude<AppView, "quote">, () => React.ReactNode> = { dashboard: renderDashboard, clients: renderClients, documents: renderDocuments, settings: renderSettings };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[#dce6e3]/80 bg-white/88 backdrop-blur-xl"><div className="mx-auto flex h-[4.65rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"><BrandMark /><div className="flex items-center gap-2">{trialDays && <span className="hidden rounded-full bg-[#f1f6f4] px-3 py-1.5 text-xs font-bold text-[#64746f] sm:block">{trialDays} {trialDays === 1 ? "dia grátis" : "dias grátis"}</span>}<InstallAppButton /></div></div></header>
      <main className="content-safe mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">{view === "quote" ? <QuoteEditor quote={quote} onChange={setQuote} onSave={() => void saveQuote()} onGenerate={() => void handleGeneratePdf()} isGenerating={isGenerating} onUpload={(files) => void uploadProjectFiles(files)} onDownloadAttachment={(attachment) => void downloadAttachment(attachment)} onRemoveAttachment={(attachment) => void removeAttachment(attachment)} onSetAttachmentIncluded={(attachment, included) => void setAttachmentIncluded(attachment, included)} isUploading={isUploading} /> : views[view]()}</main>
      <nav className="app-bottom-nav nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#d5e1de] bg-white/94 px-2 pt-2 shadow-[0_-10px_35px_rgba(24,52,48,0.09)] backdrop-blur-xl" aria-label="Navegação principal"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; const isNew = item.id === "quote"; return <button key={item.id} onClick={() => isNew ? startNewQuote() : (setSearch(""), setSelectedClientId(null), setView(item.id))} aria-current={active ? "page" : undefined} className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors ${active ? "bg-[#e7f3f1] text-[#0c6d65]" : "text-[#758580] hover:bg-[#f2f6f5] hover:text-[#30413e]"}`}><span className={isNew ? "grid h-7 w-7 place-items-center rounded-full bg-[#0f766e] text-white shadow-md" : ""}><Icon size={isNew ? 18 : 20} strokeWidth={active || isNew ? 2.6 : 2} /></span><span className="text-xs font-bold">{item.label}</span></button>; })}</div></nav>
      {notice && <Notice text={notice} />}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative mb-4 block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83918e]" size={18} /><input className="field-input !pl-11" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return <div className="grid min-h-64 place-items-center p-6 text-center"><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f3f1] text-[#0f766e]">{icon}</div><h3 className="font-bold">{title}</h3><p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-[#74837f]">{text}</p>{action}</div></div>;
}

function QuoteRow({ item, onOpen, onStatus, menuOpen, onMenu, onDelete }: { item: Quote; onOpen: () => void; onStatus: (status: QuoteStatus) => void; menuOpen: boolean; onMenu: () => void; onDelete: () => void }) {
  return <article className="relative grid gap-3 px-4 py-4 transition-colors hover:bg-[#fbfdfc] sm:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] sm:items-center sm:px-5">
    <button onClick={onOpen} className="min-w-0 text-left"><p className="truncate font-bold text-[#1e2c2a]">{item.client.name || "Cliente sem nome"}</p><p className="mt-1 truncate text-sm text-[#758580]">{item.client.projectName || `${item.furniture.length} ${item.furniture.length === 1 ? "móvel" : "móveis"}`} · {item.number}</p></button>
    <p className="text-sm font-bold sm:text-right">{brl(quoteTotal(item))}</p>
    <select aria-label={`Status de ${item.client.name}`} value={item.closing.status} onChange={(event) => onStatus(event.target.value as QuoteStatus)} className={`w-fit cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${statusClass[item.closing.status]}`}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <div className="flex items-center justify-between gap-2 sm:justify-end"><span className="text-xs text-[#8a9894] sm:hidden">{formatDate(item.updatedAt)}</span><button aria-label="Mais opções" onClick={onMenu} className="quiet-button !min-h-10 !w-10 !p-0"><MoreHorizontal size={19} /></button></div>
    {menuOpen && <div className="absolute bottom-3 right-14 z-20 flex w-40 flex-col rounded-xl border border-[#dbe5e2] bg-white p-1.5 shadow-xl sm:bottom-auto sm:right-12 sm:top-11"><button onClick={onOpen} className="quiet-button !min-h-9 !justify-start !rounded-lg !px-2.5"><PencilLine size={15} />Editar</button><button onClick={onDelete} className="quiet-button !min-h-9 !justify-start !rounded-lg !px-2.5 !text-rose-600"><Trash2 size={15} />Excluir</button></div>}
  </article>;
}

function DocumentRow({ item, onOpen, onDownload, showDownload }: { item: Quote; onOpen: () => void; onDownload: () => void; showDownload: boolean }) {
  return <article className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3f1] text-[#0f766e]"><FileText size={21} /></span>
    <button onClick={onOpen} className="min-w-0 flex-1 text-left"><p className="truncate font-bold">{item.client.name || "Cliente sem nome"}</p><p className="mt-1 truncate text-sm text-[#74837f]">{item.number} · {formatDate(item.pdfGeneratedAt || item.updatedAt)} · {brl(quoteTotal(item))}</p></button>
    <div className="flex gap-2">{showDownload && <button onClick={onDownload} className="secondary-button !min-h-10 !px-3"><Download size={16} />Baixar</button>}<button onClick={onOpen} className="quiet-button !min-h-10 !px-3">Abrir</button></div>
  </article>;
}

function ClientAttachmentRow({ attachment, onDownload }: { attachment: ProjectAttachment; onDownload: () => void }) {
  const Icon = attachment.mimeType === "application/pdf" ? FileText : FileImage;
  const size = attachment.size < 1_000_000 ? `${Math.ceil(attachment.size / 1_000)} KB` : `${(attachment.size / 1_000_000).toFixed(1)} MB`;
  return <button type="button" onClick={onDownload} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fbfa] sm:px-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f3f1] text-[#0f766e]"><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{attachment.name}</span><span className="text-xs text-[#7b8b87]">{size}</span></span><Download size={17} className="shrink-0 text-[#758580]" /></button>;
}

function Notice({ text }: { text: string }) {
  return <div role="status" aria-live="polite" className="fixed left-1/2 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl bg-[#173d39] px-4 py-3 text-sm font-semibold text-white shadow-2xl"><Check size={17} className="shrink-0 text-[#62d2c5]" />{text}</div>;
}
