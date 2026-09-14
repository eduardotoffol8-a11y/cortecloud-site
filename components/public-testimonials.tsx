"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./testimonials.module.css";

type Testimonial = {
  user_name: string;
  rating: number;
  message: string;
  created_at: string;
};

export function PublicTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase
      .rpc("get_public_orcamovel_feedback")
      .then(({ data }) => setTestimonials((data || []) as Testimonial[]));
  }, []);

  if (!testimonials.length) return null;

  return (
    <section className={styles.section} aria-labelledby="avaliacoes-title">
      <div className={styles.container}>
        <p className={styles.eyebrow}>AVALIAÇÕES DE QUEM JÁ USA</p>
        <h2 id="avaliacoes-title">Experiências reais com o OrçaMóvel.</h2>
        <div className={styles.grid}>
          {testimonials.map((testimonial, index) => (
            <article className={styles.card} key={`${testimonial.created_at}-${index}`}>
              <div className={styles.stars} aria-label={`${testimonial.rating} de 5 estrelas`}>
                {Array.from({ length: testimonial.rating }, (_, star) => <Star key={star} size={16} fill="currentColor" aria-hidden="true" />)}
              </div>
              <p className={styles.message}>“{testimonial.message}”</p>
              <p className={styles.author}>{testimonial.user_name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
