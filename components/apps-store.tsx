"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ClipboardList, Droplets, HardHat, Layers3, Lightbulb, Paintbrush, Search, Sparkles, Wrench } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { productCatalog, type ProductId } from "@/lib/product-catalog";
import styles from "./apps-store.module.css";

type Filter = "todos" | "marcenaria" | "construcao" | "instalacoes" | "acabamentos";

const categories: Record<ProductId, Filter> = {
  moveis: "marcenaria",
  "obra-civil": "construcao",
  hidraulica: "instalacoes",
  eletrica: "instalacoes",
  revestimentos: "acabamentos",
  pintura: "acabamentos",
};

const productIcons: Record<ProductId, ComponentType<{ size?: number }>> = {
  moveis: Wrench,
  "obra-civil": HardHat,
  hidraulica: Droplets,
  eletrica: Lightbulb,
  revestimentos: Layers3,
  pintura: Paintbrush,
};

function ProductLogo({ id }: { id: ProductId }) {
  if (id === "moveis") return <Image src="/orcamovel-official-192.png" width={54} height={54} alt="" />;
  if (id === "obra-civil") return <Image src="/orcaobra-logo.png" width={54} height={54} alt="" />;
  const Icon = productIcons[id];
  return <Icon size={24} />;
}

function PhonePreview({ obra = false }: { obra?: boolean }) {
  return <div className={styles.phone}>
    <div className={styles.phoneHead} />
    <div className={styles.phoneTitle}>{obra ? "Visão da obra" : "Seu negócio"}</div>
    <div className={styles.phoneHero}><span>{obra ? "Valor da proposta" : "Total aprovado"}</span><strong>{obra ? "R$ 48.730" : "R$ 20.295"}</strong></div>
    <div className={styles.phoneRows}><span /><span /><span /><span /></div>
  </div>;
}

