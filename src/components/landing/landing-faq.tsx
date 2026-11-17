"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LandingFaqItem } from "@/lib/billing/types";

interface LandingFaqProps {
  faq: LandingFaqItem[];
  primaryColor?: string;
}

export function LandingFaq({ faq, primaryColor: _primaryColor = "#00C4C0" }: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 border-t border-slate-900 bg-slate-950/60 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 mb-4">
            Resolviendo Dudas
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Todo lo que necesitas saber antes de empezar a usar Wachato CRM.
          </p>
        </div>

        <div className="space-y-4">
          {faq.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-cyan-500/50 bg-slate-900/80 shadow-md shadow-cyan-950/30"
                    : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-white text-base focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className={isOpen ? "text-cyan-300" : "text-white"}>
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact direct link */}
        <div className="mt-12 text-center p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
          <p className="text-sm text-slate-400">
            ¿Tienes alguna pregunta adicional que no esté aquí?{" "}
            <a
              href="mailto:soporte@wachato.com"
              className="font-semibold text-cyan-400 hover:underline"
            >
              Escríbenos a soporte@wachato.com
            </a>{" "}
            y te responderemos de inmediato.
          </p>
        </div>
      </div>
    </section>
  );
}
