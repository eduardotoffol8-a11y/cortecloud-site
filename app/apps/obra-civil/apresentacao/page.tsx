import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText, Layers3, Monitor, WalletCards } from "lucide-react";
import { PublicTestimonials } from "@/components/public-testimonials";
import styles from "./presentation.module.css";

export const metadata: Metadata = {
  title: "OrçaObra | Orçamentos profissionais para construção e reformas",
  description: "Organize serviços, materiais, mão de obra, equipamentos, BDI e condições comerciais em propostas profissionais. Teste o OrçaObra por 30 dias grátis.",
};

const benefits = [
  { icon: Layers3, title: "Serviços por etapas", text: "Separe fundação, alvenaria, revestimentos, instalações, acabamento e outras fases da obra." },
  { icon: WalletCards, title: "Custos bem formados", text: "Organize materiais, mão de obra e equipamentos e aplique BDI e desconto na proposta." },
  { icon: FileText, title: "PDF profissional", text: "Entregue uma proposta com escopo, serviços, condições, valores e identificação da sua empresa." },
  { icon: Monitor, title: "Celular e computador", text: "Use a mesma conta no canteiro, no escritório ou durante a visita ao cliente." },
];

const faqs = [
  ["O OrçaObra é só para obras grandes?", "Não. Ele foi pensado para construção e reformas e pode ser usado tanto em serviços menores quanto em propostas com várias etapas."],
  ["Consigo separar material e mão de obra?", "Sim. Cada serviço pode ter custos de materiais, mão de obra e equipamentos, formando o custo direto antes do BDI."],
  ["O sistema calcula BDI?", "Sim. Você informa o percentual de BDI e o OrçaObra aplica esse valor sobre os custos diretos para formar a proposta."],
  ["Posso usar no computador?", "Sim. O OrçaObra funciona no celular e no computador usando a mesma conta."],
  ["Existe cobrança automática depois do teste?", "Não. O modelo atual usa pagamentos avulsos por período, igual ao OrçaMóvel. Você escolhe quando renovar ou fazer upgrade."],
  ["Quanto tempo dura o teste?", "Cada conta pode testar o OrçaObra por 30 dias, independentemente do plano usado em outros aplicativos Orça."],
];

