import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText, FolderOpen, MessageCircle, Monitor, Palette, PlayCircle, Send, UsersRound, Volume2 } from "lucide-react";
import { InstallAppButton } from "@/components/install-app-button";
import { LandingAnalytics } from "@/components/landing-analytics";
import styles from "./presentation.module.css";

export const metadata: Metadata = {
  title: "OrçaMóvel | Orçamentos profissionais no celular e computador",
  description: "Cadastre clientes, monte propostas de móveis sob medida e gere PDFs personalizados no celular ou computador. Teste o OrçaMóvel por 30 dias grátis.",
};

const assets = "/orcamovel/apresentacao";
const demoVideoUrl = "https://drive.google.com/uc?export=download&id=1ck_V9DzEomhS-37jrTraAN7X1H-xDvYz";
const customProjectUrl = "https://wa.me/5515981620985?text=Ol%C3%A1%2C%20conheci%20seu%20trabalho%20pelo%20Or%C3%A7aM%C3%B3vel%20e%20gostaria%20de%20conversar%20sobre%20um%20site%20ou%20aplicativo%20personalizado%20para%20minha%20empresa.";
const screenshots = [
  { file: "painel.jpg", title: "Seu negócio em uma tela", description: "Clientes, pendências e PDFs em uma visão geral." },
  { file: "orcamentos.jpg", title: "Orçamentos organizados", description: "Consulte propostas e atualize seus status." },
  { file: "pdfs.jpg", title: "Seus PDFs à mão", description: "Encontre, visualize e compartilhe as propostas arquivadas." },
  { file: "ajustes.jpg", title: "Tudo no seu lugar", description: "Configure sua empresa, instalação e acesso ao plano." },
  { file: "marca.jpg", title: "Com a sua identidade", description: "Use nome, frase, logo e cores da sua marcenaria nos PDFs." },
];
const useCases = [
  { title: "Orçamento feito na visita", text: "Cadastre o cliente e comece a proposta ainda no local da medição, usando o celular." },
  { title: "Revisões sem perder a organização", text: "Atualize o projeto e mantenha o PDF revisado arquivado na pasta do cliente." },
  { title: "Proposta pronta para enviar", text: "Abra o PDF dentro do OrçaMóvel e compartilhe pelo WhatsApp, e-mail ou outro aplicativo." },
  { title: "Sua marcenaria em destaque", text: "Apresente nome, logo, cores, materiais, condições e valores em um documento profissional." },
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
  ["Como envio o orçamento para meu cliente?", "Gere o PDF, abra dentro do OrçaMóvel e toque em “Enviar proposta” para escolher WhatsApp, e-mail ou outro aplicativo."],
];

function TrialLink({ light = false }: { light?: boolean }) {
  return <Link href="/apps/moveis" data-track="app_cta" className={`${styles.button} ${styles.attentionCta} ${light ? styles.lightButton : ""}`}>Criar conta e testar grátis <ArrowRight size={18} aria-hidden="true" /></Link>;
}

