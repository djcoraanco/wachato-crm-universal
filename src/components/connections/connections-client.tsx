"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Template = {
  name: string;
  category: string;
  status: "approved" | "pending" | "rejected";
};

type CapiLogEntry = {
  id: string;
  timestamp: string;
  event: string;
  contactName: string;
  channel: "wa" | "ig" | "fb" | "tt";
  value: number;
  status: "received" | "failed";
};

export function ConnectionsClient() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([
    { name: "recordatorio_cita_v1", category: "Utilidad", status: "approved" },
    { name: "confirmacion_reserva", category: "Utilidad", status: "approved" },
    { name: "promocion_temporada", category: "Marketing", status: "approved" },
    { name: "seguimiento_post_visita", category: "Marketing", status: "approved" },
    { name: "codigo_verificacion", category: "Autenticación", status: "approved" },
  ]);

  const [capiLog] = useState<CapiLogEntry[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      event: "Schedule",
      contactName: "Dra. Carolina Méndez",
      channel: "wa",
      value: 3500,
      status: "received",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      event: "Lead",
      contactName: "Lic. Manuel Ortiz",
      channel: "ig",
      value: 1200,
      status: "received",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      event: "Contact",
      contactName: "Valeria Castillo",
      channel: "wa",
      value: 800,
      status: "received",
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      event: "Purchase",
      contactName: "Ing. Roberto Peña",
      channel: "fb",
      value: 9500,
      status: "received",
    },
  ]);

  useEffect(() => {
    // Carga de plantillas reales si están disponibles en la API
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { templates?: Array<{ name: string; category: string; status: string }> } | null) => {
        if (data?.templates && data.templates.length > 0) {
          setTemplates(
            data.templates.map((t) => ({
              name: t.name,
              category: t.category,
              status: (t.status === "approved" || t.status === "rejected" ? t.status : "pending"),
            }))
          );
        }
      })
      .catch(() => null);
  }, []);

  async function refrescarConexiones() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
  }

  const channelsList = [
    {
      key: "wa",
      name: "WhatsApp Business (API oficial)",
      identifier: "+1 809-555-0142",
      status: "Conectado",
      detail: "Calidad del número: Alta · Límite: 1,000 contactos nuevos/24 h",
      badgeColor: "bg-[#25D366]/15 text-[#25D366]",
    },
    {
      key: "ig",
      name: "Instagram",
      identifier: "@wachato.crm",
      status: "Conectado",
      detail: "DMs, comentarios y respuestas a historias",
      badgeColor: "bg-[#EA4F86]/15 text-[#EA4F86]",
    },
    {
      key: "fb",
      name: "Facebook Messenger",
      identifier: "Página Oficial Wachato",
      status: "Conectado",
      detail: "Mensajes de la página y de anuncios de Meta",
      badgeColor: "bg-[#5B97F7]/15 text-[#5B97F7]",
    },
    {
      key: "cal",
      name: "Google Calendar",
      identifier: "contacto@wachato.com",
      status: "Conectado",
      detail: "La IA sincroniza y solo ofrece horas libres del calendario",
      badgeColor: "bg-accent/15 text-accent",
    },
  ];

  const metaRequirements = [
    { name: "Verificación del negocio en Meta", status: "Completada", ok: true },
    { name: "Revisión de permisos de la app", status: "En revisión", warn: true },
    { name: "Alta como Tech Provider", status: "Pendiente", warn: true },
    { name: "Política de privacidad publicada", status: "Completada", ok: true },
    { name: "Opt-in del cliente para marketing", status: "Se registra en cada contacto", ok: true },
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
            Conexiones y Meta
          </h1>
          <p className="text-sm text-muted">
            Monitoreo en tiempo real de WhatsApp Cloud API, Instagram, Messenger, Google Calendar y Conversions API.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void refrescarConexiones()}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar estado
        </Button>
      </div>

      {/* Grid de Canales Conectados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channelsList.map((ch) => (
          <div
            key={ch.key}
            className="flex flex-col justify-between rounded-xl border border-line bg-panel p-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("rounded px-2 py-0.5 text-xs font-bold", ch.badgeColor)}>
                  {ch.key.toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {ch.status}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-fg">{ch.name}</h3>
              <p className="font-mono text-xs text-fg/90">{ch.identifier}</p>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{ch.detail}</p>
          </div>
        ))}
      </div>

      {/* Grid de 2 columnas: Requisitos de Meta y Plantillas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Requisitos de Meta */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-panel p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 pb-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-bold text-fg">Requisitos de Meta</h2>
            </div>
            <div className="divide-y divide-line">
              {metaRequirements.map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-fg/90">{r.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      r.ok
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    )}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-panel2 p-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Ventana de 24 h:</span> Wachato bloquea los
            mensajes de texto libre fuera de la ventana de 24 horas y ofrece automáticamente solo
            plantillas aprobadas para evitar sanciones de Meta.
          </div>
        </div>

        {/* Plantillas de WhatsApp */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-panel p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                <h2 className="font-display text-lg font-bold text-fg">Plantillas de WhatsApp</h2>
              </div>
              <span className="font-mono text-xs text-muted">{templates.length} registradas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-2 font-semibold">Nombre</th>
                    <th className="pb-2 font-semibold">Categoría</th>
                    <th className="pb-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {templates.map((t) => (
                    <tr key={t.name} className="hover:bg-panel2/50">
                      <td className="py-2 font-mono text-fg">{t.name}</td>
                      <td className="py-2 text-muted">{t.category}</td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                            t.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : t.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                          )}
                        >
                          {t.status === "approved"
                            ? "Aprobada"
                            : t.status === "rejected"
                            ? "Rechazada"
                            : "En revisión"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">
            Marketing y Utilidad tienen costo por mensaje según la tarifa oficial de Meta para la
            región.
          </p>
        </div>
      </div>

      {/* Log de Conversions API (CAPI) */}
      <div className="rounded-xl border border-line bg-panel p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-fg">Meta Conversions API (CAPI)</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Activa · Dataset ID: 8812 4407 3391
          </span>
        </div>
        <p className="text-xs text-muted">
          Eventos enviados en tiempo real a Meta. Mover un trato en el Pipeline Kanban o agendar una cita
          dispara automáticamente el evento correspondiente para optimizar tus campañas publicitarias.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="pb-2 font-semibold">Hora</th>
                <th className="pb-2 font-semibold">Evento</th>
                <th className="pb-2 font-semibold">Contacto</th>
                <th className="pb-2 font-semibold">Canal</th>
                <th className="pb-2 font-semibold">Valor</th>
                <th className="pb-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {capiLog.map((log) => (
                <tr key={log.id} className="hover:bg-panel2/50">
                  <td className="py-2.5 font-mono text-muted">
                    {new Date(log.timestamp).toLocaleTimeString("es-DO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 font-bold text-fg">{log.event}</td>
                  <td className="py-2.5 text-fg/90">{log.contactName}</td>
                  <td className="py-2.5">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        log.channel === "ig"
                          ? "bg-[#EA4F86]/15 text-[#EA4F86]"
                          : log.channel === "fb"
                          ? "bg-[#5B97F7]/15 text-[#5B97F7]"
                          : "bg-[#25D366]/15 text-[#25D366]"
                      )}
                    >
                      {log.channel.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono font-semibold text-fg">
                    RD$ {log.value.toLocaleString("es-DO")}
                  </td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400">
                      Recibido
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
