"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Blocks,
  CalendarDays,
  ChartColumn,
  FlaskConical,
  Inbox,
  Kanban,
  ListChecks,
  LogOut,
  Radio,
  Settings,
  Sparkles,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { WachatoLogo } from "@/components/brand-mark";
import { BotonInstalar } from "@/components/pwa";
import { BotonActivarAvisos } from "@/components/activar-avisos";
import { limpiarBorradores } from "@/lib/borradores";
import type { Branding } from "@/lib/branding";
import type { Apariencia } from "@/lib/temas";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/nav";
import { signOut } from "@/lib/auth/client";
import { useEvents } from "@/components/use-events";
import {
  debeSonar,
  guardarSonido,
  abrirConversacionDeAviso,
  mostrarAvisoSistema,
  permisoAvisos,
  reproducirAviso,
  sonidoActivado,
  useDesbloquearAudio,
  useTituloNoLeidos,
} from "@/components/avisos-de-mensajes";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  cuerpoAviso,
  debeAvisarSistema,
  urlDeAvisoSegura,
  urlDeConversacion,
} from "@/lib/avisos-sistema";
import { appIconHref } from "@/lib/pwa";
import {
  BUILD_COMMIT,
  UNVERIFIED_COMMIT_NOTE,
  versionLabel,
  versionTitle,
  type ResolvedCommit,
} from "@/lib/version";

export function navItemClass(active: boolean) {
  return cn(
    "flex items-center justify-between gap-2 px-3 py-2.5 rounded-[9px] font-semibold text-[14px] transition-colors whitespace-nowrap",
    active
      ? "bg-accent-soft text-accent"
      : "text-muted hover:bg-panel2 hover:text-fg"
  );
}

