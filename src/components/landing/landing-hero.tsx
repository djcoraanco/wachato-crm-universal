"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { LandingHeroConfig } from "@/lib/billing/types";

interface LandingHeroProps {
  hero: LandingHeroConfig;
  primaryColor?: string;
  accentColor?: string;
}

export function LandingHero({
  hero,
  primaryColor = "#00C4C0",
  accentColor = "#00E5E0",
}: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] blur-[140px] pointer-events-none opacity-25 rounded-full"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Badge */}
        {hero.badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs sm:text-sm font-medium mb-6 shadow-sm backdrop-blur-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{hero.badge}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          {hero.title}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          {hero.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={hero.ctaLink || "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-slate-950 text-base transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/25"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            }}
          >
            {hero.ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>

          {hero.secondaryCtaText && (
            <a
              href={hero.secondaryCtaLink || "#pricing"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white transition-all text-base backdrop-blur-sm"
            >
              {hero.secondaryCtaText}
            </a>
          )}
        </div>

        {/* Value props checklist */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Cloud API Oficial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Prueba Gratis sin tarjeta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Setup en 5 minutos</span>
          </div>
        </div>

        {/* App Preview Mockup */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-cyan-950/50 p-2 sm:p-4 backdrop-blur-sm relative group">
          {/* Window Header */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-500 hidden sm:inline">
                https://app.wachato.com/inbox
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Meta API Online
              </span>
            </div>
          </div>

          {/* Simulated App Dashboard */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
            {/* Sidebar nav mini */}
            <div className="hidden md:block md:col-span-3 rounded-xl bg-slate-900/60 border border-slate-800/60 p-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] px-2 py-1">
                Conversaciones
              </div>
              <div className="rounded-lg bg-cyan-950/50 border border-cyan-800/50 p-2 text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-medium">Carlos R. (Clínica)</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">1m</span>
              </div>
              <div className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Dra. Elena Gómez</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">12m</span>
              </div>
              <div className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Martín V. (Pedido)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">1h</span>
              </div>
            </div>

            {/* Simulated Live Chat */}
            <div className="md:col-span-6 rounded-xl bg-slate-900/40 border border-slate-800/60 p-4 flex flex-col justify-between min-h-[260px]">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    CR
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-slate-800/90 text-slate-200 px-3.5 py-2 text-xs max-w-[85%] border border-slate-700/60 shadow-sm">
                    Hola! Quisiera agendar una consulta médica para este jueves en la tarde por favor.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-cyan-950 border border-cyan-700/60 text-cyan-100 px-3.5 py-2 text-xs max-w-[85%] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-semibold mb-1">
                      <Bot className="w-3 h-3" />
                      <span>Agente de IA</span>
                    </div>
                    ¡Hola Carlos! Con gusto. Para el jueves tenemos disponibilidad a las 3:30 PM o a las 5:00 PM con la Dra. Sofía. ¿Cuál horario prefieres para confirmar tu reserva?
                  </div>
                  <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-slate-950 shrink-0">
                    IA
                  </div>
                </div>
              </div>

              {/* Chat action bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] text-cyan-300">Cita pre-bloqueada en Google Calendar</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  Etapa: Calificado
                </span>
              </div>
            </div>

            {/* Pipeline Stage & Floating KPIs */}
            <div className="hidden md:flex md:col-span-3 flex-col justify-between rounded-xl bg-slate-900/60 border border-slate-800/60 p-3 space-y-3 text-xs">
              <div className="space-y-2">
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Embudo de Ventas
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Total en Pipeline</div>
                  <div className="text-base font-bold text-white mt-0.5">$18,450 USD</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    <span>+24% vs mes anterior</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Meta CAPI Atribución</div>
                  <div className="text-sm font-semibold text-cyan-300 mt-0.5">94.2% Match Rate</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Despacho ultrarrápido &lt; 800ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
