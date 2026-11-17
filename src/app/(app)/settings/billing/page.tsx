"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  slug: string;
  tier: string;
  description: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  limits: {
    maxContacts: number;
    maxTeamMembers: number;
    maxChannels: number;
    maxMonthlyAiTokens: number;
    maxPipelines: number;
    allowWhitelabel: boolean;
    allowCustomDomain: boolean;
    allowVoiceNotesTranscription: boolean;
  };
}

interface QuotaMetric {
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface QuotaSummary {
  plan: { id: string; name: string; slug: string; tier: string } | null;
  periodMonth: string;
  quotas: {
    contacts: QuotaMetric;
    teamMembers: QuotaMetric;
    channels: QuotaMetric;
    aiTokens: QuotaMetric;
  };
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [usage, setUsage] = useState<QuotaSummary | null>(null);
  const [_providers, setProviders] = useState<{ stripe: boolean; paypal: boolean }>({
    stripe: false,
    paypal: false,
  });
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/plans").then((r) => r.json()),
      fetch("/api/billing/usage").then((r) => r.json()).catch(() => null),
    ])
      .then(([plansData, usageData]) => {
        if (plansData?.plans) setPlans(plansData.plans);
        if (plansData?.providers) setProviders(plansData.providers);
        if (usageData?.summary) setUsage(usageData.summary);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error cargando planes"))
      .finally(() => setLoading(false));
  }, []);

  const handleStripeCheckout = async (planSlug: string) => {
    setActionLoading(`stripe_${planSlug}`);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          billingInterval: isYearly ? "yearly" : "monthly",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar Stripe");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar Stripe");
      setActionLoading(null);
    }
  };

  const handlePayPalCheckout = async (planSlug: string) => {
    setActionLoading(`paypal_${planSlug}`);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          billingInterval: isYearly ? "yearly" : "monthly",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar PayPal");
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar PayPal");
      setActionLoading(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setActionLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al abrir portal de facturación");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al abrir portal de facturación");
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 text-[#E6F0F2]">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#243C4A] pb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-[#00C4C0]" />
            Facturación y Suscripción
          </h1>
          <p className="text-sm text-[#8BA4AE] mt-1">
            Gestiona tu plan activo, cuotas de uso y métodos de pago automatizados.
          </p>
        </div>

        <button
          onClick={handleOpenCustomerPortal}
          disabled={actionLoading === "portal"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#13222B] hover:bg-[#1A2E39] border border-[#243C4A] text-sm font-medium transition"
        >
          {actionLoading === "portal" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#00C4C0]" />
          ) : (
            <ExternalLink className="w-4 h-4 text-[#00C4C0]" />
          )}
          Gestionar Tarjetas y Facturas
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Métricas de Uso y Cuotas en Tiempo Real */}
      {usage && (
        <div className="rounded-2xl border border-[#243C4A] bg-[#13222B]/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243C4A]/60 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00C4C0]">
                Uso en Tiempo Real
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Plan Actual:{" "}
                <span className="text-[#00C4C0]">
                  {usage.plan?.name ?? "Starter"}
                </span>{" "}
                <span className="text-xs text-[#8BA4AE] font-normal">
                  (Ciclo {usage.periodMonth})
                </span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Contactos */}
            <div className="rounded-xl border border-[#243C4A]/50 bg-[#0D1920]/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8BA4AE] font-medium">Contactos</span>
                <span className="font-bold text-white">
                  {usage.quotas.contacts.current.toLocaleString()} /{" "}
                  {usage.quotas.contacts.limit === -1
                    ? "∞"
                    : usage.quotas.contacts.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A2E39] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usage.quotas.contacts.percentage}%`,
                    backgroundColor:
                      usage.quotas.contacts.percentage >= 90
                        ? "#EF4444"
                        : usage.quotas.contacts.percentage >= 70
                        ? "#F59E0B"
                        : "#00C4C0",
                  }}
                />
              </div>
              <div className="text-[11px] text-[#8BA4AE]">
                {usage.quotas.contacts.percentage}% utilizado
              </div>
            </div>

            {/* Tokens IA */}
            <div className="rounded-xl border border-[#243C4A]/50 bg-[#0D1920]/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8BA4AE] font-medium">Tokens IA / mes</span>
                <span className="font-bold text-white">
                  {Math.round(usage.quotas.aiTokens.current / 1000)}k /{" "}
                  {usage.quotas.aiTokens.limit === -1
                    ? "∞"
                    : `${Math.round(usage.quotas.aiTokens.limit / 1000)}k`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A2E39] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usage.quotas.aiTokens.percentage}%`,
                    backgroundColor:
                      usage.quotas.aiTokens.percentage >= 90
                        ? "#EF4444"
                        : usage.quotas.aiTokens.percentage >= 70
                        ? "#F59E0B"
                        : "#00C4C0",
                  }}
                />
              </div>
              <div className="text-[11px] text-[#8BA4AE]">
                {usage.quotas.aiTokens.percentage}% utilizado
              </div>
            </div>

            {/* Canales */}
            <div className="rounded-xl border border-[#243C4A]/50 bg-[#0D1920]/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8BA4AE] font-medium">Canales Conectados</span>
                <span className="font-bold text-white">
                  {usage.quotas.channels.current} /{" "}
                  {usage.quotas.channels.limit === -1
                    ? "∞"
                    : usage.quotas.channels.limit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A2E39] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00C4C0] transition-all duration-500"
                  style={{ width: `${usage.quotas.channels.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8BA4AE]">
                {usage.quotas.channels.limit === 1
                  ? "Solo WhatsApp Oficial"
                  : "Omnicanal Activo"}
              </div>
            </div>

            {/* Agentes de Equipo */}
            <div className="rounded-xl border border-[#243C4A]/50 bg-[#0D1920]/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8BA4AE] font-medium">Agentes de Equipo</span>
                <span className="font-bold text-white">
                  {usage.quotas.teamMembers.current} /{" "}
                  {usage.quotas.teamMembers.limit === -1
                    ? "∞"
                    : usage.quotas.teamMembers.limit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A2E39] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00C4C0] transition-all duration-500"
                  style={{ width: `${usage.quotas.teamMembers.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8BA4AE]">
                {usage.quotas.teamMembers.limit === -1
                  ? "Ilimitados"
                  : `${usage.quotas.teamMembers.remaining} asientos restantes`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector Mensual / Anual */}
      <div className="flex justify-center items-center gap-4 pt-2">
        <span
          className={`text-sm font-medium cursor-pointer ${
            !isYearly ? "text-white" : "text-[#8BA4AE]"
          }`}
          onClick={() => setIsYearly(false)}
        >
          Facturación Mensual
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          label="Facturación Anual con 2 meses gratis"
        />
        <span
          className={`text-sm font-medium cursor-pointer flex items-center gap-1.5 ${
            isYearly ? "text-white" : "text-[#8BA4AE]"
          }`}
          onClick={() => setIsYearly(true)}
        >
          Facturación Anual
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00C4C0]/20 text-[#00C4C0] border border-[#00C4C0]/40">
            2 meses gratis
          </span>
        </span>
      </div>

      {/* Rejilla de Planes */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#00C4C0]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map((p) => {
            const price = isYearly ? p.priceYearlyUsd : p.priceMonthlyUsd;
            const isAgency = p.tier === "agency";
            const isPro = p.tier === "pro";

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 bg-[#13222B] border transition-all duration-200 ${
                  isPro
                    ? "border-[#00C4C0] shadow-[0_0_24px_rgba(0,196,192,0.15)] ring-1 ring-[#00C4C0]"
                    : "border-[#243C4A] hover:border-[#38596B]"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00C4C0] text-[#0D1920] font-bold text-xs uppercase tracking-wider">
                    Más Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isAgency ? (
                      <Building2 className="w-5 h-5 text-[#00C4C0]" />
                    ) : (
                      <Zap className="w-5 h-5 text-[#00C4C0]" />
                    )}
                    <h2 className="text-lg font-bold font-display text-white">{p.name}</h2>
                  </div>

                  <p className="text-xs text-[#8BA4AE] min-h-[32px]">{p.description}</p>

                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-extrabold text-white">${price}</span>
                    <span className="text-xs text-[#8BA4AE] ml-1">
                      / {isYearly ? "año" : "mes"} USD
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#C5D8DF] border-t border-[#243C4A]/80 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                      <span>
                        {p.limits.maxContacts === -1
                          ? "Contactos ilimitados"
                          : `Hasta ${p.limits.maxContacts.toLocaleString()} contactos`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                      <span>
                        {p.limits.maxTeamMembers === -1
                          ? "Agentes ilimitados"
                          : `${p.limits.maxTeamMembers} miembros de equipo`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                      <span>
                        {p.limits.maxChannels === 1
                          ? "WhatsApp Cloud API oficial"
                          : "WhatsApp, Instagram, Messenger y TikTok"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                      <span>{(p.limits.maxMonthlyAiTokens / 1000).toLocaleString()}k tokens IA / mes</span>
                    </li>
                    {p.limits.allowVoiceNotesTranscription && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                        <span>Transcripción Whisper audios</span>
                      </li>
                    )}
                    {p.limits.allowWhitelabel && (
                      <li className="flex items-center gap-2 font-medium text-[#00C4C0]">
                        <CheckCircle2 className="w-4 h-4 text-[#00C4C0] shrink-0" />
                        <span>Marca Blanca y Subdominios</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t border-[#243C4A]/60">
                  {/* Botón Stripe */}
                  <button
                    onClick={() => handleStripeCheckout(p.slug)}
                    disabled={Boolean(actionLoading)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#00C4C0] hover:bg-[#00D9D4] text-[#0D1920] font-bold text-xs transition disabled:opacity-50"
                  >
                    {actionLoading === `stripe_${p.slug}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Pagar con Tarjeta (Stripe)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {/* Botón PayPal */}
                  <button
                    onClick={() => handlePayPalCheckout(p.slug)}
                    disabled={Boolean(actionLoading)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0079C1] hover:bg-[#0089DC] text-white font-semibold text-xs transition disabled:opacity-50"
                  >
                    {actionLoading === `paypal_${p.slug}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Suscribir con PayPal</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tarjeta de Seguridad y Garantía */}
      <div className="rounded-xl p-5 bg-[#13222B]/70 border border-[#243C4A] flex flex-col sm:flex-row items-center gap-4 text-xs text-[#8BA4AE]">
        <div className="p-3 rounded-xl bg-[#00C4C0]/10 text-[#00C4C0]">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-white font-semibold text-sm">Pasarelas 100% Automatizadas y Cifradas</h2>
          <p className="mt-0.5">
            Tus pagos son procesados directamente por Stripe o PayPal con cifrado TLS 1.3 de extremo a extremo. Puedes cancelar o actualizar tu suscripción en cualquier momento sin penalizaciones.
          </p>
        </div>
      </div>
    </div>
  );
}
