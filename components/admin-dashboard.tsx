"use client";

import { ArrowLeft, BadgeDollarSign, BarChart3, Check, Clock3, LoaderCircle, RefreshCw, Star, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Summary = {
  users:number;
  trial:number;
  active:number;
  monthly:number;
  annual:number;
  lifetime:number;
  site_views:number;
  app_opens:number;
  workspace_opens:number;
  site_plan_interests:number;
  plan_opens:number;
  checkout_starts:number;
  purchases:number;
  feedback_total:number;
};
type Settings = { monthly_price:number; annual_price:number; lifetime_price:number; lifetime_promo_price:number; promotion_ends_at:string };
type Feedback = { id:number; user_email:string; user_name:string; rating:number; message:string; status:string; created_at:string };
type UserRow = { id:string; email:string; subscription_status:string; plan_type:string|null; trial_ends_at:string; access_expires_at:string|null; created_at:string };
type Dashboard = { summary:Summary; settings:Settings; feedback:Feedback[]; users:UserRow[] };

const planLabel:Record<string,string>={monthly:"Mensal",annual:"Anual",lifetime:"Vitalício"};

function metric(label:string,value:number,icon:React.ReactNode,helper?:string){return <article className="app-card p-4"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span><p className="text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#74837f]">{label}</p>{helper&&<p className="mt-2 text-xs leading-5 text-[#8a9794]">{helper}</p>}</article>}

function localDateTimeInput(value:string){
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return "";
 const local=new Date(date.getTime()-date.getTimezoneOffset()*60_000);
 return local.toISOString().slice(0,16);
}

function shortDate(value:string|null){
 if(!value)return "";
 const date=new Date(value);
 return Number.isNaN(date.getTime())?"":date.toLocaleDateString("pt-BR");
}

function accessLabel(user:UserRow){
 const now=Date.now();
 const trialEnd=new Date(user.trial_ends_at).getTime();
 const accessEnd=user.access_expires_at?new Date(user.access_expires_at).getTime():null;
 if(user.subscription_status==="active"&&user.plan_type==="lifetime")return "Vitalício ativo";
 if(user.subscription_status==="active"&&(user.plan_type==="monthly"||user.plan_type==="annual")&&(!accessEnd||accessEnd>now)){
  return `${planLabel[user.plan_type]} ativo${user.access_expires_at?` até ${shortDate(user.access_expires_at)}`:""}`;
 }
 if(trialEnd>now)return `Teste até ${shortDate(user.trial_ends_at)}`;
 return "Acesso encerrado";
}

export function AdminDashboard({onBack}:{onBack:()=>void}){
 const supabase=getSupabaseBrowserClient();
 const [data,setData]=useState<Dashboard|null>(null);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");
 const [settings,setSettings]=useState<Settings|null>(null);
 const load=useCallback(async()=>{if(!supabase)return;setLoading(true);const {data:result,error}=await supabase.rpc("admin_orcamovel_dashboard");if(error){setMessage("Não foi possível carregar o painel mestre.");}else{const next=result as Dashboard;setData(next);setSettings(next.settings);setMessage("");}setLoading(false);},[supabase]);
 useEffect(()=>{void load();},[load]);
 const saveSettings=async()=>{
  if(!supabase||!settings)return;
  const prices=[settings.monthly_price,settings.annual_price,settings.lifetime_price,settings.lifetime_promo_price];
  if(prices.some(value=>!Number.isFinite(Number(value))||Number(value)<0)){setMessage("Confira os preços antes de salvar.");return;}
  const promotionEnd=new Date(settings.promotion_ends_at);
  if(Number.isNaN(promotionEnd.getTime())){setMessage("Informe uma data válida para o fim da promoção.");return;}
  setMessage("Salvando…");
  const {error}=await supabase.rpc("admin_update_orcamovel_settings",{p_monthly:Number(settings.monthly_price),p_annual:Number(settings.annual_price),p_lifetime:Number(settings.lifetime_price),p_promo:Number(settings.lifetime_promo_price),p_promotion_ends_at:promotionEnd.toISOString()});
  setMessage(error?"Não foi possível salvar os valores.":"Preços e promoção atualizados.");
  if(!error)void load();
 };
 const extend=async(user:UserRow)=>{
  if(!supabase)return;
  if(user.subscription_status==="active"&&user.plan_type==="lifetime"){setMessage(`${user.email} já possui acesso vitalício.`);return;}
  const raw=window.prompt(`Quantos dias deseja acrescentar para ${user.email}?`,"30");
  if(!raw)return;
  const days=Number(raw);
  if(!Number.isInteger(days)||days<1||days>3650){setMessage("Informe uma quantidade válida entre 1 e 3650 dias.");return;}
  const {error}=await supabase.rpc("admin_extend_user_access",{p_user_id:user.id,p_days:days});
  setMessage(error?"Não foi possível alterar o período.":`${days} dias acrescentados ao acesso de ${user.email}.`);
  if(!error)void load();
 };
 const feedbackStatus=async(id:number,status:string)=>{if(!supabase)return;const {error}=await supabase.rpc("admin_update_feedback_status",{p_id:id,p_status:status});setMessage(error?"Não foi possível atualizar a avaliação.":"Avaliação atualizada.");if(!error)void load();};
 if(loading&&!data)return <main className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-[var(--brand)]"/></main>;
 if(!data||!settings)return <main className="mx-auto max-w-xl p-6"><button onClick={onBack} className="quiet-button"><ArrowLeft size={18}/>Voltar</button><p className="mt-5">{message}</p></main>;
 const s=data.summary;
 return <main className="content-safe mx-auto max-w-6xl px-4 py-6 sm:px-6">
  <header className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--brand)]">Conta mestre</p><h1 className="text-3xl font-extrabold tracking-[-.04em]">Admin OrçaMóvel</h1></div><div className="flex gap-2"><button onClick={()=>void load()} className="quiet-button !px-3" aria-label="Atualizar painel"><RefreshCw size={17}/></button><button onClick={onBack} className="quiet-button"><ArrowLeft size={17}/>App</button></div></header>
  {message&&<p className="mb-5 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-sm font-bold text-[var(--brand)]">{message}</p>}

  <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
   {metric("Usuários",s.users,<Users size={19}/>,"Contas cadastradas no OrçaMóvel.")}
   {metric("Em teste",s.trial,<Clock3 size={19}/>,"Testes gratuitos ainda dentro do prazo.")}
   {metric("Planos ativos",s.active,<Check size={19}/>,"Planos pagos com acesso atualmente válido.")}
   {metric("Compras",s.purchases,<BadgeDollarSign size={19}/>,"Pagamentos aprovados do OrçaMóvel.")}
   {metric("Avaliações",s.feedback_total,<Star size={19}/>,"Avaliações recebidas no aplicativo.")}
  </section>

  <section className="mt-6 app-card p-5">
   <h2 className="text-xl font-extrabold">Aquisição e uso</h2>
   <p className="mt-1 text-sm leading-6 text-[#74837f]">Estas métricas são independentes. Uma pessoa pode abrir o OrçaMóvel por PWA, favorito ou link direto sem passar pela página comercial, por isso o número do app pode ser maior que o do site.</p>
   <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
    {metric("Visitantes do site",s.site_views,<BarChart3 size={18}/>,"Navegadores únicos conhecidos na página de apresentação.")}
    {metric("Abriram o app",s.app_opens,<BarChart3 size={18}/>,"Abriram /apps/moveis, inclusive a tela de entrada.")}
    {metric("Usaram o sistema",s.workspace_opens,<BarChart3 size={18}/>,"Contas autenticadas com acesso válido que chegaram à área de trabalho.")}
    {metric("Contas cadastradas",s.users,<Users size={18}/>,"Total de perfis criados no OrçaMóvel.")}
   </div>
  </section>

  <section className="mt-6 app-card p-5">
   <h2 className="text-xl font-extrabold">Conversão comercial</h2>
   <p className="mt-1 text-sm leading-6 text-[#74837f]">O interesse nos planos da página comercial agora fica separado da abertura da tela de planos dentro do aplicativo. Assim um clique no site não é confundido com uma intenção de compra já autenticada.</p>
   <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
    {metric("Planos no site",s.site_plan_interests,<BarChart3 size={18}/>,"Visitantes que tocaram em Planos na apresentação.")}
    {metric("Planos no app",s.plan_opens,<BarChart3 size={18}/>,"Contas que abriram as opções de plano dentro do app.")}
    {metric("Iniciaram checkout",s.checkout_starts,<BarChart3 size={18}/>,"Contas que escolheram um plano e iniciaram o pagamento.")}
    {metric("Compras aprovadas",s.purchases,<BadgeDollarSign size={18}/>,"Pagamentos aprovados e registrados pelo webhook.")}
   </div>
   <p className="mt-4 rounded-xl bg-[#f5f8f7] px-4 py-3 text-xs leading-5 text-[#71817d]">O histórico foi preservado. Eventos antigos que não possuíam identificador persistente continuam contados por sessão como aproximação; os novos acessos anônimos usam um identificador aleatório do navegador, e ações autenticadas usam a conta.</p>
  </section>

  <section className="mt-6 app-card p-5"><h2 className="text-xl font-extrabold">Preços e promoção</h2><p className="mt-1 text-sm text-[#74837f]">Os valores salvos aqui alimentam a tela de planos. A data é exibida no seu horário local e salva corretamente em UTC.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
   {([["monthly_price","Mensal"],["annual_price","Anual"],["lifetime_price","Vitalício"],["lifetime_promo_price","Vitalício promocional"]] as const).map(([key,label])=><label key={key}><span className="field-label">{label}</span><input className="field-input" type="number" min="0" step=".01" value={settings[key]} onChange={e=>setSettings({...settings,[key]:Number(e.target.value)})}/></label>)}
   <label><span className="field-label">Fim da promoção</span><input className="field-input" type="datetime-local" value={localDateTimeInput(settings.promotion_ends_at)} onChange={e=>{if(!e.target.value)return;const next=new Date(e.target.value);if(!Number.isNaN(next.getTime()))setSettings({...settings,promotion_ends_at:next.toISOString()});}}/></label>
  </div><button onClick={()=>void saveSettings()} className="primary-button mt-4">Salvar condições</button></section>

  <section className="mt-6 app-card overflow-hidden"><div className="p-5"><h2 className="text-xl font-extrabold">Avaliações recebidas</h2></div><div className="divide-y divide-[#e4ece9]">{data.feedback.length?data.feedback.map(f=><article key={f.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-extrabold">{f.user_name||f.user_email}</p><p className="text-xs text-[#74837f]">{f.user_email} · {new Date(f.created_at).toLocaleDateString("pt-BR")} · {f.status==="approved"?"Aprovada":f.status==="archived"?"Arquivada":"Nova"}</p></div><span className="font-bold text-[#a77826]">{"★".repeat(f.rating)}{"☆".repeat(5-f.rating)}</span></div><p className="mt-3 text-sm leading-6">{f.message}</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={f.status==="approved"} onClick={()=>void feedbackStatus(f.id,"approved")} className="secondary-button !min-h-9 !px-3 disabled:opacity-50">Aprovar para o site</button><button disabled={f.status==="archived"} onClick={()=>void feedbackStatus(f.id,"archived")} className="quiet-button !min-h-9 !px-3 disabled:opacity-50">Arquivar</button></div></article>):<p className="p-5 text-sm text-[#74837f]">Nenhuma avaliação recebida ainda.</p>}</div></section>

  <section className="mt-6 app-card overflow-hidden"><div className="p-5"><h2 className="text-xl font-extrabold">Usuários e planos</h2><p className="mt-1 text-sm text-[#74837f]">Mensal ativo: {s.monthly} · Anual ativo: {s.annual} · Vitalício: {s.lifetime}</p></div><div className="divide-y divide-[#e4ece9]">{data.users.map(u=><article key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate font-bold">{u.email}</p><p className="mt-1 text-xs text-[#74837f]">{accessLabel(u)} · conta criada em {new Date(u.created_at).toLocaleDateString("pt-BR")}</p></div><button disabled={u.subscription_status==="active"&&u.plan_type==="lifetime"} onClick={()=>void extend(u)} className="secondary-button !min-h-10 !px-3 disabled:cursor-not-allowed disabled:opacity-50"><Clock3 size={16}/>{u.subscription_status==="active"&&u.plan_type==="lifetime"?"Acesso vitalício":"Adicionar dias"}</button></article>)}</div></section>
 </main>;
}
