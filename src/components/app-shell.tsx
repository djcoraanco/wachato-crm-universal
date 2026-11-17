"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Branding } from "@/lib/branding";
import type { Apariencia } from "@/lib/temas";
import type { ResolvedCommit } from "@/lib/version";
import { AppNav } from "@/components/app-nav";
import { WachatoTopbar } from "@/components/topbar";
import { cn } from "@/lib/utils";
import { BandaSinConexion } from "@/components/banda-sin-conexion";
import { AtajosGlobales } from "@/components/atajos-globales";

export function AppShell({
  branding,
  userName,
  role,
  apariencia,
  commit,
  agenda = false,
  kicker,
  aviso = null,
  children,
}: {
  branding: Branding;
  userName: string;
  role: string;
  apariencia: Apariencia;
  commit?: ResolvedCommit;
  agenda?: boolean;
  kicker?: string;
  aviso?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esBandeja = pathname === "/inbox" || pathname.startsWith("/inbox/");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="app flex h-dvh w-full overflow-hidden bg-bg text-fg font-body">
      {navOpen && (
        <button
          aria-label="Cerrar el menú"
          tabIndex={-1}
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
        />
      )}

      <AppNav
        branding={branding}
        commit={commit}
        userName={userName}
        role={role}
        apariencia={apariencia}
        agenda={agenda}
        kicker={kicker}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
        <WachatoTopbar pathname={pathname} onOpenNav={() => setNavOpen(true)} />

        {aviso}
        <BandaSinConexion />
        <AtajosGlobales agenda={agenda} role={role} />

        <main
          className={cn(
            "view flex-1 min-h-0 overflow-auto",
            esBandeja ? "flush p-0 overflow-hidden" : "p-5"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
