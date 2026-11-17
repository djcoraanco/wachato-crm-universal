"use client";

import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Automation = {
  id: string;
  name: string;
  on: boolean;
  runs: number;
  steps: string[];
};

export function AutomationsClient() {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "1",
      name: "Bienvenida y calificación de lead",
      on: true,
      runs: 412,
      steps: [
        "Mensaje nuevo de WhatsApp",
        "Enviar mensaje de bienvenida",
        "Preguntar qué servicio busca",
        "Mover a Calificado",
      ],
    },
    {
      id: "2",
      name: "Recordatorio de cita 24 h antes",
      on: true,
      runs: 128,
      steps: [
        "Cita en 24 h",
        "Enviar plantilla aprobada",
        "Esperar confirmación del cliente",
      ],
    },
    {
      id: "3",
      name: "Reactivación de lead frío a los 7 días",
      on: false,
      runs: 64,
      steps: [
        "7 días sin actividad",
        "Enviar plantilla de seguimiento",
        "Si responde, reactivar IA",
      ],
    },
    {
      id: "4",
      name: "Alerta al equipo por trato de alto valor",
      on: true,
      runs: 89,
      steps: [
        "Lead entra a Negociación",
        "Monto superior a RD$ 5,000",
        "Enviar notificación push y crear tarea urgente",
      ],
    },
  ]);

  function toggleAutomation(id: string) {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, on: !a.on } : a))
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
            Automatizaciones
          </h1>
          <p className="text-sm text-muted">
            Cada automatización respeta las reglas de Meta: dentro de las 24 h se responde libre; fuera de la ventana solo con plantillas aprobadas.
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-accent text-on-accent hover:opacity-90 font-bold">
          <Plus className="h-4 w-4" />
          Nueva automatización
        </Button>
      </div>

      {/* Lista de Flujos */}
      <div className="space-y-4">
        {automations.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-xl border p-5 shadow-sm transition-all bg-panel",
              a.on ? "border-line" : "border-line/60 opacity-80"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    a.on
                      ? "bg-accent/15 border-accent/30 text-accent"
                      : "bg-panel2 border-line text-muted"
                  )}
                >
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-fg">
                    {a.name}
                  </h2>
                  <span className="font-mono text-xs text-muted">
                    {a.runs.toLocaleString("es-DO")} ejecuciones registradas
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    a.on
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-panel2 text-muted"
                  )}
                >
                  {a.on ? "Activa" : "Pausada"}
                </span>
                <Switch
                  size="sm"
                  label={`Activar ${a.name}`}
                  checked={a.on}
                  onCheckedChange={() => toggleAutomation(a.id)}
                />
              </div>
            </div>

            {/* Diagrama de Flujo Paso a Paso */}
            <div className="pt-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                {a.steps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    {idx > 0 && (
                      <ArrowRight className="h-4 w-4 text-muted/60 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap border",
                        idx === 0
                          ? "bg-accent/15 text-accent border-accent/30 font-bold"
                          : "bg-panel2 text-fg/90 border-line"
                      )}
                    >
                      {idx === 0 && "Disparador: "}
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
