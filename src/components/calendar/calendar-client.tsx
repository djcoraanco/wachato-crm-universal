"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

type Appointment = {
  id: string;
  day: number; // 0 = Lunes, 5 = Sábado
  hour: number; // 9 a 17
  duration: number; // Horas (ej. 1)
  name: string;
  service: string;
  by: "IA" | "Equipo";
};

export function CalendarClient() {
  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      day: 0,
      hour: 10,
      duration: 1,
      name: "Laura Gómez",
      service: "Consulta General",
      by: "IA",
    },
    {
      id: "2",
      day: 1,
      hour: 11,
      duration: 1,
      name: "Carlos Rivera",
      service: "Evaluación Facial",
      by: "Equipo",
    },
    {
      id: "3",
      day: 2,
      hour: 15,
      duration: 1,
      name: "María Fernández",
      service: "Tratamiento Láser",
      by: "IA",
    },
    {
      id: "4",
      day: 3,
      hour: 9,
      duration: 1,
      name: "Dr. Pedro Santos",
      service: "Seguimiento Clínico",
      by: "IA",
    },
    {
      id: "5",
      day: 4,
      hour: 14,
      duration: 1,
      name: "Ana Martínez",
      service: "Limpieza Profunda",
      by: "Equipo",
    },
    {
      id: "6",
      day: 4,
      hour: 16,
      duration: 1,
      name: "Ing. Juan Valdez",
      service: "Consulta Diagnóstica",
      by: "IA",
    },
  ]);

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4 lg:p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 pb-1">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google Calendar conectado
            </span>
            <span className="text-xs text-muted">contacto@crm.com</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
            Calendario Semanal
          </h1>
          <p className="text-sm text-muted">
            Horas laborables de 9:00 a. m. a 6:00 p. m. La IA solo ofrece huecos libres reales para evitar sobrecupos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold text-fg">Semana actual</span>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-2 bg-accent text-on-accent hover:opacity-90 font-bold ml-2">
            <Plus className="h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent" />
          Agendado por IA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#5B97F7]" />
          Agendado por Equipo
        </span>
      </div>

      {/* Rejilla de Calendario */}
      <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-sm">
        <div className="min-w-[800px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-7 border-b border-line bg-panel2 text-center text-xs font-bold text-fg">
            <div className="py-3 text-muted">Hora</div>
            {DAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "py-3 border-l border-line",
                  idx === 2 && "bg-accent-soft text-accent"
                )}
              >
                {day} {idx === 2 && "· Hoy"}
              </div>
            ))}
          </div>

          {/* Filas de horas */}
          <div className="divide-y divide-line">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-7 min-h-[64px] text-xs">
                {/* Columna de hora */}
                <div className="flex items-start justify-center p-2 font-mono text-muted text-[11px]">
                  {hour > 12 ? `${hour - 12}:00 p. m.` : `${hour}:00 a. m.`}
                </div>

                {/* Columnas por día */}
                {DAYS.map((_, dayIdx) => {
                  const match = appointments.find(
                    (a) => a.day === dayIdx && a.hour === hour
                  );

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "border-l border-line p-1 relative",
                        dayIdx === 2 && "bg-accent-soft/20"
                      )}
                    >
                      {match && (
                        <div
                          className={cn(
                            "rounded-lg p-2 text-left shadow-sm transition-transform hover:scale-[1.02]",
                            match.by === "IA"
                              ? "bg-accent text-on-accent font-medium"
                              : "bg-[#5B97F7] text-white font-medium"
                          )}
                        >
                          <div className="font-bold text-[11.5px] truncate">
                            {match.name}
                          </div>
                          <div className="text-[10px] opacity-90 truncate">
                            {match.service}
                          </div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-80">
                            {match.by === "IA" ? "⚡ IA" : "👤 Equipo"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