export default function MoveisPresentationPage() {
  return (
    <div className={styles.page}><LandingAnalytics />
      <a href="#conteudo" className={styles.skip}>Pular para o conteúdo</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="OrçaMóvel - página inicial">
            <Image src="/app-icon.svg" width={44} height={44} alt="" />
            <span>OrçaMóvel<small>Marcenaria sob medida</small></span>
          </Link>
          <nav aria-label="Navegação principal" className={styles.nav}>
            <a href="#como-funciona" className={styles.desktopLink}>Como funciona</a>
            <a href="#planos" data-track="plans_open" className={styles.desktopLink}>Planos</a>
            <span className={styles.headerInstall}><InstallAppButton /></span>
            <Link href="/apps/moveis" className={`${styles.openApp} ${styles.attentionCta}`}>Entrar no app <ArrowRight size={16} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>
      <main id="conteudo">
        <section className={`${styles.container} ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>ORÇAMENTOS PROFISSIONAIS PARA MARCENARIA</p>
            <h1>Organize seus orçamentos e apresente sua marcenaria <span>com mais profissionalismo.</span></h1>
            <p className={styles.lead}>Do primeiro atendimento ao envio da proposta: cadastre clientes, detalhe cada móvel, organize revisões e gere PDFs com a identidade da sua marcenaria — pelo celular ou computador.</p>
            <div className={styles.actions}><TrialLink /><span className={styles.installCta}><InstallAppButton /></span><a href="#video" className={styles.textLink}>Ver demonstração com som</a></div>
            <p className={styles.reassurance}><Check size={16} aria-hidden="true" />30 dias grátis <span>·</span> Sem cartão <span>·</span> Seus PDFs ficam arquivados</p>
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

        <section id="video" className={styles.videoSection} aria-labelledby="video-title">
          <div className={`${styles.container} ${styles.videoGrid}`}>
            <div className={styles.videoCopy}>
              <p className={styles.eyebrow}>VEJA O ORÇAMÓVEL EM AÇÃO</p>
              <h2 id="video-title">Veja o fluxo real antes de começar.</h2>
              <p className={styles.videoLead}>Assista à demonstração do OrçaMóvel com som e veja como a rotina sai do atendimento e chega a uma proposta organizada e profissional.</p>
              <div className={styles.videoHighlights}>
                <span><Check size={17} aria-hidden="true" />Cadastro e organização</span>
                <span><Check size={17} aria-hidden="true" />Personalização da marcenaria</span>
                <span><Check size={17} aria-hidden="true" />Orçamento e PDF profissional</span>
              </div>
              <div className={styles.videoActions}><TrialLink /><span><Volume2 size={17} aria-hidden="true" />Use o controle do player para ajustar o som</span></div>
            </div>
            <div className={styles.videoStage}>
              <div className={styles.videoTopline}><PlayCircle size={18} aria-hidden="true" /><strong>Demonstração real</strong><span>02:07</span></div>
              <div className={styles.videoPhoneFrame}>
                <video className={styles.demoVideo} controls playsInline preload="metadata" poster={`${assets}/painel.jpg`} aria-label="Demonstração em vídeo do OrçaMóvel com som">
                  <source src={demoVideoUrl} type="video/mp4" />
                  Seu navegador não suporta reprodução de vídeo.
                </video>
              </div>
              <p className={styles.videoHint}><Volume2 size={16} aria-hidden="true" />Toque em reproduzir para assistir com som.</p>
            </div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.benefits}`} aria-label="Benefícios do OrçaMóvel">
          {benefits.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={25} aria-hidden="true" /><h2>{title}</h2><p>{text}</p></article>)}
        </section>

        <section id="galeria" className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>POR DENTRO DO ORÇAMÓVEL</p><h2>Veja o que você vai usar.</h2></div><p>Telas reais do aplicativo.<br />Deslize para explorar e toque para ampliar.</p></div>
          <div className={styles.gallery} tabIndex={0} role="region" aria-label="Galeria de seis recursos do aplicativo">
            {screenshots.map((shot, index) => <figure key={shot.file} className={styles.shot}>
              <a href={`${assets}/${shot.file}`} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar captura: ${shot.title} (nova aba)`}><Image src={`${assets}/${shot.file}`} alt={shot.title} width={691} height={1536} sizes="(max-width: 600px) 240px, 260px" /></a>
              <figcaption><span>0{index + 1}</span><h3>{shot.title}</h3><p>{shot.description}</p></figcaption>
            </figure>)}
            <figure className={styles.shot}>
              <div className={styles.calculatorPreview} aria-label="Prévia da calculadora flutuante">
                <div className={styles.calcDashboard}><strong>Seu negócio</strong><span>Orçamentos e clientes</span></div>
                <div className={styles.calcPanel}><div className={styles.calcTitle}><span>▣</span><strong>Calculadora</strong><span>—</span></div><div className={styles.calcDisplay}>0</div><div className={styles.calcKeys}>{["C","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",",","="].map(key=><span key={key} className={key==="=" ? styles.calcEqual : ""}>{key}</span>)}</div></div>
              </div>
              <figcaption><span>06</span><h3>Calculadora sempre à mão</h3><p>Faça contas durante o orçamento sem sair do aplicativo.</p></figcaption>
            </figure>
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
            <div><p className={styles.eyebrow}>A SUA MARCA EM CADA DETALHE</p><h2>Seu orçamento.<br />A sua identidade.</h2><p className={styles.lead}>Entregue ao cliente um documento claro e valorizado, enquanto o arquivo permanece organizado dentro do OrçaMóvel para consultar, revisar e enviar novamente.</p>
              <ul className={styles.checkList}>{["Nome, logo e cores da sua marcenaria", "Móveis, medidas, materiais e acabamentos", "Valores e condições comerciais em um documento", "PDF arquivado, revisável e pronto para compartilhar"].map(item => <li key={item}><Check size={19} aria-hidden="true" />{item}</li>)}</ul>
              <p style={{ color: "#667970", fontSize: ".86rem", marginBottom: "18px" }}>Este exemplo usa uma identidade em marrom e dourado para mostrar como a proposta pode acompanhar o visual da marcenaria.</p>
              <div className={styles.pdfLinks}>
                <a className={styles.button} href={`${assets}/ORC-2026-001-exemplo-marrom.pdf`} target="_blank" rel="noopener noreferrer">Ver modelo de proposta <ArrowRight size={18} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className={`${styles.container} ${styles.section}`}>
          <p className={styles.eyebrow}>SIMPLES DO INÍCIO AO ENVIO</p><h2>Três passos. Uma proposta profissional.</h2>
          <div className={styles.steps}>{[
            { icon: UsersRound, title: "Cadastre o cliente", text: "Preencha os dados de contato para começar a proposta." },
            { icon: FolderOpen, title: "Monte o orçamento", text: "Adicione os móveis, as medidas, os valores e os detalhes do projeto." },
            { icon: Send, title: "Gere, revise e envie", text: "O PDF fica salvo no OrçaMóvel e pode ser compartilhado direto pelo celular." },
          ].map(({ icon: Icon, title, text }, i) => <article key={title}><div className={styles.stepTop}><span>0{i + 1}</span><Icon size={25} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className={styles.reviewSection} aria-labelledby="rotina-real">
          <div className={styles.container}>
            <p className={styles.eyebrow}>FEITO PARA A ROTINA DA MARCENARIA</p>
            <div className={styles.sectionHead}><h2 id="rotina-real">Menos arquivo perdido.<br />Mais clareza para vender.</h2><p>O OrçaMóvel acompanha o trabalho desde a medição até o envio da proposta.</p></div>
            <div className={styles.useCases}>
              {useCases.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="planos" className={`${styles.container} ${styles.section}`}>
          <div className={styles.centerHead}><p className={styles.eyebrow}>COMECE PELO TESTE</p><h2>Comece sem risco.<br />Continue no plano que fizer sentido.</h2><p>Teste o fluxo completo por 30 dias, sem cartão. Quando estiver pronto, escolha o período de acesso.</p><TrialLink /></div>
          <div className={styles.plans}>
            <article><p className={styles.planName}>Mensal</p><p className={styles.price}>R$ 9,99</p><p>30 dias de acesso</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único por período</li></ul><Link href="/apps/moveis?plans=1" data-track="plans_open" className={styles.outlineButton}>Escolher plano mensal <ArrowRight size={17} /></Link></article>
            <article className={styles.featuredPlan}><p className={styles.planName}>Anual</p><p className={styles.price}>R$ 99,99</p><p>365 dias de acesso</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único por período</li></ul><Link href="/apps/moveis?plans=1" data-track="plans_open" className={styles.button}>Escolher plano anual <ArrowRight size={17} /></Link></article>
            <article><p className={styles.planName}>Vitalício</p><p className={styles.lifetimePrice}>Acesso sem vencimento</p><p>Consulte a oferta vigente no app</p><ul><li><Check size={17} />Todos os recursos</li><li><Check size={17} />Pagamento único</li></ul><Link href="/apps/moveis?plans=1" data-track="plans_open" className={styles.outlineButton}>Ver oferta vitalícia <ArrowRight size={17} /></Link></article>
          </div><p className={styles.planNote}>Pagamentos avulsos. Não há renovação nem cobrança automática ao fim do período.<br />A contratação e a confirmação dos valores acontecem dentro do aplicativo.</p>
        </section>

        <section className={`${styles.container} ${styles.faq}`}><div><p className={styles.eyebrow}>ANTES DE COMEÇAR</p><h2>Ficou alguma dúvida?</h2></div><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className={`${styles.container} ${styles.customProject}`} aria-labelledby="projeto-personalizado">
          <div><p className={styles.eyebrow}>SOLUÇÃO SOB MEDIDA</p><h2 id="projeto-personalizado">Sua empresa também pode ter um sistema próprio.</h2><p>Criamos sites e aplicativos personalizados para organizar processos, apresentar sua marca e facilitar o atendimento aos seus clientes.</p></div>
          <div className={styles.customContact}><a href={customProjectUrl} target="_blank" rel="noopener noreferrer" className={styles.button}><MessageCircle size={19} aria-hidden="true" />Solicitar um projeto personalizado</a><span>WhatsApp +55 15 98162-0985<br /><a href="mailto:eduardo.toffol8@gmail.com">eduardo.toffol8@gmail.com</a></span></div>
        </section>

        <section className={styles.finalCta}><div className={styles.container}><p className={styles.eyebrow}>SEU PRÓXIMO ORÇAMENTO COMEÇA AQUI</p><h2>Seu próximo orçamento pode<br />parecer tão profissional quanto seu trabalho.</h2><p>Organize clientes, propostas e revisões em um app feito para marcenaria.</p><div className={styles.finalActions}><TrialLink light /><span className={styles.installCta}><InstallAppButton /></span></div><small>30 dias grátis · Sem cartão · Celular e computador</small></div></section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}><span>OrçaMóvel · Orçamentos profissionais para marcenaria</span><div><a href="#planos" data-track="plans_open">Planos</a><Link href="/apps/moveis">Entrar no app</Link></div></footer>
    </div>
  );
}
