"use client";

import { Menu } from "lucide-react";

export function WachatoTopbar({
  pathname,
  onOpenNav,
}: {
  pathname: string;
  onOpenNav?: () => void;
}) {
  const getTitle = (path: string) => {
    if (path.startsWith("/inbox")) return "Bandeja";
    if (path.startsWith("/pipeline")) return "Pipeline";
    if (path.startsWith("/contacts")) return "Contactos";
    if (path.startsWith("/automations")) return "Automatizaciones";
    if (path === "/agent/training") return "Entrenar IA";
    if (path.startsWith("/agent")) return "Agentes de IA";
    if (path.startsWith("/lab")) return "Laboratorio";
    if (path.startsWith("/bookings") || path.startsWith("/calendar")) return "Calendario";
    if (path.startsWith("/results") || path.startsWith("/analytics")) return "Estadísticas";
    if (path.startsWith("/modules")) return "Módulos Sectoriales";
    if (path.startsWith("/agency")) return "Agencia Partner";
    if (path.startsWith("/connections")) return "Conexiones y Meta";
    if (path.startsWith("/admin")) return "Super Admin";
    if (path.startsWith("/settings")) return "Ajustes";
    if (path.startsWith("/onboarding")) return "Guía de inicio";
    return "CRM";
  };

  const hoy = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const fechaCapitalizada = hoy.charAt(0).toUpperCase() + hoy.slice(1);

  return (
    <header className="topbar flex items-center gap-3 px-5 py-3 border-b border-line bg-panel shrink-0 flex-wrap">
      {onOpenNav && (
        <button
          onClick={onOpenNav}
          aria-label="Abrir menú"
          className="lg:hidden p-1.5 rounded-lg text-foreground/80 hover:text-accent hover:bg-panel2 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <h1 className="font-display font-black text-[20px] text-fg tracking-[-0.01em]">
        {getTitle(pathname)}
      </h1>
      <div className="flex-1" />
      <span className="text-foreground/80 text-[13px] font-semibold hidden sm:inline-block">
        {fechaCapitalizada}
      </span>
    </header>
  );
}
