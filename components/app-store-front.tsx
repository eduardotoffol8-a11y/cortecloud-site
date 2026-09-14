"use client";

import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Boxes, BriefcaseBusiness, Building2, CheckCircle2, Construction,
  Droplets, FileText, FolderOpen, Hammer, LayoutDashboard, Ruler, Search, ShieldCheck,
  Sparkles, Star, UsersRound, Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { productCatalog, type ProductDefinition, type ProductId } from "@/lib/product-catalog";

const appVisuals: Record<ProductId, { icon: typeof Hammer; category: string; label: string; tone: string }> = {
  moveis: { icon: Ruler, category: "Marcenaria", label: "Móveis sob medida", tone: "from-emerald-950 via-emerald-800 to-teal-700" },
  "obra-civil": { icon: Construction, category: "Construção", label: "Obra civil", tone: "from-slate-900 via-stone-700 to-amber-700" },
  hidraulica: { icon: Droplets, category: "Instalações", label: "Hidráulica", tone: "from-slate-900 via-sky-900 to-cyan-700" },
  eletrica: { icon: Zap, category: "Instalações", label: "Elétrica", tone: "from-slate-900 via-yellow-900 to-amber-600" },
  revestimentos: { icon: Boxes, category: "Acabamentos", label: "Revestimentos", tone: "from-slate-900 via-rose-950 to-orange-700" },
};

const filters = ["Todos", "Marcenaria", "Construção", "Instalações", "Acabamentos"];

function StoreHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce6e3]/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/apps" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-sm"><BriefcaseBusiness size={20} /></span>
          <span><span className="block text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[#7a8985]">Central profissional</span><span className="block font-extrabold tracking-[-0.03em] text-[#172321]">Aplicativos Orça</span></span>
        </Link>
        <Link href="/apps/moveis" className="secondary-button !min-h-10 !rounded-full !px-4">Entrar <ArrowRight size={16} /></Link>
      </div>
    </header>
  );
}

