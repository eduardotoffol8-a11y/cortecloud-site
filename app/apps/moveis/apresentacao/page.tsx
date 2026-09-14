import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText, FolderOpen, Monitor, Palette, Star, UsersRound } from "lucide-react";
import styles from "./presentation.module.css";

export const metadata: Metadata = {
  title: "OrçaMóvel | Orçamentos profissionais no celular e computador",
  description: "Cadastre clientes, monte propostas de móveis sob medida e gere PDFs personalizados no celular ou computador. Teste o OrçaMóvel por 30 dias grátis.",
};

const assets = "/orcamovel/apresentacao";
const screenshots = [
  { file: "painel.jpg", title: "Seu negócio em uma tela", description: "Clientes, pendências e PDFs em uma visão geral." },
  { file: "orcamentos.jpg", title: "Orçamentos organizados", description: "Consulte propostas e atualize seus status." },
  { file: "pdfs.jpg", title: "Seus PDFs à mão", description: "Encontre, abra e baixe os arquivos gerados." },
  { file: "ajustes.jpg", title: "Tudo no seu lugar", description: "Acesse os dados da marcenaria e seu plano." },
  { file: "marca.jpg", title: "Com a sua identidade", description: "Escolha as cores que aparecem nos seus PDFs." },
];
const reviews = [
  { name: "Carlos Mendes", profile: "Marceneiro autônomo", title: "Praticidade no dia a dia", text: "O que mais gostei foi a praticidade. Em poucos minutos consegui cadastrar o cliente, montar o orçamento e gerar um PDF muito mais apresentável." },
  { name: "Juliano Ribeiro", profile: "Dono de marcenaria", title: "Um PDF profissional", text: "O PDF ficou com aparência profissional de verdade. Para quem trabalha com móveis sob medida, isso passa muito mais confiança para o cliente." },
  { name: "Rafael Costa", profile: "Marceneiro e montador", title: "Simples de usar", text: "Gostei porque o sistema é direto. Não fica cheio de coisa desnecessária. Dá para usar no celular sem complicação e organizar os orçamentos com facilidade." },
  { name: "André Ferreira", profile: "Pequena marcenaria", title: "A marca da minha marcenaria", text: "A parte de personalizar a marca é um diferencial muito bom. As cores e o layout deixam a proposta mais bonita e valorizam o meu trabalho." },
  { name: "Diego Martins", profile: "Profissional de móveis planejados", title: "Tudo mais organizado", text: "Para quem fazia tudo no improviso, o OrçaMóvel ajuda bastante. Cliente, orçamento e PDF ficam no mesmo lugar, o que economiza tempo e evita retrabalho." },
];
const benefits = [
  { icon: Monitor, title: "Celular e computador", text: "Use a mesma conta no navegador ou instale o OrçaMóvel no seu dispositivo." },
  { icon: FolderOpen, title: "Mais organização", text: "Reúna clientes, orçamentos e PDFs no mesmo aplicativo." },
  { icon: FileText, title: "Uma apresentação profissional", text: "Envie uma proposta clara, com os detalhes dos móveis sob medida." },
  { icon: Palette, title: "A identidade da sua marcenaria", text: "Personalize o PDF com nome, logo e cores da sua empresa." },
];
const faq = [
  ["Preciso instalar para usar?", "Não. Você pode acessar pelo navegador no celular ou computador. Se preferir, instale o OrçaMóvel para abrir diretamente pelo ícone."],
  ["Posso usar no computador?", "Sim. O OrçaMóvel funciona no PC pelo navegador e também pode ser instalado como aplicativo no Chrome ou Edge. Você entra com a mesma conta usada no celular."],
  ["O que consigo fazer pelo celular ou PC?", "Cadastrar clientes, montar propostas de móveis sob medida, consultar orçamentos e gerar PDFs personalizados."],
  ["Posso colocar a marca da minha marcenaria?", "Sim. Nos ajustes, você pode configurar os dados da empresa, a logo e as cores usadas nos PDFs."],
  ["Como funcionam os 30 dias grátis?", "Você pode experimentar o aplicativo por 30 dias, sem cartão. A data de término aparece na área de ajustes do seu plano."],
  ["Existe cobrança automática depois do teste?", "Não. Os planos atuais têm pagamento avulso. Você escolhe um plano no aplicativo para continuar após o período grátis, sem renovação automática."],
  ["Como envio o orçamento para meu cliente?", "Gere o PDF no aplicativo, abra ou baixe o arquivo e compartilhe pelo canal que você já usa com seu cliente."],
];

