"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Copy,
  Share2,
} from "lucide-react";

export function MarketingModuleView() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold font-display text-fg">
            Atribución Meta CAPI & Webhooks de Automatización (n8n / Make)
          </h3>
          <p className="text-xs text-foreground/80 font-medium mt-0.5">
            Sincroniza eventos de conversión en tiempo real de WhatsApp con Facebook Ads y conecta flujos avanzados sin código.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card Webhook n8n / Make */}
          <div className="p-4 bg-panel2 border border-line rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <b className="text-xs font-bold text-fg flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-accent" /> Webhook para n8n / Make
              </b>
              <span className="text-[10px] text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full">
                POST Activo
              </span>
            </div>
            <p className="text-xs text-foreground/80 font-medium">
              El CRM emite un payload cada vez que un lead avanza de etapa o se califica.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://crm.dominio.com/api/webhooks/marketing/outgoing"
                className="flex-1 bg-panel border border-line rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-foreground/80 select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://crm.dominio.com/api/webhooks/marketing/outgoing");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="p-2 bg-panel border border-line rounded-lg hover:border-accent text-fg"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Card UTMs y Referencias */}
          <div className="p-4 bg-panel2 border border-line rounded-xl space-y-3">
            <b className="text-xs font-bold text-fg flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-accent" /> Parámetros UTM & Anuncios Meta
            </b>
            <p className="text-xs text-foreground/80 font-medium">
              Captura automática de <code>ctwa_clid</code>, <code>utm_source</code>, <code>utm_campaign</code> y <code>utm_adset</code> al iniciar chat por WhatsApp.
            </p>
            <div className="p-2.5 bg-panel border border-line rounded-lg text-[11px] font-mono text-accent">
              ✓ Meta Conversions API (CAPI) deduplicada por contact.id y wa_identity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
