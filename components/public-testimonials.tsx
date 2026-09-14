"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./testimonials.module.css";

type Testimonial = { user_name: string; rating: number; message: string; created_at: string };
type Summary = { total: number; average: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number>; reviews: Testimonial[] };

function Stars({ rating, muted = false }: { rating: number; muted?: boolean }) {
  return <span className={muted ? styles.mutedStars : styles.stars} aria-label={rating + " de 5 estrelas"}>
    {Array.from({ length: 5 }, (_, star) => <Star key={star} size={17} fill={star < rating ? "currentColor" : "none"} aria-hidden="true" />)}
  </span>;
}

export function PublicTestimonials() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.rpc("get_public_orcamovel_feedback_summary").then(({ data }) => {
      if (data && typeof data === "object") setSummary(data as Summary);
    });
  }, []);

  if (!summary?.total) return null;

  return (
    <section className={styles.section} aria-labelledby="avaliacoes-title">
      <div className={styles.container}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>AVALIAÇÕES DE QUEM JÁ USA</p>
            <h2 id="avaliacoes-title">Experiências reais com o OrçaMóvel.</h2>
            <p>Opiniões compartilhadas por marceneiros que usam o aplicativo na rotina.</p>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.summary} aria-label="Resumo das avaliações">
            <p className={styles.summaryLabel}>Avaliação geral</p>
            <div className={styles.score}><strong>{Number(summary.average).toFixed(1).replace(".", ",")}</strong><span>/ 5</span></div>
            <Stars rating={Math.round(summary.average)} />
            <p className={styles.total}>{summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}</p>
            <div className={styles.bars} aria-label="Distribuição de notas">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = summary.distribution[String(rating) as keyof Summary["distribution"]] || 0;
                const percentage = Math.round((count / summary.total) * 100);
                return <div className={styles.barRow} key={rating}>
                  <span>{rating}</span><Star size={13} fill="currentColor" aria-hidden="true" />
                  <div className={styles.track}><span style={{ width: percentage + "%" }} /></div>
                  <b>{count}</b>
                </div>;
              })}
            </div>
          </aside>

          <div className={styles.reviews}>
            <div className={styles.reviewTop}><h3>O que dizem sobre o OrçaMóvel</h3><span>{summary.total} opiniões verificadas</span></div>
            <div className={styles.reviewList}>
              {summary.reviews.map((testimonial, index) => (
                <article className={styles.review} key={testimonial.created_at + "-" + index}>
                  <div className={styles.reviewMeta}><strong>{testimonial.user_name}</strong><Stars rating={testimonial.rating} muted /></div>
                  <p>“{testimonial.message}”</p>
                  <time dateTime={testimonial.created_at}>{new Date(testimonial.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</time>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
