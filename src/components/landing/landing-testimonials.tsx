"use client";

import { Star, Quote } from "lucide-react";
import type { LandingTestimonialItem } from "@/lib/billing/types";

interface LandingTestimonialsProps {
  testimonials: LandingTestimonialItem[];
  primaryColor?: string;
}

export function LandingTestimonials({
  testimonials,
  primaryColor = "#00C4C0",
}: LandingTestimonialsProps) {
  return (
    <section id="testimonials" className="py-20 border-t border-slate-900 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 mb-4">
            Casos de Éxito Reales
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Empresas que escalan sus ingresos cada mes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Descubre cómo dueños de negocios, directores comerciales y agencias multiplican su
            conversión con Wachato CRM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-slate-700/60 absolute -top-3 -left-2 pointer-events-none" />
                  <p className="text-sm text-slate-300 relative z-10 leading-relaxed italic pt-2">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author info */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #00a8a5)`,
                  }}
                >
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-slate-400">
                    {t.role} {t.company ? `• ${t.company}` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
