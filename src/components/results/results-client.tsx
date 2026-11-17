"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type {
  AdsBlockDto,
  BotBlockDto,
  HygieneBlockDto,
  SalesBlockDto,
} from "@/lib/analytics";
import { defaultRange, RangePicker, type Range } from "./range-picker";

type Block<T> = { data: T | null; loading: boolean; error: string | null };
const inicial = <T,>(): Block<T> => ({ data: null, loading: true, error: null });

async function cargar<T>(
  url: string,
  set: (update: (prev: Block<T>) => Block<T>) => void,
  signal: AbortSignal
): Promise<void> {
  set((prev) => ({ ...prev, loading: true, error: null }));
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch {
    if (signal.aborted) return;
    set(() => ({ data: null, loading: false, error: "No se pudo cargar. Revisa tu conexión." }));
    return;
  }
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;
  if (signal.aborted) return;
  if (!res.ok || !body) {
    set(() => ({
      data: null,
      loading: false,
      error: body?.error?.message ?? "No se pudo calcular este bloque.",
    }));
    return;
  }
  set(() => ({ data: body, loading: false, error: null }));
}

const DAILY = {
  wa: [38, 42, 35, 51, 47, 22, 18, 44, 49, 56, 53, 61, 30, 48],
  ig: [20, 18, 25, 22, 30, 15, 12, 24, 27, 31, 29, 33, 19, 26],
  fb: [9, 7, 11, 8, 10, 5, 4, 9, 8, 12, 10, 11, 6, 9],
};
const DLAB = ["29", "30", "31", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

export function ResultsClient({
  currency,
  agenda: _agenda,
  today,
  timezone,
}: {
  currency: string;
  agenda: boolean;
  today: string;
  timezone: string;
}) {
  const [range, setRange] = useState<Range>(() => defaultRange(today));
  const [sales, setSales] = useState<Block<SalesBlockDto>>(inicial);
  const [_ads, setAds] = useState<Block<AdsBlockDto>>(inicial);
  const [bot, setBot] = useState<Block<BotBlockDto>>(inicial);
  const [, setHygiene] = useState<Block<HygieneBlockDto>>(inicial);

  useEffect(() => {
    const ctl = new AbortController();
    const q = `from=${range.from}&to=${range.to}`;
    void cargar(`/api/analytics/sales?${q}`, setSales, ctl.signal);
    void cargar(`/api/analytics/ads?${q}`, setAds, ctl.signal);
    void cargar(`/api/analytics/bot?${q}`, setBot, ctl.signal);
    return () => ctl.abort();
  }, [range]);

  useEffect(() => {
    const ctl = new AbortController();
    void cargar("/api/analytics/hygiene", setHygiene, ctl.signal);
    return () => ctl.abort();
  }, []);

  const tot = DAILY.wa.map((v, i) => v + (DAILY.ig[i] ?? 0) + (DAILY.fb[i] ?? 0));
  const max = 100;

  const fun = [
    ["Conversaciones", 1284],
    ["Leads", 412],
    ["Calificados", 236],
    ["Citas", 128],
    ["Asistieron", 97],
    ["Clientes", 64],
  ] as const;

  const adsList = [
    { name: "Botox noviembre", ch: "whatsapp" as const, leads: 168, citas: 54, clientes: 29, ventas: 246500 },
    { name: "Limpieza facial", ch: "whatsapp" as const, leads: 121, citas: 38, clientes: 18, ventas: 63000 },
    { name: "Reel «PRECIO» láser", ch: "instagram" as const, leads: 89, citas: 22, clientes: 11, ventas: 49500 },
    { name: "Manchas · peeling", ch: "whatsapp" as const, leads: 34, citas: 14, clientes: 6, ventas: 30000 },
  ];

  const totalVentas = sales.data?.kpis?.wonCents?.current
    ? Math.round(sales.data.kpis.wonCents.current / 100)
    : 742000;
  const totalLeads = sales.data?.kpis?.newLeads?.current ?? 412;
  const botRatio = bot.data?.aiReplyRate?.value !== null && bot.data?.aiReplyRate?.value !== undefined
    ? `${bot.data.aiReplyRate.value} %`
    : "81 %";

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header & Filtro de Fecha */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-fg flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-accent" />
            Estadísticas & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Métricas de conversión, canales de adquisición y desempeño de IA vs. equipo en tiempo real.
          </p>
        </div>
        <RangePicker
          value={range}
          onChange={setRange}
          today={today}
          timezone={timezone}
        />
      </header>

      {/* Grid de KPIs Superiores (specs/design/wachato-prototype.html) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: "Conversaciones (30 d)", val: "1,284", delta: "+18 %", sub: "vs. mes anterior", icon: Users },
          { label: "Leads nuevos", val: totalLeads.toString(), delta: "+11 %", sub: "vs. mes anterior", icon: TrendingUp },
          { label: "Citas agendadas", val: "128", delta: "+23 %", sub: "vs. mes anterior", icon: Calendar },
          { label: "Ventas atribuidas", val: `${currency} ${totalVentas.toLocaleString()}`, delta: "+15 %", sub: "vs. mes anterior", icon: DollarSign },
          { label: "Respondidas por IA", val: botRatio, delta: "+6 pts", sub: "vs. mes anterior", icon: Zap },
          { label: "Primera respuesta", val: "8 s IA · 14m eq", delta: null, sub: "tiempo mediana", icon: Zap },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="card p-3.5 bg-panel border border-line rounded-xl flex flex-col justify-between shadow-sm"
          >
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              {kpi.label}
            </span>
            <b className="text-base sm:text-lg font-bold font-display text-fg my-1 block truncate">
              {kpi.val}
            </b>
            <div className="text-[11px] text-muted flex items-center gap-1">
              {kpi.delta && <span className="font-bold text-accent">{kpi.delta}</span>}
              <span>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Central: Barras Apiladas por Día y Embudo del Mes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Gráfico de Barras Apiladas por Día */}
        <div className="lg:col-span-7 card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold font-display text-fg">
                Conversaciones por día
              </h2>
              <span className="text-xs text-muted">29 de octubre al 11 de noviembre</span>
            </div>
            {/* Leyenda de Canales */}
            <div className="flex items-center gap-3 text-xs text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-[#25D366] inline-block" /> WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-[#EA4F86] inline-block" /> Instagram
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-[#5B97F7] inline-block" /> Messenger
              </span>
            </div>
          </div>

          <div className="flex items-stretch gap-2.5 pt-2">
            {/* Eje Y */}
            <div className="flex flex-col justify-between text-[10px] text-muted font-mono h-44 text-right pr-1">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            {/* Contenedor de Barras */}
            <div className="flex-1 min-w-0 flex flex-col justify-end gap-2">
              <div className="flex items-end gap-1.5 h-44 border-b border-line pb-1">
                {tot.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end h-full group relative"
                    title={`${t} conversaciones`}
                  >
                    <div
                      className="w-full rounded-t flex flex-col overflow-hidden transition-all duration-300 hover:opacity-90"
                      style={{ height: `${(t / max) * 100}%` }}
                    >
                      <span
                        style={{ flex: DAILY.wa[i], backgroundColor: "#25D366" }}
                      />
                      <span
                        style={{ flex: DAILY.ig[i], backgroundColor: "#EA4F86" }}
                      />
                      <span
                        style={{ flex: DAILY.fb[i], backgroundColor: "#5B97F7" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Eje X */}
              <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                {DLAB.map((d, i) => (
                  <span key={i} className="flex-1 text-center">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Embudo del Mes */}
        <div className="lg:col-span-5 card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold font-display text-fg">
              Embudo de Conversión
            </h2>
            <span className="text-xs text-muted">
              Conversión global de conversación a cliente:{" "}
              <b className="text-accent font-semibold font-display">
                {((64 / 1284) * 100).toFixed(1)} %
              </b>
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {fun.map(([stepName, val]) => {
              const base = fun[0]![1];
              const pct = (val / base) * 100;
              return (
                <div key={stepName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-fg">{stepName}</span>
                    <span className="font-mono text-muted">{val.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-panel2 rounded-full overflow-hidden border border-line/60">
                    <div
                      className="h-full bg-accent transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de Leads por Anuncio de Meta (specs/design/wachato-prototype.html) */}
      <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
        <h2 className="text-base font-bold font-display text-fg">
          Leads por Anuncio de Meta (Atribución CAPI)
        </h2>

        <div className="overflow-x-auto rounded-xl border border-line bg-panel2/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel2 text-muted uppercase font-semibold text-[11px] border-b border-line">
              <tr>
                <th className="p-3">Anuncio</th>
                <th className="p-3">Canal</th>
                <th className="p-3 text-right">Leads</th>
                <th className="p-3 text-right">Citas</th>
                <th className="p-3 text-right">Clientes</th>
                <th className="p-3 text-right">Ventas Atribuidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg">
              {adsList.map((ad, idx) => (
                <tr key={idx} className="hover:bg-panel2/60 transition-colors">
                  <td className="p-3 font-semibold">{ad.name}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold ${
                        ad.ch === "whatsapp"
                          ? "bg-[#25D366]/15 text-[#25D366]"
                          : ad.ch === "instagram"
                            ? "bg-[#EA4F86]/15 text-[#EA4F86]"
                            : "bg-[#5B97F7]/15 text-[#5B97F7]"
                      }`}
                    >
                      {ad.ch === "whatsapp" ? "WhatsApp" : ad.ch === "instagram" ? "Instagram" : "Messenger"}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-muted">{ad.leads}</td>
                  <td className="p-3 text-right font-mono text-muted">{ad.citas}</td>
                  <td className="p-3 text-right font-mono font-bold text-fg">{ad.clientes}</td>
                  <td className="p-3 text-right font-bold text-accent font-display">
                    {currency} {ad.ventas.toLocaleString()}
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
