"use client";

import {
  Building2,
  Briefcase,
  GraduationCap,
  Truck,
  MapPin,
} from "lucide-react";

export function InmobiliariaModuleView() {
  const propiedades = [
    { id: "pr1", titulo: "Apartamento Torre Sky Piantini", precio: "US$ 245,000", tipo: "Venta", hab: 2, zona: "Piantini" },
    { id: "pr2", titulo: "Penthouse Bella Vista Sur", precio: "US$ 480,000", tipo: "Venta", hab: 3, zona: "Bella Vista" },
    { id: "pr3", titulo: "Oficina Corporativa Acrópolis", precio: "US$ 2,200/mes", tipo: "Alquiler", hab: 0, zona: "Piantini" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent" /> Cartera de Propiedades & Visitas Agendadas
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {propiedades.map((p) => (
          <div key={p.id} className="card p-4 rounded-xl border border-line bg-panel space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent-soft text-accent">
              {p.tipo}
            </span>
            <b className="text-sm font-bold text-fg block">{p.titulo}</b>
            <p className="text-accent font-display font-bold text-base">{p.precio}</p>
            <p className="text-muted flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {p.zona} · {p.hab > 0 ? `${p.hab} habs` : "Comercial"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServiciosModuleView() {
  return (
    <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-bold text-fg">Proyectos, Horas y Cotizaciones</h3>
      </div>
      <p className="text-muted leading-relaxed">
        Gestión de horas profesionales, propuestas comerciales y generación automática de contratos de servicios con firma electrónica vía WhatsApp.
      </p>
      <div className="p-3 bg-panel2 border border-line rounded-lg text-accent font-mono">
        ✓ Módulo de Consultoría & Servicios Profesionales Operativo
      </div>
    </div>
  );
}

export function EducacionModuleView() {
  return (
    <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-bold text-fg">Cursos, Alumnos y Admisiones</h3>
      </div>
      <p className="text-muted leading-relaxed">
        Matrículas de estudiantes por chat, recordatorios de inicio de clases, temarios descargables y encuestas de satisfacción.
      </p>
      <div className="p-3 bg-panel2 border border-line rounded-lg text-accent font-mono">
        ✓ Módulo de Educación & Academias Operativo
      </div>
    </div>
  );
}

export function LogisticaModuleView() {
  return (
    <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-bold text-fg">Tracking de Envíos & Despacho</h3>
      </div>
      <p className="text-muted leading-relaxed">
        Consultas de número de guía por WhatsApp con respuesta instantánea del bot sobre estado de tránsito y ubicación estimada del paquete.
      </p>
      <div className="p-3 bg-panel2 border border-line rounded-lg text-accent font-mono">
        ✓ Módulo de Envíos & Logística Operativo
      </div>
    </div>
  );
}
