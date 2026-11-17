"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Lock,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  };
}

interface EmbeddedCheckoutModalProps {
  plan: PlanItem;
  initialInterval?: "monthly" | "yearly";
  isOpen: boolean;
  onClose: () => void;
}

export function EmbeddedCheckoutModal({
  plan,
  initialInterval = "monthly",
  isOpen,
  onClose,
}: EmbeddedCheckoutModalProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">(initialInterval);
  const [provider, setProvider] = useState<"stripe" | "paypal">("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isYearly = interval === "yearly";
  const monthlyPrice = plan.priceMonthlyUsd;
  const yearlyPrice = plan.priceYearlyUsd;
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
  const yearlySavings = monthlyPrice * 12 - yearlyPrice;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        provider === "stripe"
          ? "/api/billing/checkout/stripe"
          : "/api/billing/checkout/paypal";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingInterval: interval,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el checkout");

      const redirectUrl = provider === "stripe" ? data.url : data.approveUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error procesando el pago");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-[#243C4A] bg-[#101C24] text-white p-6 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00C4C0]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Suscripción al Plan {plan.name}</h2>
              <Badge variant="outline" className="text-xs border-[#00C4C0]/40 text-[#00C4C0]">
                {plan.tier.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#8BA4AE] mt-1">{plan.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8BA4AE] hover:text-white hover:bg-[#1A2E39] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Interval Selector */}
        <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-[#0B151B] border border-[#243C4A]/60">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
              !isYearly
                ? "bg-[#1A2E39] text-[#00C4C0] shadow-sm"
                : "text-[#8BA4AE] hover:text-white"
            }`}
          >
            Facturación Mensual (${monthlyPrice} USD)
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              isYearly
                ? "bg-[#1A2E39] text-[#00C4C0] shadow-sm"
                : "text-[#8BA4AE] hover:text-white"
            }`}
          >
            Facturación Anual
            <span className="text-[10px] bg-[#00C4C0]/20 text-[#00C4C0] px-1.5 py-0.2 rounded-full border border-[#00C4C0]/30 font-bold">
              -17%
            </span>
          </button>
        </div>

        {/* Payment Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#8BA4AE] uppercase tracking-wider">
            Método de Pago Seguro
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("stripe")}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition ${
                provider === "stripe"
                  ? "border-[#00C4C0] bg-[#00C4C0]/10 text-white"
                  : "border-[#243C4A] bg-[#0B151B] text-[#8BA4AE] hover:border-[#35586C]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <CreditCard className={`h-5 w-5 ${provider === "stripe" ? "text-[#00C4C0]" : ""}`} />
                {provider === "stripe" && <CheckCircle2 className="h-4 w-4 text-[#00C4C0]" />}
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-white">Tarjeta de Crédito / Débito</div>
                <div className="text-[11px] text-[#8BA4AE]">Visa, Mastercard, AMEX</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider("paypal")}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition ${
                provider === "paypal"
                  ? "border-[#00C4C0] bg-[#00C4C0]/10 text-white"
                  : "border-[#243C4A] bg-[#0B151B] text-[#8BA4AE] hover:border-[#35586C]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold italic text-blue-400">PayPal</span>
                {provider === "paypal" && <CheckCircle2 className="h-4 w-4 text-[#00C4C0]" />}
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-white">Cuenta PayPal</div>
                <div className="text-[11px] text-[#8BA4AE]">Pago seguro con 1 clic</div>
              </div>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-xl bg-[#0B151B] border border-[#243C4A]/60 space-y-2 text-xs">
          <div className="flex justify-between text-[#8BA4AE]">
            <span>Subtotal Plan {plan.name} ({isYearly ? "1 año" : "1 mes"})</span>
            <span className="text-white font-medium">${currentPrice} USD</span>
          </div>
          {isYearly && yearlySavings > 0 && (
            <div className="flex justify-between text-[#00C4C0]">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Descuento Anual (2 meses gratis)
              </span>
              <span>-${yearlySavings} USD</span>
            </div>
          )}
          <div className="border-t border-[#243C4A]/60 pt-2 flex justify-between text-sm font-bold text-white">
            <span>Total a pagar hoy</span>
            <span className="text-[#00C4C0] text-base">${currentPrice} USD</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-11 bg-[#00C4C0] hover:bg-[#00B0AC] text-[#0A141A] font-bold text-sm shadow-lg shadow-[#00C4C0]/20 transition"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando Pasarela Segura…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Pagar ${currentPrice} USD ({provider.toUpperCase()})
              </>
            )}
          </Button>

          <p className="text-[11px] text-center text-[#8BA4AE] flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-[#00C4C0]" /> Cifrado SSL de 256 bits · Cancela en cualquier momento sin penalización
          </p>
        </div>
      </div>
    </div>
  );
}