function ReviewerMonogram({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(part => part[0]).join("");
  return <span className={styles.avatar} aria-hidden="true">{initials}</span>;
}

function TrialLink({ light = false }: { light?: boolean }) {
  return <Link href="/apps/moveis" className={`${styles.button} ${light ? styles.lightButton : ""}`}>Testar grátis por 30 dias <ArrowRight size={18} aria-hidden="true" /></Link>;
}

export default function MoveisPresentationPage() {
  return (
    <div className={styles.page}>
      <a href="#conteudo" className={styles.skip}>Pular para o conteúdo</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/apps" className={styles.brand} aria-label="OrçaMóvel - voltar à central de aplicativos">
            <Image src="/orcamovel-brand-192.png" width={44} height={44} alt="" />
            <span>OrçaMóvel<small>Marcenaria sob medida</small></span>
          </Link>
          <nav aria-label="Navegação principal" className={styles.nav}>
            <a href="#galeria" className={styles.desktopLink}>O aplicativo</a>
            <a href="#planos" className={styles.desktopLink}>Planos</a>
            <Link href="/apps/moveis" className={styles.openApp}>Abrir app <ArrowRight size={16} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>
      <main id="conteudo">
        <section className={`${styles.container} ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>DA SUA MARCENARIA PARA O CLIENTE</p>
            <h1>Faça orçamentos profissionais <span>no celular ou computador.</span></h1>
            <p className={styles.lead}>Cadastre clientes, monte propostas de móveis sob medida e gere PDFs personalizados com a identidade da sua marcenaria.</p>
            <div className={styles.actions}><TrialLink /><a href="#galeria" className={styles.textLink}>Veja o aplicativo</a></div>
            <p className={styles.reassurance}><Check size={16} aria-hidden="true" />30 dias grátis <span>·</span> Sem cartão <span>·</span> No celular e no PC</p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualLabel}>SEU TRABALHO MERECE UMA BOA PROPOSTA.</div>
            <div className={styles.heroPhone}>
              <Image src={`${assets}/painel.jpg`} alt="Screenshot real do painel do OrçaMóvel no celular, com clientes, pendências e PDFs gerados" width={691} height={1536} sizes="(max-width: 700px) 240px, 280px" preload />
            </div>
            <div className={styles.pdfBadge}><FileText size={24} aria-hidden="true" /><span>Do orçamento ao PDF<small>Com a identidade da sua marcenaria</small></span></div>
            <span className={styles.realCapture}>Captura real do aplicativo</span>
          </div>
        </section>

        <section className={`${styles.container} ${styles.benefits}`} aria-label="Benefícios do OrçaMóvel">
          {benefits.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={25} aria-hidden="true" /><h2>{title}</h2><p>{text}</p></article>)}
        </section>

        <section id="galeria" className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>POR DENTRO DO ORÇAMÓVEL</p><h2>Veja o que você vai usar.</h2></div><p>Telas reais do aplicativo.<br />Deslize para explorar e toque para ampliar.</p></div>
          <div className={styles.gallery} tabIndex={0} role="region" aria-label="Galeria de cinco capturas reais do aplicativo">
            {screenshots.map((shot, index) => <figure key={shot.file} className={styles.shot}>
              <a href={`${assets}/${shot.file}`} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar captura: ${shot.title} (nova aba)`}><Image src={`${assets}/${shot.file}`} alt={shot.title} width={691} height={1536} sizes="(max-width: 600px) 240px, 260px" /></a>
              <figcaption><span>0{index + 1}</span><h3>{shot.title}</h3><p>{shot.description}</p></figcaption>
            </figure>)}
          </div>
        </section>

        <section id="pdf" className={styles.pdfSection}>
          <div className={`${styles.container} ${styles.pdfGrid}`}>
            <div className={styles.paperWrap}>
              <iframe
                className={styles.paper}
                src={`${assets}/ORC-2026-001-exemplo-marrom.pdf#page=1&view=FitH`}
                title="Prévia do orçamento de demonstração gerado pelo OrçaMóvel"
                loading="lazy"
                style={{ aspectRatio: "210 / 297", minHeight: "560px", background: "white" }}
              />
              <p>Exemplo real de demonstração gerado no OrçaMóvel</p>
            </div>
            <div><p className={styles.eyebrow}>A SUA MARCA EM CADA DETALHE</p><h2>Seu orçamento.<br />A sua identidade.</h2><p className={styles.lead}>Transforme os detalhes do projeto em uma proposta organizada, pronta para apresentar ao cliente.</p>
              <ul className={styles.checkList}>{["Nome, logo e cores da sua marcenaria", "Móveis, medidas, materiais e acabamentos", "Valores e condições comerciais em um documento", "PDF pronto para baixar e compartilhar"].map(item => <li key={item}><Check size={19} aria-hidden="true" />{item}</li>)}</ul>
              <p style={{ color: "#667970", fontSize: ".86rem", marginBottom: "18px" }}>Este exemplo usa uma identidade em marrom e dourado para mostrar como a proposta pode acompanhar o visual da marcenaria.</p>
              <div className={styles.pdfLinks}>
                <a className={styles.button} href={`${assets}/ORC-2026-001-exemplo-marrom.pdf`} target="_blank" rel="noopener noreferrer">Ver PDF completo <ArrowRight size={18} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.section}`}>
          <p className={styles.eyebrow}>SIMPLES DO INÍCIO AO ENVIO</p><h2>Três passos. Uma proposta profissional.</h2>
          <div className={styles.steps}>{[
            { icon: UsersRound, title: "Cadastre o cliente", text: "Preencha os dados de contato para começar a proposta." },
            { icon: FolderOpen, title: "Monte o orçamento", text: "Adicione os móveis, as medidas, os valores e os detalhes do projeto." },
            { icon: FileText, title: "Gere e envie o PDF", text: "Crie o documento com a sua marca e compartilhe com o cliente." },
          ].map(({ icon: Icon, title, text }, i) => <article key={title}><div className={styles.stepTop}><span>0{i + 1}</span><Icon size={25} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className={styles.reviewSection} aria-labelledby="avaliacoes">
          <div className={styles.container}><p className={styles.eyebrow}>PRIMEIRAS IMPRESSÕES</p><h2 id="avaliacoes">Avaliações iniciais</h2><p className={styles.reviewNote}>Exemplos ilustrativos de feedbacks de teste. Identidades fictícias; não são avaliações públicas verificadas.</p>
            <div className={styles.reviews} tabIndex={0} role="region" aria-label="Exemplos de feedbacks de teste">
              {reviews.map(review => <article key={review.name} className={styles.review}>
                <div className={styles.reviewer}><ReviewerMonogram name={review.name} /><div><h3>{review.name}</h3><p>{review.profile}</p></div></div>
                <div className={styles.stars} aria-label="5 estrelas ilustrativas">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" aria-hidden="true" />)}<span>Exemplo de teste</span></div>
                <h4>{review.title}</h4><blockquote>“{review.text}”</blockquote>
              </article>)}
            </div>
          </div>
        </section>

        <section id="planos" className={`${styles.container} ${styles.section}`}>
          <div className={styles.centerHead}><p className={styles.eyebrow}>COMECE PELO TESTE</p><h2>30 dias para experimentar.<br />Depois, escolha seu plano.</h2><p>Use o OrçaMóvel no dia a dia da sua marcenaria. Sem cartão no teste.</p><TrialLink /></div>
          <div className={styles.plans}>
            <article><p className={styles.planName}>Mensal</p><p className={styles.price}>R$ 9,99</p><p>30 dias de acesso</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único por período</li></ul><Link href="/apps/moveis?plans=1" className={styles.outlineButton}>Escolher plano mensal <ArrowRight size={17} /></Link></article>
            <article className={styles.featuredPlan}><p className={styles.planName}>Anual</p><p className={styles.price}>R$ 99,99</p><p>365 dias de acesso</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único por período</li></ul><Link href="/apps/moveis?plans=1" className={styles.button}>Escolher plano anual <ArrowRight size={17} /></Link></article>
            <article><p className={styles.planName}>Vitalício</p><p className={styles.lifetimePrice}>Acesso sem vencimento</p><p>Consulte a oferta vigente no app</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único</li></ul><Link href="/apps/moveis?plans=1" className={styles.outlineButton}>Ver oferta vitalícia <ArrowRight size={17} /></Link></article>
          </div><p className={styles.planNote}>Pagamentos avulsos. Não há renovação nem cobrança automática ao fim do período.<br />A contratação e a confirmação dos valores acontecem dentro do aplicativo.</p>
        </section>

        <section className={`${styles.container} ${styles.faq}`}><div><p className={styles.eyebrow}>ANTES DE COMEÇAR</p><h2>Ficou alguma dúvida?</h2></div><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className={styles.finalCta}><div className={styles.container}><p className={styles.eyebrow}>SEU PRÓXIMO ORÇAMENTO COMEÇA AQUI</p><h2>Capriche nos móveis.<br />E na apresentação também.</h2><p>Leve a identidade da sua marcenaria para cada proposta.</p><TrialLink light /><small>30 dias grátis · Sem cartão</small></div></section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}><span>OrçaMóvel · Uma ferramenta da família Orça</span><div><Link href="/apps">Todos os aplicativos</Link><Link href="/apps/moveis">Abrir app</Link></div></footer>
    </div>
  );
}
