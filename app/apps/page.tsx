import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Construction, Droplets, Hammer, Ruler, Zap } from "lucide-react";
import { productCatalog, type ProductId } from "@/lib/product-catalog";

const icons: Record<ProductId, typeof Hammer> = {
  moveis: Ruler,
  "obra-civil": Construction,
  hidraulica: Droplets,
  eletrica: Zap,
  revestimentos: Boxes,
};

export default function AppsPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">Sua central de orçamentos</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#172321] sm:text-5xl">Uma ferramenta certa para cada serviço.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#687875] sm:text-base">Use uma única conta para acessar aplicativos de orçamento feitos para diferentes profissões. Cada produto terá seu próprio período de teste e plano.</p>
          </div>
          <div className="rounded-2xl border border-[#dce5e2] bg-white px-4 py-3 text-sm font-semibold text-[#53635f] shadow-sm">
            <span className="flex items-center gap-2"><BadgeCheck size={17} className="text-[var(--brand)]" />30 dias grátis por aplicativo</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productCatalog.map((product) => {
            const Icon = icons[product.id];
            const available = product.status === "available";
            return (
              <article key={product.id} className={`app-card flex min-h-[17rem] flex-col p-5 sm:p-6 ${available ? "ring-1 ring-[var(--brand)]/10" : "opacity-80"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={23} /></span>
                  <span className={`rounded-full px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide ${available ? "bg-[#dff1ed] text-[var(--brand)]" : "bg-[#f1f3f2] text-[#7a8985]"}`}>{available ? "Disponível" : "Em breve"}</span>
                </div>
                <div className="mt-5 flex-1">
                  <p className="text-sm font-bold text-[var(--brand)]">{product.shortName}</p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">{product.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#687875]">{product.description}</p>
                  <p className="mt-3 text-xs font-semibold text-[#84928f]">Para {product.audience.toLowerCase()}</p>
                </div>
                {available ? (
                  <Link href={product.href} className="primary-button mt-5 w-full">Abrir OrçaMóvel <ArrowRight size={17} /></Link>
                ) : (
                  <div className="secondary-button mt-5 w-full cursor-default opacity-65">Em desenvolvimento</div>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl bg-[var(--brand-dark)] px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/65">Estrutura compartilhada</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">Uma conta. Vários aplicativos.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Clientes, arquivos, segurança e pagamentos poderão trabalhar sobre a mesma base, enquanto cada profissão mantém seus próprios campos, cálculos e PDFs.</p>
        </section>
      </div>
    </main>
  );
}