function StorePreviewCard({ variant }: { variant: "dashboard" | "quote" | "clients" }) {
  if (variant === "dashboard") return (
    <div className="h-full rounded-[1.4rem] bg-[#f2f6f5] p-3 shadow-inner">
      <div className="mb-3 flex items-center justify-between"><div><div className="h-2 w-14 rounded bg-emerald-700/25" /><div className="mt-1.5 h-4 w-24 rounded bg-[#172321]" /></div><div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100"><LayoutDashboard size={13} className="text-emerald-800" /></div></div>
      <div className="grid grid-cols-2 gap-2"><div className="col-span-2 rounded-xl bg-[#0c5f59] p-3 text-white"><div className="h-2 w-20 rounded bg-white/40" /><div className="mt-3 h-5 w-24 rounded bg-white/90" /><div className="mt-1 h-2 w-14 rounded bg-white/35" /></div><div className="rounded-xl bg-white p-3"><FolderOpen size={14} className="text-emerald-700" /><div className="mt-5 h-4 w-8 rounded bg-[#172321]" /><div className="mt-1 h-2 w-12 rounded bg-slate-200" /></div><div className="rounded-xl bg-white p-3"><FileText size={14} className="text-amber-700" /><div className="mt-5 h-4 w-8 rounded bg-[#172321]" /><div className="mt-1 h-2 w-12 rounded bg-slate-200" /></div></div>
      <div className="mt-2 rounded-xl bg-white p-3"><div className="h-3 w-28 rounded bg-slate-800" /><div className="mt-3 space-y-2">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg bg-emerald-50" /><div className="flex-1"><div className="h-2 w-20 rounded bg-slate-300" /><div className="mt-1 h-1.5 w-14 rounded bg-slate-100" /></div></div>)}</div></div>
    </div>
  );

  if (variant === "quote") return (
    <div className="h-full rounded-[1.4rem] bg-[#f2f6f5] p-3 shadow-inner">
      <div className="mb-3"><div className="h-2 w-20 rounded bg-emerald-700/25" /><div className="mt-1.5 h-4 w-32 rounded bg-[#172321]" /></div>
      <div className="rounded-xl bg-white p-3"><div className="mb-3 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Ruler size={14} /></span><div><div className="h-2 w-20 rounded bg-slate-400" /><div className="mt-1 h-1.5 w-12 rounded bg-slate-100" /></div></div>{["Cliente", "Ambiente", "Móvel"].map((label) => <div key={label} className="mb-2"><div className="mb-1 text-[0.42rem] font-bold uppercase tracking-wide text-slate-400">{label}</div><div className="h-7 rounded-lg border border-slate-200 bg-[#fbfdfc]" /></div>)}<div className="grid grid-cols-3 gap-2"><div className="h-7 rounded-lg bg-emerald-50" /><div className="h-7 rounded-lg bg-emerald-50" /><div className="h-7 rounded-lg bg-emerald-50" /></div><div className="mt-3 h-8 rounded-lg bg-[#0f766e]" /></div>
    </div>
  );

  return (
    <div className="h-full rounded-[1.4rem] bg-[#f2f6f5] p-3 shadow-inner">
      <div className="mb-3 flex items-center justify-between"><div><div className="h-2 w-14 rounded bg-emerald-700/25" /><div className="mt-1.5 h-4 w-20 rounded bg-[#172321]" /></div><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50"><UsersRound size={13} className="text-emerald-700" /></span></div>
      <div className="mb-2 flex h-8 items-center gap-2 rounded-lg bg-white px-2"><Search size={11} className="text-slate-400" /><div className="h-1.5 w-20 rounded bg-slate-100" /></div>
      <div className="overflow-hidden rounded-xl bg-white">{["Marcenaria Silva", "Móveis Oliveira", "João Santos", "Casa Nova"].map((name, index) => <div key={name} className={`flex items-center gap-2 px-3 py-2.5 ${index ? "border-t border-slate-100" : ""}`}><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><FolderOpen size={13} /></span><div className="min-w-0 flex-1"><p className="truncate text-[0.5rem] font-bold text-slate-700">{name}</p><div className="mt-1 h-1.5 w-16 rounded bg-slate-100" /></div><ArrowRight size={10} className="text-slate-300" /></div>)}</div>
    </div>
  );
}

function FeaturedApp() {
  const product = productCatalog.find((item) => item.id === "moveis")!;
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(26,58,54,0.09)]">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <div className="flex items-center gap-3"><span className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-[var(--brand)] text-white shadow-lg"><Ruler size={29} /></span><div><span className="inline-flex rounded-full bg-[#dff1ed] px-2.5 py-1 text-[0.66rem] font-extrabold uppercase tracking-wide text-[var(--brand)]">Disponível agora</span><h2 className="mt-1 text-3xl font-extrabold tracking-[-0.045em]">{product.name}</h2></div></div>
          <p className="mt-5 text-lg font-bold leading-7 text-[#31413e]">Orçamentos profissionais para marcenaria, direto do celular.</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#687875]">Cadastre clientes, organize projetos, calcule móveis e gere propostas em PDF com a identidade da sua marcenaria.</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#52635f]"><span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[var(--brand)]" />30 dias grátis</span><span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-[var(--brand)]" />Sem cartão</span><span className="flex items-center gap-1.5"><BadgeCheck size={16} className="text-[var(--brand)]" />Todos os recursos</span></div>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row"><Link href={product.presentationHref ?? product.href} className="primary-button">Conhecer OrçaMóvel <ArrowRight size={17} /></Link><a href="#previa" className="secondary-button">Ver prévia</a></div>
          <div className="mt-6 flex items-center gap-3 border-t border-[#edf1f0] pt-5"><div className="flex items-center gap-0.5 text-[#c2a25f]" aria-label="Avaliações ainda não disponíveis">{[1, 2, 3, 4, 5].map((item) => <Star key={item} size={15} />)}</div><p className="text-xs font-semibold text-[#7a8985]">Novo na plataforma · avaliações públicas em breve</p></div>
        </div>
        <div className="relative min-h-[27rem] overflow-hidden bg-[linear-gradient(135deg,#092f2c,#0f766e_55%,#c1a15f)] p-5 sm:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid h-full grid-cols-3 items-end gap-3 sm:gap-5">
            <div className="h-[76%] rotate-[-4deg] rounded-[1.8rem] border-[5px] border-white/90 bg-white p-1 shadow-2xl"><StorePreviewCard variant="clients" /></div>
            <div className="h-[92%] rounded-[1.8rem] border-[5px] border-white bg-white p-1 shadow-2xl"><StorePreviewCard variant="dashboard" /></div>
            <div className="h-[80%] rotate-[4deg] rounded-[1.8rem] border-[5px] border-white/90 bg-white p-1 shadow-2xl"><StorePreviewCard variant="quote" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppCard({ product }: { product: ProductDefinition }) {
  const visual = appVisuals[product.id];
  const Icon = visual.icon;
  const available = product.status === "available";
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-[#dce5e2] bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(26,58,54,0.08)]">
      <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${visual.tone} p-5 text-white`}>
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-white/10" />
        <div className="relative flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Icon size={23} /></span><span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.64rem] font-extrabold uppercase tracking-wide backdrop-blur">{available ? "Disponível" : "Em breve"}</span></div>
        <p className="relative mt-3 text-xs font-bold text-white/70">{visual.category}</p>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-extrabold tracking-[-0.035em] text-[#172321]">{product.name}</h3><p className="mt-1 text-xs font-semibold text-[#82908d]">{product.audience}</p></div>{available && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-extrabold text-emerald-700">30 dias grátis</span>}</div>
        <p className="mt-4 min-h-[4.5rem] text-sm leading-6 text-[#687875]">{product.description}</p>
        <div className="mt-4 border-t border-[#eef2f1] pt-4">
          {available ? <Link href={product.presentationHref ?? product.href} className="flex items-center justify-between font-bold text-[var(--brand)]"><span>Conhecer aplicativo</span><ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></Link> : <div className="flex items-center justify-between text-sm font-bold text-[#8b9996]"><span>Em desenvolvimento</span><Sparkles size={16} /></div>}
        </div>
      </div>
    </article>
  );
}

export function AppStoreFront() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");

  const visibleProducts = useMemo(() => productCatalog.filter((product) => {
    const visual = appVisuals[product.id];
    const matchesFilter = filter === "Todos" || visual.category === filter;
    const haystack = `${product.name} ${product.shortName} ${product.description} ${product.audience} ${visual.category}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  }), [filter, query]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(15,118,110,0.10),transparent_27rem),#f4f7f6]">
      <StoreHeader />
      <main>
        <section className="mx-auto max-w-7xl px-4 pb-7 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[var(--brand)]">Aplicativos feitos para quem trabalha com as mãos e com números</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.055em] text-[#172321] sm:text-6xl">Encontre a ferramenta certa para o seu serviço.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#62736f] sm:text-lg">Uma única conta para acessar aplicativos de orçamento especializados por profissão. Cada app tem seus próprios recursos, teste e plano.</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input !min-h-12 !rounded-full !bg-white !pl-11 shadow-sm" placeholder="Buscar aplicativo ou profissão" aria-label="Buscar aplicativos" /></label>
            <div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${filter === item ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[#d8e2df] bg-white text-[#53635f] hover:border-[#aac1bc]"}`}>{item}</button>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6"><FeaturedApp /></section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand)]">Catálogo</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#172321] sm:text-3xl">Todos os aplicativos</h2></div><p className="hidden text-sm font-semibold text-[#7b8986] sm:block">{visibleProducts.length} {visibleProducts.length === 1 ? "aplicativo" : "aplicativos"}</p></div>
          {visibleProducts.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <AppCard key={product.id} product={product} />)}</div> : <div className="rounded-3xl border border-dashed border-[#cbd9d5] bg-white p-10 text-center"><Search size={24} className="mx-auto text-[#8b9996]" /><h3 className="mt-3 font-extrabold">Nenhum aplicativo encontrado</h3><p className="mt-1 text-sm text-[#74837f]">Tente outro nome, profissão ou categoria.</p></div>}
        </section>

        <section id="previa" className="border-y border-[#dfe7e5] bg-white/70 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-7 max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand)]">Prévia do OrçaMóvel</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Veja o app antes de criar sua conta.</h2><p className="mt-3 text-sm leading-6 text-[#687875]">As telas abaixo representam as áreas principais do aplicativo atual. Mais adiante esta seção poderá receber capturas reais e vídeos curtos de cada produto.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[{ type: "dashboard" as const, title: "Visão geral", text: "Acompanhe clientes, PDFs, pendências e valores aprovados." }, { type: "quote" as const, title: "Novo orçamento", text: "Monte propostas de móveis com os dados do projeto em poucos passos." }, { type: "clients" as const, title: "Clientes organizados", text: "Mantenha cada cliente com projetos, arquivos e histórico no mesmo lugar." }].map((preview) => <article key={preview.type} className="rounded-[1.6rem] border border-[#dce5e2] bg-white p-4 shadow-sm"><div className="mx-auto aspect-[9/15] max-h-[31rem] max-w-[18rem] overflow-hidden rounded-[1.8rem] border-[6px] border-[#20312e] bg-[#20312e] p-1"><StorePreviewCard variant={preview.type} /></div><h3 className="mt-5 text-lg font-extrabold">{preview.title}</h3><p className="mt-1 text-sm leading-6 text-[#687875]">{preview.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[1.8rem] border border-[#dce5e2] bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Star size={21} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8a7853]">Avaliações</p><h2 className="text-xl font-extrabold">Opiniões de usuários reais</h2></div></div>
              <p className="mt-5 text-sm leading-6 text-[#687875]">Não vamos inventar notas ou depoimentos. Quando as avaliações verificadas começarem a chegar, elas aparecerão aqui e nas páginas individuais dos aplicativos.</p>
              <div className="mt-5 rounded-2xl bg-[#f7f9f8] p-4"><p className="font-bold text-[#53635f]">OrçaMóvel é novo na plataforma</p><p className="mt-1 text-sm text-[#7a8985]">Ainda sem avaliações públicas verificadas.</p></div>
            </article>
            <article className="rounded-[1.8rem] bg-[var(--brand-dark)] p-6 text-white sm:p-8">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Building2 size={21} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/60">Uma conta</p><h2 className="text-xl font-extrabold">Vários aplicativos, uma base só.</h2></div></div>
              <p className="mt-5 text-sm leading-6 text-white/75">Clientes, dados da empresa e segurança podem ser compartilhados. Cada aplicativo mantém sua própria licença, período de teste e ferramentas especializadas.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-sm font-bold"><span className="rounded-xl bg-white/8 px-3 py-3">Conta única</span><span className="rounded-xl bg-white/8 px-3 py-3">Apps independentes</span><span className="rounded-xl bg-white/8 px-3 py-3">Dados organizados</span><span className="rounded-xl bg-white/8 px-3 py-3">Pagamentos por app</span></div>
            </article>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#dce5e2] bg-white px-4 py-8 text-center text-sm font-semibold text-[#758580] sm:px-6">Aplicativos Orça · ferramentas profissionais para orçamentos e propostas.</footer>
    </div>
  );
}
