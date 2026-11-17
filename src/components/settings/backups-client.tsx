"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  HardDriveDownload,
  ShieldCheck,
} from "lucide-react";
import type { BackupSummary } from "@/server/backups/backup-service";

export function BackupsClient() {
  const [generating, setGenerating] = useState(false);
  const [lastBackup, setLastBackup] = useState<{
    filename: string;
    summary: BackupSummary;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateBackup() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/settings/backups", {
      method: "POST",
    }).catch(() => null);

    setGenerating(false);

    if (res?.ok) {
      const data = await res.json();
      setLastBackup(data);
    } else {
      const err = await res?.json().catch(() => null);
      setError(
        err?.error?.message ??
          "No se pudo generar la copia de seguridad. Verifica permisos."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold font-display text-fg flex items-center gap-2">
          <HardDriveDownload className="h-5 w-5 text-accent" />
          Copias de Seguridad & Respaldo Empresarial
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          Descarga un snapshot completo comprimido (<code>.json.gz</code>) con todas las conversaciones, contactos, etapas de pipeline, citas y configuraciones de tu negocio.
        </p>
      </div>

      <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <b className="text-sm font-bold text-fg block">
              Generar Copia de Seguridad Instantánea
            </b>
            <span className="text-xs text-muted">
              Crea un archivo de respaldo seguro listo para restauración o migración de servidor.
            </span>
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={handleCreateBackup}
            className="px-4 py-2 bg-accent text-on-accent text-xs font-bold font-display rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            {generating ? "Generando respaldo…" : "Crear Backup Ahora"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-danger font-medium bg-danger/10 p-2.5 rounded-lg border border-danger/30">
            {error}
          </p>
        )}

        {lastBackup && (
          <div className="p-4 bg-panel2 border border-accent/40 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-accent">
                <CheckCircle2 className="h-4 w-4" /> Copia de seguridad generada con éxito
              </span>
              <a
                href="/api/settings/backups"
                download={lastBackup.filename}
                className="px-3.5 py-1.5 bg-accent text-on-accent text-xs font-bold font-display rounded-lg flex items-center gap-1.5 hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> Descargar {lastBackup.filename}
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2 bg-panel rounded border border-line">
                <span className="text-[10px] text-muted block uppercase">Contactos</span>
                <b className="text-fg">{lastBackup.summary.counts.contacts ?? 0}</b>
              </div>
              <div className="p-2 bg-panel rounded border border-line">
                <span className="text-[10px] text-muted block uppercase">Mensajes</span>
                <b className="text-fg">{lastBackup.summary.counts.messages ?? 0}</b>
              </div>
              <div className="p-2 bg-panel rounded border border-line">
                <span className="text-[10px] text-muted block uppercase">Conversaciones</span>
                <b className="text-fg">{lastBackup.summary.counts.conversations ?? 0}</b>
              </div>
              <div className="p-2 bg-panel rounded border border-line">
                <span className="text-[10px] text-muted block uppercase">Citas</span>
                <b className="text-fg">{lastBackup.summary.counts.bookings ?? 0}</b>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-panel2/50 border border-line rounded-xl text-xs text-muted flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <b className="text-fg block mb-0.5">Soberanía de Datos Garantizada</b>
          Tus datos te pertenecen al 100%. Las copias no dependen de la nube de terceros ni de servicios externos de almacenamiento propietario. Puedes restablecer el estado en cualquier instancia de Wachato CRM con Postgres en segundos.
        </div>
      </div>
    </div>
  );
}
