"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { LandingPricingConfig } from "@/lib/billing/types";
import { DEFAULT_PLANS } from "@/lib/billing/plans";

interface LandingPricingProps {
  pricing: LandingPricingConfig;
  primaryColor?: string;
  accentColor?: string;
}

export function LandingPricing({
  pricing,
  primaryColor = "#00C4C0",
  accentColor = "#00E5E0",
}: LandingPricingProps) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 border-t border-slate-900 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 mb-4">
            Precios Claros y Flexibles
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {pricing.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            {pricing.subheadline}
          </p>

          {/* Billing Interval Toggle usando Switch oficial */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-semibold transition-colors ${
                !isYearly ? "text-white" : "text-slate-400"
              }`}
            >
              Facturación Mensual
            </span>

            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              label="Alternar entre facturación mensual y anual con descuento"
            />

            <span
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isYearly ? "text-white" : "text-slate-400"
              }`}
            >
              Facturación Anual
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ahorra 2 meses ({pricing.yearlyDiscountPercent ?? 17}%)
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {DEFAULT_PLANS.map((plan) => {
            const isHighlighted =
              plan.slug === (pricing.highlightedPlanSlug ?? "pro");
            const price = isYearly
              ? Math.round(plan.priceYearlyUsd / 12 / 100)
              : Math.round(plan.priceMonthlyUsd / 100);

            return (
              <div
                key={plan.slug}
                className={`rounded-2xl flex flex-col justify-between p-6 transition-all duration-300 relative ${
                  isHighlighted
                    ? "border-2 border-cyan-400 bg-slate-900/90 shadow-xl shadow-cyan-950/60 scale-[1.02] z-10"
                    : "border border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                {/* Popular Badge */}
                {isHighlighted && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-slate-950 flex items-center gap-1 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MÁS POPULAR</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Description */}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-xs text-slate-400 min-h-[32px]">
                    {plan.description}
                  </p>

                  {/* Price display */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      USD / mes
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isYearly
                      ? `Facturado anualmente ($${plan.priceYearlyUsd / 100} USD/año)`
                      : "Facturación mensual recurrente"}
                  </div>

                  {/* Features list */}
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        Hasta{" "}
                        <strong className="text-white">
                          {plan.limits.maxContacts.toLocaleString()}
                        </strong>{" "}
                        contactos
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        {plan.limits.maxTeamMembers === -1 ? (
                          <strong className="text-white">Agentes ilimitados</strong>
                        ) : (
                          <>
                            Hasta{" "}
                            <strong className="text-white">
                              {plan.limits.maxTeamMembers}
                            </strong>{" "}
                            agentes
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        {plan.limits.maxChannels === 1 ? (
                          "1 Canal (WhatsApp Oficial)"
                        ) : (
                          <strong className="text-white">
                            4 Canales (WhatsApp, IG, FB, TT)
                          </strong>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong className="text-white">
                          {(plan.limits.maxMonthlyAiTokens / 1000).toLocaleString()}k
                        </strong>{" "}
                        tokens de IA / mes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        {plan.limits.includedModules.length === 1
                          ? "Módulo de Servicios"
                          : "8 Módulos de Industria incluidos"}
                      </span>
                    </div>

                    {plan.limits.allowVoiceNotesTranscription && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Transcripción Whisper de audios</span>
                      </div>
                    )}

                    {plan.limits.allowWhitelabel && (
                      <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Marca Blanca y Subdominio Propio</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan CTA Button */}
                <div className="mt-8">
                  <Link
                    href={`/register?plan=${plan.slug}&interval=${isYearly ? "yearly" : "monthly"}`}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-center text-sm transition-all block ${
                      isHighlighted
                        ? "text-slate-950 shadow-lg shadow-cyan-500/25 hover:opacity-95 active:scale-95"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                    }`}
                    style={
                      isHighlighted
                        ? {
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          }
                        : undefined
                    }
                  >
                    Comenzar con {plan.name.split(" ")[0]}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment guarantees */}
        <div className="mt-12 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6">
          <span>🔒 Pagos 100% seguros procesados con Stripe y PayPal</span>
          <span>⚡ Activación instantánea en menos de 60 segundos</span>
          <span>🔄 Cancela en cualquier momento sin penalizaciones</span>
        </div>
      </div>
    </section>
  );
}