export function AppsStore() {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const products = useMemo(() => productCatalog.filter((product) => {
    if (filter !== "todos" && categories[product.id] !== filter) return false;
    if (!normalized) return true;
    return `${product.name} ${product.shortName} ${product.description} ${product.audience}`.toLocaleLowerCase("pt-BR").includes(normalized);
  }), [filter, normalized]);
  const moveis = productCatalog.find((product) => product.id === "moveis")!;
  const obra = productCatalog.find((product) => product.id === "obra-civil")!;

  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={`${styles.shell} ${styles.headerInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}><ClipboardList size={23} /></span>
          <span className={styles.brandText}><strong>Aplicativos Orça</strong><span>Central profissional</span></span>
        </Link>
        <Link href="/apps/moveis" className={styles.headerLink}>Entrar <ArrowRight size={16} /></Link>
      </div>
    </header>

    <main>
      <section className={`${styles.shell} ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>UMA CENTRAL. VÁRIOS OFÍCIOS.</p>
            <h1>Orçamentos profissionais para quem <span>faz acontecer.</span></h1>
            <p className={styles.lead}>Escolha o aplicativo certo para o seu trabalho. Cada Orça nasce com fluxo, campos e PDF pensados para uma profissão, mantendo a mesma experiência simples no celular e no computador.</p>
          </div>
          <aside className={styles.heroPanel}>
            <Sparkles size={24} />
            <h2>Uma conta, aplicativos diferentes.</h2>
            <p>Teste cada produto separadamente e contrate somente o que fizer sentido para o seu negócio.</p>
            <div className={styles.miniGrid}>
              <div className={styles.miniCard}><Check size={18} /><strong>30 dias grátis</strong><span>por aplicativo</span></div>
              <div className={styles.miniCard}><Check size={18} /><strong>Celular e PC</strong><span>mesma conta</span></div>
              <div className={styles.miniCard}><Check size={18} /><strong>PDF profissional</strong><span>por segmento</span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.shell} aria-label="Busca e filtros">
        <div className={styles.tools}>
          <label className={styles.search}><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aplicativo ou profissão" aria-label="Buscar aplicativo ou profissão" /></label>
          <div className={styles.filters}>
            {([['todos','Todos'],['marcenaria','Marcenaria'],['construcao','Construção'],['instalacoes','Instalações'],['acabamentos','Acabamentos']] as [Filter,string][]).map(([id,label]) => <button key={id} type="button" className={`${styles.filter} ${filter === id ? styles.filterActive : ""}`} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
        </div>
      </section>

      <section className={styles.shell}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>DISPONÍVEIS AGORA</p><h2>Comece pelo seu ofício.</h2></div><p>Os demais aplicativos serão liberados gradualmente.</p></div>
        <div className={styles.featured}>
          <article className={styles.featuredCard}>
            <div className={styles.featuredCopy}>
              <div className={styles.productTop}><span className={styles.logoBox}><ProductLogo id="moveis" /></span><div><span className={`${styles.status} ${styles.launchStatus}`}>Lançamento · teste grátis</span><h3>{moveis.name}</h3></div></div>
              <p>Orçamentos para marcenaria sob medida, com clientes, móveis, revisões e PDFs personalizados com a identidade da empresa.</p>
              <ul className={styles.features}><li><Check size={16}/>Móveis, medidas e acabamentos</li><li><Check size={16}/>PDF personalizado</li><li><Check size={16}/>30 dias grátis</li></ul>
              <div className={styles.actions}><Link href={moveis.presentationHref || moveis.href} className={styles.primary}>Conhecer OrçaMóvel <ArrowRight size={16}/></Link><Link href={moveis.href} className={styles.secondary}>Abrir app</Link></div>
            </div>
            <div className={styles.featuredVisual}><PhonePreview /></div>
          </article>

          <article className={styles.featuredCard}>
            <div className={styles.featuredCopy}>
              <div className={styles.productTop}><span className={styles.logoBox}><ProductLogo id="obra-civil" /></span><div><span className={styles.status}>Disponível</span><h3>{obra.name}</h3></div></div>
              <p>Orçamentos de construção e reformas organizados por etapas, serviços, materiais, mão de obra, equipamentos e BDI.</p>
              <ul className={styles.features}><li><Check size={16}/>Planilha de serviços</li><li><Check size={16}/>Custos diretos + BDI</li><li><Check size={16}/>30 dias grátis</li></ul>
              <div className={styles.actions}><Link href={obra.presentationHref || obra.href} className={styles.primary}>Conhecer OrçaObra <ArrowRight size={16}/></Link><Link href={obra.href} className={styles.secondary}>Abrir app</Link></div>
            </div>
            <div className={`${styles.featuredVisual} ${styles.obraVisual}`}><PhonePreview obra /></div>
          </article>
        </div>
      </section>

      <section className={styles.shell}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>CATÁLOGO</p><h2>Todos os aplicativos</h2></div><p>{products.length} {products.length === 1 ? "aplicativo" : "aplicativos"}</p></div>
        <div className={styles.catalog}>
          {products.length ? products.map((product) => {
            const Icon = productIcons[product.id];
            return <article className={styles.productCard} key={product.id}>
              <div className={styles.productCardTop}><span className={styles.productIcon}>{product.id === "moveis" || product.id === "obra-civil" ? <ProductLogo id={product.id} /> : <Icon size={23}/>}</span><span className={styles.soon}>{product.status === "available" ? "Disponível" : "Em breve"}</span></div>
              <h3>{product.name}</h3><p>{product.description}</p><span className={styles.audience}>{product.audience}</span>
              {product.status === "available" ? <Link className={styles.catalogCta} href={product.presentationHref || product.href}>Conhecer aplicativo <ArrowRight size={16}/></Link> : <span style={{marginTop:'auto',paddingTop:18,color:'#8b9794',fontWeight:800}}>Em desenvolvimento</span>}
            </article>;
          }) : <div className={styles.empty}>Nenhum aplicativo encontrado para esta busca.</div>}
        </div>
      </section>
    </main>

    <footer className={styles.footer}><div className={`${styles.shell} ${styles.footerInner}`}><strong>Aplicativos Orça</strong><span>Ferramentas profissionais para orçamentos por segmento.</span></div></footer>
  </div>;
}