export function AppNav({
  branding,
  userName,
  role,
  apariencia,
  commit,
  agenda = false,
  kicker = "Santo Domingo",
  open = false,
  onClose,
}: {
  branding: Branding;
  userName: string;
  role: string;
  apariencia: Apariencia;
  commit?: ResolvedCommit;
  kicker?: string;
  agenda?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [chats, setChats] = useState(0);
  const [sonido, setSonido] = useState(true);

  async function refetchUnread() {
    const res = await fetch("/api/conversations").catch(() => null);
    if (!res?.ok) return null;
    const data = (await res.json()) as {
      conversations: { id: string; unreadCount: number; contact: { name: string } }[];
    };
    setUnread(data.conversations.reduce((a, c) => a + c.unreadCount, 0));
    setChats(data.conversations.filter((c) => c.unreadCount > 0).length);
    return data.conversations;
  }

  useEffect(() => {
    void refetchUnread();
    setSonido(sonidoActivado());
  }, []);

  useDesbloquearAudio();
  useTituloNoLeidos(chats);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const alMensaje = (e: MessageEvent) => {
      const datos = e.data as { tipo?: string; url?: unknown } | null;
      const url = datos?.tipo === "abrir" ? urlDeAvisoSegura(datos.url) : null;
      if (url) abrirConversacionDeAviso(url, (u) => router.push(u));
    };
    sw.addEventListener("message", alMensaje);
    return () => sw.removeEventListener("message", alMensaje);
  }, [router]);

  useEvents({
    onMessageNew: async ({ conversationId, message }) => {
      const m = message as Parameters<typeof cuerpoAviso>[0] & { direction?: string };
      if (debeSonar({ direction: m.direction, conversationId })) reproducirAviso();
      const avisar = debeAvisarSistema({
        direction: m.direction,
        campana: sonidoActivado(),
        permiso: permisoAvisos(),
        visible: document.visibilityState === "visible",
        foco: document.hasFocus(),
      });
      const lista = await refetchUnread();
      const conv = avisar ? lista?.find((c) => c.id === conversationId) : undefined;
      if (conv) {
        void mostrarAvisoSistema({
          titulo: conv.contact.name,
          cuerpo: cuerpoAviso(m),
          tag: conversationId,
          url: urlDeConversacion(conversationId),
          icono: appIconHref(branding, 192),
          alAbrir: (url) => abrirConversacionDeAviso(url, (u) => router.push(u)),
        });
      }
    },
    onConversationUpdated: () => void refetchUnread(),
  });

  const version = commit ?? { commit: BUILD_COMMIT, verified: BUILD_COMMIT !== "" };
  const versionTitulo = versionTitle(branding.name, version);
  const versionTexto = (
    <>
      {versionLabel(version.commit)}
      {version.commit && !version.verified && (
        <span className="mt-0.5 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0 text-warn" strokeWidth={2} aria-hidden />
          {UNVERIFIED_COMMIT_NOTE}
        </span>
      )}
    </>
  );

  const salir = async () => {
    limpiarBorradores();
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const campana = (
    <button
      type="button"
      onClick={() => {
        const v = !sonido;
        setSonido(v);
        guardarSonido(v);
      }}
      aria-label={sonido ? "Sonido de mensajes: activado" : "Sonido de mensajes: silenciado"}
      aria-pressed={sonido}
      title={sonido ? "Silenciar el sonido de mensajes nuevos" : "Activar el sonido de mensajes nuevos"}
      className="rounded p-1 text-muted transition-colors hover:text-fg"
    >
      {sonido ? (
        <Bell className="h-4 w-4" strokeWidth={1.7} />
      ) : (
        <BellOff className="h-4 w-4" strokeWidth={1.7} />
      )}
    </button>
  );

  type WachatoNavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: boolean;
  };

  // Mapeo exacto de vistas según specs/design/wachato-prototype.html
  const mainNavItems: WachatoNavItem[] = [
    { href: "/inbox", label: "Bandeja", icon: Inbox, badge: true },
    { href: "/pipeline", label: "Pipeline", icon: Kanban },
    { href: "/contacts", label: "Contactos", icon: Users },
    { href: "/automations", label: "Automatizaciones", icon: Radio },
    { href: "/agent", label: "Agentes de IA", icon: Sparkles },
    { href: "/agent/training", label: "Entrenar IA", icon: Wand2 },
  ];

  if (agenda) {
    mainNavItems.push({ href: "/bookings", label: "Calendario", icon: CalendarDays });
  }

  mainNavItems.push({ href: "/results", label: "Estadísticas", icon: ChartColumn });
  mainNavItems.push({ href: "/modules", label: "Módulos", icon: Blocks });
  mainNavItems.push({ href: "/connections", label: "Conexiones y Meta", icon: Settings });

  if (role === "owner" || role === "admin") {
    mainNavItems.push({ href: "/onboarding", label: "Guía de inicio", icon: ListChecks });
    mainNavItems.push({ href: "/lab", label: "Laboratorio", icon: FlaskConical });
  }

  function renderNavLink(item: WachatoNavItem) {
    const active = isNavActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-[9px] font-semibold text-[14px] transition-colors whitespace-nowrap",
          active
            ? "bg-accent-soft text-accent"
            : "text-muted hover:bg-panel2 hover:text-fg"
        )}
        aria-current={active ? "page" : undefined}
      >
        <span className="flex items-center gap-2">
          <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          <span>{item.label}</span>
        </span>
        {item.badge && unread > 0 && (
          <span className="count text-[11px] bg-accent text-on-accent rounded-full px-2 py-0.5 font-bold font-display">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between pb-3">
        <Link href="/inbox" aria-label="Wachato">
          <WachatoLogo />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar el menú"
            className="rounded-md p-1.5 text-muted hover:bg-panel2 hover:text-fg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1" id="nav" aria-label="Navegación principal">
        {mainNavItems.map(renderNavLink)}
      </nav>

      <div className="navsep h-px bg-line my-3 mx-1 shrink-0" />

      <BotonActivarAvisos className="px-3 py-1.5 text-xs text-muted hover:text-fg" />
      <BotonInstalar className="px-3 py-1.5 text-xs text-muted hover:text-fg" />

      <div className="mt-auto pt-3">
        <div className="biz p-3 border border-line rounded-xl grid gap-0.5 text-left bg-panel2/50">
          <span className="label text-[11px] uppercase tracking-[0.08em] text-muted font-semibold">
            Negocio
          </span>
          <b id="bizName" className="truncate text-fg text-[14px] font-bold">
            {branding.name}
          </b>
          <span className="muted text-muted text-[12px] truncate">
            {kicker}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-line/60 px-1 text-muted text-xs">
          <span className="truncate max-w-[100px] font-medium" title={userName}>
            {userName}
          </span>
          <div className="flex items-center gap-1">
            {campana}
            <ThemeToggle initial={apariencia} />
            <button
              type="button"
              onClick={() => void salir()}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-1 hover:text-fg rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p
          className="mt-2 px-1 font-mono text-[10px] tracking-[0.04em] text-muted truncate"
          title={versionTitulo}
        >
          {versionTexto}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar fija izquierda (228px) en escritorio */}
      <aside className="aside hidden w-[228px] min-w-[228px] shrink-0 border-r border-line bg-panel p-5 overflow-y-auto lg:flex lg:flex-col gap-0.5">
        {sidebarContent}
      </aside>

      {/* Cajón móvil */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[228px] shrink-0 flex-col overflow-y-auto bg-panel border-r border-line p-5 transition-[transform,visibility] duration-200 lg:hidden shadow-pop",
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
