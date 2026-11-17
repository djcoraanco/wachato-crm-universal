"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Instagram,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type MetaConnectionSummary } from "@/server/meta/oauth";

interface MetaOneClickConnectProps {
  channelFilter?: "all" | "whatsapp" | "instagram" | "messenger";
  onSuccess?: (summary: MetaConnectionSummary) => void;
  className?: string;
}

export function MetaOneClickConnect({
  channelFilter = "all",
  onSuccess,
  className = "",
}: MetaOneClickConnectProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [summary, setSummary] = useState<MetaConnectionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/channels/meta/config")
      .then((r) => r.json())
      .then((data) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "META_CONNECT_SUCCESS") {
        setConnecting(false);
        const res = event.data.summary as MetaConnectionSummary;
        setSummary(res);
        setError(null);
        if (onSuccess) onSuccess(res);
      } else if (event.data?.type === "META_CONNECT_ERROR") {
        setConnecting(false);
        setError(event.data.error || "Ocurrió un error al autorizar con Meta");
      }
    },
    [onSuccess]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  async function startConnect() {
    setConnecting(true);
    setError(null);

    const loginUrl = `/api/channels/meta/login?popup=true&channelFilter=${channelFilter}&returnTo=${encodeURIComponent(
      window.location.pathname
    )}`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      loginUrl,
      "MetaConnectPopup",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // Bloqueador de popups detectado, redirigir normalmente
      window.location.href = `/api/channels/meta/login?popup=false&channelFilter=${channelFilter}&returnTo=${encodeURIComponent(
        window.location.pathname
      )}`;
    }
  }

  if (configured === null) {
    return null;
  }

  const titleByFilter = {
    all: "Conexión Oficial en 1 Clic (WhatsApp, Facebook e Instagram)",
    whatsapp: "Conectar WhatsApp Oficial en 1 Clic (Embedded Signup)",
    instagram: "Conectar Instagram en 1 Clic",
    messenger: "Conectar Facebook Messenger en 1 Clic",
  }[channelFilter];

  const descByFilter = {
    all: "Vincula tu WhatsApp Business Platform, tus Páginas de Facebook y cuentas de Instagram profesionales en segundos sin copiar tokens ni configurar webhooks manualmente.",
    whatsapp: "Vincula tu número de WhatsApp Business Platform y registra los webhooks automáticamente en Meta con tu cuenta de Facebook.",
    instagram: "Conecta tu perfil profesional de Instagram seleccionando tu Página de Facebook vinculada.",
    messenger: "Conecta tu bandeja de Facebook Messenger seleccionando tu Página de Facebook.",
  }[channelFilter];

  return (
    <Card className={`border-primary/30 bg-primary/5 shadow-sm relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold">{titleByFilter}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-background/50 border-primary/20">
            Recomendado
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {descByFilter}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Canales soportados */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Canales:</span>
          {(channelFilter === "all" || channelFilter === "whatsapp") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <MessageSquare className="h-3 w-3" /> WhatsApp
            </span>
          )}
          {(channelFilter === "all" || channelFilter === "messenger") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              <MessageSquare className="h-3 w-3" /> Messenger
            </span>
          )}
          {(channelFilter === "all" || channelFilter === "instagram") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 font-medium">
              <Instagram className="h-3 w-3" /> Instagram
            </span>
          )}
        </div>

        {configured ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={startConnect}
              disabled={connecting}
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium shadow-sm"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando con Meta…
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Conectar con Meta
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              Se abrirá la ventana oficial de Meta / Facebook para autorizar los permisos.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground border">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Configuración rápida disponible</p>
              <p>
                Define <code className="bg-background px-1 rounded">META_APP_ID</code> y{" "}
                <code className="bg-background px-1 rounded">META_APP_SECRET</code> en tu archivo{" "}
                <code>.env</code> para activar la conexión en 1 clic de tus clientes. Abajo puedes
                continuar con la configuración de tokens directa.
              </p>
            </div>
          </div>
        )}

        {/* Resumen de éxito */}
        {summary && (
          <div className="p-3.5 rounded-lg border border-success/30 bg-success/10 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-medium text-success text-sm">
              <CheckCircle2 className="h-4 w-4" /> Canales vinculados con éxito:
            </div>
            {summary.whatsapp?.connected && (
              <p className="text-foreground">
                • <strong>WhatsApp:</strong> Conectado ({summary.whatsapp.displayPhoneNumber || summary.whatsapp.phoneNumberId})
              </p>
            )}
            {summary.messenger?.connected && (
              <p className="text-foreground">
                • <strong>Messenger:</strong> Conectado (Página: {summary.messenger.pageName || summary.messenger.pageId})
              </p>
            )}
            {summary.instagram?.connected && (
              <p className="text-foreground">
                • <strong>Instagram:</strong> Conectado (@{summary.instagram.username || summary.instagram.igUserId})
              </p>
            )}
            {summary.whatsapp?.error && (
              <p className="text-destructive">• WhatsApp: {summary.whatsapp.error}</p>
            )}
            {summary.messenger?.error && (
              <p className="text-destructive">• Messenger: {summary.messenger.error}</p>
            )}
            {summary.instagram?.error && (
              <p className="text-destructive">• Instagram: {summary.instagram.error}</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