export default function ConstructionPresentationPage() {
  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link href="/" className={styles.brand} aria-label="Voltar para Aplicativos Orça">
          <Image src="/orcaobra-logo.png" width={46} height={46} alt="" />
          <span><strong>OrçaObra</strong><small>Construção e reformas</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação da página">
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <Link href="/apps/obra-civil" className={styles.cta}>Entrar no app <ArrowRight size={16}/></Link>
        </nav>
      </div>
    </header>

    <main>
      <section className={`${styles.container} ${styles.hero}`}>
        <div>
          <p className={styles.eyebrow}>ORÇAMENTOS PARA CONSTRUÇÃO E REFORMAS</p>
          <h1>Monte propostas de obra com <span>custos e etapas organizados.</span></h1>
          <p className={styles.lead}>Cadastre o contratante, descreva a obra, organize serviços por etapa, separe materiais, mão de obra e equipamentos, aplique BDI e gere uma proposta profissional.</p>
          <div className={styles.actions}><Link href="/apps/obra-civil" className={styles.primary}>Criar conta e testar grátis <ArrowRight size={17}/></Link><a href="#como-funciona" className={styles.secondary}>Ver como funciona</a></div>
          <div className={styles.trust}><span><Check size={15}/>30 dias grátis</span><span><Check size={15}/>Sem cartão</span><span><Check size={15}/>Celular e PC</span></div>
        </div>
        <div className={styles.visual} aria-label="Prévia visual do OrçaObra">
          <span className={styles.visualBadge}>Orçamento de obra organizado</span>
          <div className={styles.phone}>
            <div className={styles.phoneHead}><span/><span/></div>
            <h3>Seu negócio</h3>
            <div className={styles.total}><small>Total aprovado</small><strong>R$ 48.730,00</strong></div>
            <div className={styles.stats}><div><b>6</b><span>Clientes</span></div><div><b>2</b><span>Pendentes</span></div></div>
            <div className={styles.service}><b>Reforma residência Silva</b><span/><span/></div>
          </div>
          <div className={styles.floatCard}><strong>Do levantamento ao PDF</strong><span>Serviços, custos, BDI e condições comerciais no mesmo fluxo.</span></div>
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>FEITO PARA QUEM EXECUTA</p><h2>Menos planilha improvisada. Mais clareza na proposta.</h2><p className={styles.lead}>O OrçaObra foi desenhado para transformar informações de campo em um orçamento apresentável, sem misturar a lógica da construção com a do OrçaMóvel.</p></div>
        <div className={styles.grid4}>{benefits.map(({icon: Icon,title,text}) => <article key={title} className={styles.card}><span className={styles.cardIcon}><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.dark}>
        <div className={`${styles.container} ${styles.darkGrid}`}>
          <div><p className={styles.eyebrow}>PROPOSTA COMERCIAL</p><h2>Seu orçamento precisa mostrar organização antes mesmo da obra começar.</h2><p>O PDF reúne identificação da empresa e do cliente, dados da obra, planilha de serviços, custos, BDI, inclusões, exclusões, condições e área de aceite.</p><ul style={{display:'grid',gap:10,padding:0,listStyle:'none',marginTop:22}}>{["Escopo e premissas da obra","Serviços por etapa e unidade","Materiais, mão de obra e equipamentos","Resumo financeiro e condições comerciais"].map(item => <li key={item} style={{display:'flex',gap:8,alignItems:'center'}}><Check size={17}/>{item}</li>)}</ul></div>
          <div className={styles.sheet} aria-label="Exemplo visual de proposta do OrçaObra">
            <div className={styles.sheetTop}><div className={styles.sheetBrand}><Image src="/orcaobra-logo.png" width={44} height={44} alt=""/><div><strong>Construtora Exemplo</strong><span>Construção e reformas</span></div></div><div className={styles.sheetTag}><small>PROPOSTA COMERCIAL</small><b>OBR-2026-001</b></div></div>
            <div className={styles.sheetRows}><div className={styles.sheetRow}><b>Serviço</b><b>Qtd.</b><b>Total</b></div><div className={styles.sheetRow}><span>Alvenaria de vedação</span><span>42 m²</span><span>R$ 8.820</span></div><div className={styles.sheetRow}><span>Revestimento cerâmico</span><span>58 m²</span><span>R$ 11.600</span></div><div className={styles.sheetRow}><span>Instalação elétrica</span><span>1 vb</span><span>R$ 6.950</span></div></div>
            <div className={styles.sheetTotal}><span>VALOR DA PROPOSTA</span><span>R$ 48.730,00</span></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>COMO FUNCIONA</p><h2>Da visita à proposta em três etapas.</h2></div>
        <div className={styles.steps}>
          <article className={styles.step}><span className={styles.stepNum}>01 · OBRA</span><h3>Cadastre cliente e obra</h3><p>Informe contratante, endereço, área, prazo, responsável técnico e escopo.</p></article>
          <article className={styles.step}><span className={styles.stepNum}>02 · SERVIÇOS</span><h3>Monte a planilha</h3><p>Adicione etapas, unidade, quantidade, materiais, mão de obra, equipamentos e observações.</p></article>
          <article className={styles.step}><span className={styles.stepNum}>03 · FECHAMENTO</span><h3>Defina BDI e gere o PDF</h3><p>Finalize desconto, validade, pagamento, inclusões e exclusões e arquive a proposta.</p></article>
        </div>
      </section>

      <section id="planos" className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>MESMOS PLANOS DO ORÇAMÓVEL</p><h2>Escolha o período que faz sentido para você.</h2><p className={styles.lead}>Os pagamentos são avulsos. Não há cobrança ou renovação automática.</p></div>
        <div className={styles.plans}>
          <article className={styles.plan}><span className={styles.planLabel}>Mensal</span><div className={styles.price}>R$ 9,99</div><p>30 dias de acesso.</p><ul><li><Check size={16}/>Todos os recursos</li><li><Check size={16}/>Pagamento único</li></ul></article>
          <article className={styles.plan}><span className={styles.planLabel}>Anual</span><div className={styles.price}>R$ 99,99</div><p>365 dias de acesso.</p><ul><li><Check size={16}/>Todos os recursos</li><li><Check size={16}/>Pagamento único</li></ul></article>
          <article className={`${styles.plan} ${styles.featuredPlan}`}><span className={styles.planLabel}>Vitalício · oferta de lançamento</span><div className={styles.price}>R$ 149,99</div><p>Preço normal previsto: R$ 249,99.</p><ul><li><Check size={16}/>Acesso sem vencimento</li><li><Check size={16}/>Pagamento único</li></ul></article>
        </div>
        <div className={styles.actions} style={{justifyContent:'center',marginTop:24}}><Link href="/apps/obra-civil" className={styles.primary}>Começar 30 dias grátis <ArrowRight size={17}/></Link></div>
      </section>

      <PublicTestimonials productId="obra-civil" productName="OrçaObra" audienceLabel="profissionais da construção que usam o aplicativo" />

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>DÚVIDAS FREQUENTES</p><h2>Antes de começar.</h2></div>
        <div className={styles.faq}>{faqs.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className={`${styles.container} ${styles.final}`}><div className={styles.finalBox}><div><h2>Organize a próxima proposta no OrçaObra.</h2><p>Comece pelo navegador. Seu período grátis é separado dos outros aplicativos Orça.</p></div><Link href="/apps/obra-civil" className={styles.primary}>Testar grátis <ArrowRight size={17}/></Link></div></section>
    </main>

    <footer className={styles.footer}><div className={`${styles.container} ${styles.footerInner}`}><span>OrçaObra · Aplicativos Orça</span><Link href="/">Ver todos os aplicativos</Link></div></footer>
  </div>;
}
