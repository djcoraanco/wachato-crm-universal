"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  GraduationCap,
  HeartPulse,
  Megaphone,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { InstalledModuleDto, ModuleCategory } from "@/lib/modules/types";

const CATEGORY_LABELS: Record<ModuleCategory | "all", string> = {
  all: "Todos los sectores",
  restaurantes: "Restaurantes",
  clinicas: "Clínicas y Salud",
  ecommerce: "E-commerce",
  inmobiliarias: "Inmobiliarias",
  marketing: "Marketing y Leads",
  servicios: "Servicios Profesionales",
  educacion: "Educación",
  logistica: "Logística",
};

const CATEGORY_ICONS: Record<ModuleCategory, typeof UtensilsCrossed> = {
  restaurantes: UtensilsCrossed,
  clinicas: HeartPulse,
  ecommerce: ShoppingBag,
  inmobiliarias: Building2,
  marketing: Megaphone,
  servicios: Briefcase,
  educacion: GraduationCap,
  logistica: Truck,
};

export function ModulesClient() {
  const [modules, setModules] = useState<InstalledModuleDto[]>([]);
  const [selectedCat, setSelectedCat] = useState<ModuleCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { modules?: InstalledModuleDto[] } | null) => {
        if (data?.modules) setModules(data.modules);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(moduleId: string, currentStatus: string) {
    const targetModule = modules.find((m) => m.id === moduleId);
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    setErrorMessage(null);

    if (nextStatus === "active" && targetModule?.isAllowedByPlan === false) {
      setErrorMessage(
        `El módulo '${targetModule.name}' requiere el Plan Pro o superior. Actualiza tu suscripción en Ajustes → Facturación.`
      );
      return;
    }

    setTogglingId(moduleId);

    // Optimista
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              installed: true,
              status: nextStatus,
            }
          : m
      )
    );

    try {
      const res = await fetch("/api/modules", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleId, status: nextStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, status: currentStatus as "active" | "disabled" } : m
          )
        );
        setErrorMessage(
          json?.message || "No se pudo cambiar el estado del módulo. Revisa tu plan."
        );
      }
    } catch {
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, status: currentStatus as "active" | "disabled" } : m
        )
      );
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = modules.filter(
    (m) => selectedCat === "all" || m.category === selectedCat
  );

  const activeCount = modules.filter((m) => m.status === "active").length;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
            Catálogo de Módulos Sectoriales
          </h1>
          <p className="text-sm text-foreground/85 font-medium">
            Activa las herramientas de IA, esquemas de pipeline y flujos especializados para tu industria con un solo clic.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-panel2 px-3 py-1.5 border border-line text-xs font-semibold">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span>{activeCount} módulos activos</span>
        </div>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {(Object.keys(CATEGORY_LABELS) as Array<ModuleCategory | "all">).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={cn(
              "rounded-full px-3 py-1.5 font-semibold whitespace-nowrap transition-colors",
              selectedCat === cat
                ? "bg-accent text-on-accent shadow-sm"
                : "bg-panel2 text-foreground font-semibold hover:text-accent border border-line"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Alerta de Cuota / Plan Upgrade */}
      {errorMessage && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs shadow-sm">
          <span>{errorMessage}</span>
          <Link
            href="/settings/billing"
            className="font-bold underline text-amber-200 hover:text-white whitespace-nowrap"
          >
            Ver Planes de Facturación →
          </Link>
        </div>
      )}

      {/* Grid de Módulos */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const Icon = CATEGORY_ICONS[m.category] || Sparkles;
            const isActive = m.status === "active";
            const isToggling = togglingId === m.id;

            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all",
                  isActive
                    ? "border-accent/40 bg-panel shadow-md"
                    : "border-line bg-panel hover:border-line/80"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          isActive
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : "bg-panel2 border-line text-foreground/70"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-fg">
                            {m.name}
                          </h3>
                          {m.isAllowedByPlan === false && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Plan Pro
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-foreground/70">
                          v{m.version} · {m.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        label={`Activar módulo ${m.name}`}
                        disabled={isToggling}
                        checked={isActive}
                        onCheckedChange={() => void handleToggle(m.id, m.status)}
                      />
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-foreground/80 font-normal">
                    {m.description}
                  </p>

                  {/* Herramientas de IA */}
                  {m.tools && m.tools.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10.5px] font-bold text-foreground uppercase tracking-wider">
                        Herramientas IA ({m.tools.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.tools.map((t) => (
                          <span
                            key={t.name}
                            className="rounded bg-panel2 px-2 py-0.5 text-[10.5px] font-mono text-accent"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pipeline */}
                  {m.pipelineTemplate && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10.5px] font-bold text-foreground uppercase tracking-wider">
                        Pipeline sugerido:
                      </span>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-foreground/80 font-medium">
                        {m.pipelineTemplate.stages.map((st, idx) => (
                          <span key={st.name} className="flex items-center gap-1">
                            <span>{st.name}</span>
                            {idx < m.pipelineTemplate!.stages.length - 1 && (
                              <span className="text-line">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 font-semibold",
                        isActive ? "text-emerald-500 dark:text-emerald-400" : "text-foreground/70"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isActive ? "bg-emerald-500" : "bg-foreground/40"
                        )}
                      />
                      {isActive ? "Módulo Activo" : "Inactivo"}
                    </span>
                    {isActive && (
                      <Link
                        href={`/modules/${m.id}`}
                        className="text-xs font-semibold text-accent hover:underline ml-1"
                      >
                        Abrir módulo →
                      </Link>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isToggling}
                    onClick={() => void handleToggle(m.id, m.status)}
                    className="h-7 text-xs font-semibold text-accent hover:text-accent"
                  >
                    {isActive ? "Desactivar" : "Activar ahora"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
