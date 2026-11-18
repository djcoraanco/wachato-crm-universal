"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  ShieldAlert,
  Stethoscope,
  UserCheck,
} from "lucide-react";

type Doctor = {
  id: string;
  nombre: string;
  especialidad: string;
  exequatur: string;
  dias: string;
  horario: string;
};

type CitaMedica = {
  id: string;
  paciente: string;
  telefono: string;
  doctor: string;
  especialidad: string;
  fecha: string;
  hora: string;
  seguro: string;
  confirmadaWa: boolean;
};

export function ClinicasModuleView() {
  const [tab, setTab] = useState<"citas" | "doctores" | "expedientes">("citas");

  const [doctores] = useState<Doctor[]>([
    {
      id: "d1",
      nombre: "Dra. Carmen Rodríguez",
      especialidad: "Dermatología Clínica & Estética",
      exequatur: "5421-09",
      dias: "Lunes, Miércoles, Viernes",
      horario: "09:00 AM – 02:00 PM",
    },
    {
      id: "d2",
      nombre: "Dr. Alejandro Morales",
      especialidad: "Cirugía Plástica Facial",
      exequatur: "8912-14",
      dias: "Martes, Jueves",
      horario: "02:00 PM – 06:00 PM",
    },
  ]);

  const [citas, setCitas] = useState<CitaMedica[]>([
    {
      id: "c1",
      paciente: "María Fernández",
      telefono: "+1 809-555-0142",
      doctor: "Dra. Carmen Rodríguez",
      especialidad: "Dermatología",
      fecha: "Mañana",
      hora: "10:30 AM",
      seguro: "Primera ARS de Humano",
      confirmadaWa: true,
    },
    {
      id: "c2",
      paciente: "Juan Carlos Pérez",
      telefono: "+1 829-555-0199",
      doctor: "Dr. Alejandro Morales",
      especialidad: "Cirugía Plástica",
      fecha: "Mañana",
      hora: "03:00 PM",
      seguro: "ARS Palic / Mapfre",
      confirmadaWa: false,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        {[
          { id: "citas" as const, label: "Agenda y Confirmaciones 24h", icon: Calendar },
          { id: "doctores" as const, label: "Especialistas y Horarios", icon: Stethoscope },
          { id: "expedientes" as const, label: "Expedientes Médicos (Protegidos)", icon: Lock },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold font-display transition-colors ${
              tab === item.id
                ? "bg-accent text-on-accent"
                : "bg-panel2 text-foreground font-semibold hover:text-accent border border-line"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* VISTA 1: Citas y Confirmación 24h */}
      {tab === "citas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg">Próximas Citas Médicas</h3>
              <p className="text-xs text-foreground/80 font-medium">
                El sistema dispara recordatorio interactivo por WhatsApp 24 horas antes para confirmación con 1 clic.
              </p>
            </div>
            <button
              onClick={() => alert("Simulando envío de recordatorios WhatsApp 24h...")}
              className="px-3.5 py-1.5 bg-accent text-on-accent text-xs font-bold font-display rounded-lg flex items-center gap-1.5 hover:opacity-90"
            >
              <MessageSquare className="h-4 w-4" /> Disparar Recordatorios WhatsApp
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="card p-4 rounded-xl border border-line bg-panel space-y-3 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <div>
                    <b className="text-sm font-bold text-fg block">{cita.paciente}</b>
                    <span className="text-foreground/75 font-medium">{cita.telefono}</span>
                  </div>
                  {cita.confirmadaWa ? (
                    <span className="flex items-center gap-1 text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmada por WhatsApp
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded-full text-[11px]">
                      <Clock className="h-3.5 w-3.5" /> Pendiente confirmación
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-foreground/85 font-medium">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-fg">Especialista</span>
                    <span>{cita.doctor}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-fg">Horario</span>
                    <span className="text-fg font-semibold">{cita.fecha} · {cita.hora}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-fg">Seguro Médico</span>
                    <span>{cita.seguro}</span>
                  </div>
                </div>

                {!cita.confirmadaWa && (
                  <div className="pt-2 border-t border-line/60 flex justify-end">
                    <button
                      onClick={() =>
                        setCitas(
                          citas.map((c) =>
                            c.id === cita.id ? { ...c, confirmadaWa: true } : c
                          )
                        )
                      }
                      className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Marcar confirmada manualmente
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 2: Doctores */}
      {tab === "doctores" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Cuadro Médico & Especialistas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctores.map((doc) => (
              <div
                key={doc.id}
                className="card p-4 rounded-xl border border-line bg-panel space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <b className="text-sm font-bold text-fg">{doc.nombre}</b>
                  <span className="text-[10px] text-muted font-mono bg-panel2 px-2 py-0.5 rounded">
                    Exeq: {doc.exequatur}
                  </span>
                </div>
                <p className="text-accent font-semibold">{doc.especialidad}</p>
                <div className="text-muted pt-1">
                  <p>Días: {doc.dias}</p>
                  <p>Horario: {doc.horario}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: Expedientes Protegidos */}
      {tab === "expedientes" && (
        <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-fg">
                Aislamiento Estricto de Privacidad Médica (HIPAA / Cumplimiento Sanitario)
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Por directiva constitucional de privacidad, el agente de IA <b>NUNCA</b> tiene acceso de lectura ni escritura a diagnósticos, recetas ni antecedentes médicos. El bot únicamente coordina disponibilidad horaria y confirmación de citas administrativas.
              </p>
            </div>
          </div>
          <div className="p-3 bg-panel2 border border-line rounded-lg text-xs font-mono text-muted">
            <p className="text-accent font-bold">✓ Acceso Administrativo Seguro Activo</p>
            <p>Los expedientes clínicos residen cifrados en tabla desacoplada con RBAC exclusivo para personal de salud matriculado.</p>
          </div>
        </div>
      )}
    </div>
  );
}
