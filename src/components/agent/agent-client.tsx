"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BrainStatusCard } from "@/components/agent/brain-status-card";
import type { BrainStatusDto } from "@/lib/brain-status";

export const PROV_CATALOG: Record<
  string,
  {
    n: string;
    pre: string;
    ph: string;
    url: string;
    link: string;
    baseUrl?: string;
    models: Array<[string, string]>;
  }
> = {
  anthropic: {
    n: "Anthropic (Claude)",
    pre: "sk-ant-",
    ph: "sk-ant-…",
    url: "console.anthropic.com",
    link: "https://console.anthropic.com",
    baseUrl: "https://openrouter.ai/api", // Compatible LLM proxy
    models: [
      ["anthropic/claude-3.5-sonnet", "equilibrado, recomendado"],
      ["anthropic/claude-3.5-haiku", "rápido y económico"],
      ["anthropic/claude-3-opus", "el más capaz"],
    ],
  },
  openai: {
    n: "OpenAI (ChatGPT)",
    pre: "sk-",
    ph: "sk-…",
    url: "platform.openai.com",
    link: "https://platform.openai.com/api-keys",
    baseUrl: "https://api.openai.com/v1",
    models: [
      ["gpt-4o", "el más capaz"],
      ["gpt-4o-mini", "equilibrado, recomendado"],
      ["gpt-4-turbo", "robusto para tareas complejas"],
    ],
  },
  gemini: {
    n: "Google Gemini",
    pre: "AIza",
    ph: "AIza…",
    url: "aistudio.google.com",
    link: "https://aistudio.google.com/app/apikey",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: [
      ["gemini-1.5-pro", "el más capaz"],
      ["gemini-1.5-flash", "rápido y económico"],
      ["gemini-2.0-flash-exp", "nueva generación"],
    ],
  },
  mistral: {
    n: "Mistral",
    pre: "",
    ph: "Tu clave de Mistral",
    url: "console.mistral.ai",
    link: "https://console.mistral.ai",
    baseUrl: "https://api.mistral.ai/v1",
    models: [
      ["mistral-large-latest", "el más capaz"],
      ["mistral-small-latest", "rápido y económico"],
    ],
  },
  deepseek: {
    n: "DeepSeek",
    pre: "sk-",
    ph: "sk-…",
    url: "platform.deepseek.com",
    link: "https://platform.deepseek.com",
    baseUrl: "https://api.deepseek.com",
    models: [
      ["deepseek-chat", "conversación"],
      ["deepseek-reasoner", "razonamiento profundo"],
    ],
  },
  custom: {
    n: "Otro compatible con OpenAI (OpenRouter, Groq, Ollama…)",
    pre: "",
    ph: "Tu clave API",
    url: "el panel de tu proveedor",
    link: "https://openrouter.ai/keys",
    baseUrl: "https://openrouter.ai/api",
    models: [
      ["openrouter/auto", "enrutamiento inteligente"],
      ["meta-llama/llama-3.3-70b-instruct", "open source de alto rendimiento"],
    ],
  },
};

type Mode = "wachato" | "externo" | "mixto";

type HandoffRules = {
  persona?: boolean;
  queja?: boolean;
  medica?: boolean;
  fuera?: boolean;
};

type Profile = {
  enabled: boolean;
  name: string;
  tone: string | null;
  instructions: string | null;
  escalationRules: string | null;
  greeting: string | null;
  role: string;
  tools: string[];
  mode: Mode;
  externalWebhookUrl: string | null;
  externalSecret: string | null;
  handoffRules: HandoffRules;
};

export function AgentClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brain, setBrain] = useState<BrainStatusDto | null>(null);
  const [saved, setSaved] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Motor de IA
  const [aiProv, setAiProv] = useState<string>("anthropic");
  const [aiBase, setAiBase] = useState<string>("https://api.openai.com/v1");
  const [aiModel, setAiModel] = useState<string>("anthropic/claude-3.5-sonnet");
  const [aiKey, setAiKey] = useState<string>("");
  const [connectedKey, setConnectedKey] = useState<string | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Agente Externo
  const [hookTested, setHookTested] = useState<string>("");
  const [testingHook, setTestingHook] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadBrain = useCallback(async () => {
    const b = await fetch("/api/agent/brain-status")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    setBrain(b);
  }, []);

  const refetch = useCallback(async () => {
    const [p, ai] = await Promise.all([
      fetch("/api/agent/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/settings/ai").then((r) => (r.ok ? r.json() : null)),
      loadBrain(),
    ]).catch(() => [null, null]);

    if (p?.profile) {
      setProfile(p.profile);
    }

    if (ai?.credencial) {
      if (ai.credencial.tokenLast4) {
        setConnectedKey(`● Conectada · …${ai.credencial.tokenLast4}`);
      }
      if (ai.credencial.modelo) {
        setAiModel(ai.credencial.modelo);
      }
      if (ai.credencial.baseUrl) {
        setAiBase(ai.credencial.baseUrl);
      }
    }
  }, [loadBrain]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Cargando configuración de agentes…
      </div>
    );
  }

  async function saveProfilePatch(patch: Partial<Profile>) {
    const next = { ...profile, ...patch } as Profile;
    setProfile(next);
    const res = await fetch("/api/agent/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);

    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      if (patch.enabled !== undefined) {
        setSwitchError(
          data?.error?.message ??
            (patch.enabled
              ? "No se pudo encender el agente."
              : "No se pudo apagar el agente.")
        );
      }
      void refetch();
      return false;
    }
    if (patch.enabled !== undefined) setSwitchError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    return true;
  }

  async function handleConnectKey() {
    if (!aiKey.trim()) return;
    setTestingAi(true);
    setAiTestResult(null);

    const baseUrl =
      aiProv === "custom"
        ? aiBase
        : PROV_CATALOG[aiProv]?.baseUrl ?? "https://openrouter.ai/api";

    const res = await fetch("/api/settings/ai", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "openai_compatible",
        baseUrl,
        model: aiModel,
        token: aiKey.trim(),
      }),
    }).catch(() => null);

    setTestingAi(false);
    if (res?.ok) {
      const last4 = aiKey.trim().slice(-4);
      setConnectedKey(`● Conectada · …${last4}`);
      setAiKey("");
      setAiTestResult({ ok: true, msg: "Clave guardada y cifrada correctamente." });
    } else {
      const err = await res?.json().catch(() => null);
      setAiTestResult({
        ok: false,
        msg: err?.error?.message ?? "Error al validar la clave con el proveedor.",
      });
    }
  }

  async function handleDisconnectKey() {
    await fetch("/api/settings/ai", { method: "DELETE" }).catch(() => null);
    setConnectedKey(null);
    setAiTestResult(null);
  }

  async function handleTestAiProbe() {
    setTestingAi(true);
    setAiTestResult(null);
    const baseUrl =
      aiProv === "custom"
        ? aiBase
        : PROV_CATALOG[aiProv]?.baseUrl ?? "https://openrouter.ai/api";

    const res = await fetch("/api/settings/ai/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "openai_compatible",
        baseUrl,
        model: aiModel,
        token: aiKey.trim() || undefined,
      }),
    }).catch(() => null);

    setTestingAi(false);
    if (res?.ok) {
      setAiTestResult({ ok: true, msg: "Conexión exitosa con el proveedor de IA." });
    } else {
      const err = await res?.json().catch(() => null);
      setAiTestResult({
        ok: false,
        msg: err?.error?.message ?? "No se pudo conectar con el modelo.",
      });
    }
  }

  async function handleTestHook() {
    if (!profile?.externalWebhookUrl) {
      setHookTested("Escribe la URL del webhook primero");
      return;
    }
    setTestingHook(true);
    setHookTested("Probando webhook…");
    try {
      const res = await fetch(profile.externalWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-wachato-secret": profile.externalSecret || "wachato-test",
        },
        body: JSON.stringify({
          tipo: "ping",
          timestamp: new Date().toISOString(),
          mensaje: "Prueba de conectividad desde Wachato CRM Universal",
        }),
      });
      if (res.ok) {
        setHookTested("✓ Conexión exitosa (200 OK)");
      } else {
        setHookTested(`✗ Falló: HTTP ${res.status}`);
      }
    } catch {
      setHookTested("✗ Error de red o URL inalcanzable");
    } finally {
      setTestingHook(false);
    }
  }

  const samplePayload = JSON.stringify(
    {
      contacto: { nombre: "María Fernández", canal: "whatsapp" },
      mensaje: "¿Tienen disponibilidad esta semana?",
      etapa: "calificado",
      ventana_24h_abierta: true,
      negocio: {
        servicios: ["Limpieza facial", "Botox"],
        horario: "Lunes a viernes 9:00 AM – 7:00 PM",
      },
    },
    null,
    2
  );

  const pv = PROV_CATALOG[aiProv] ?? PROV_CATALOG.anthropic!;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-fg flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Configuración de Agentes de IA
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Define quién responde a tus clientes, qué modelo de IA usar y cuándo transferir a un agente humano.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-semibold text-accent animate-fade-in">
              Guardado ✓
            </span>
          )}
          <span className="text-sm font-medium text-muted">
            {profile.enabled ? "Agente encendido" : "Agente apagado"}
          </span>
          <Switch
            checked={profile.enabled}
            label="Agente encendido"
            onCheckedChange={(enabled) => void saveProfilePatch({ enabled })}
          />
        </div>
        {switchError && (
          <p role="alert" className="w-full text-right text-xs text-danger font-medium">
            {switchError}
          </p>
        )}
      </header>

      {brain && (
        <div>
          <BrainStatusCard status={brain} />
        </div>
      )}

      {/* Grid de Configuración según specs/design/wachato-prototype.html */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* CARD 1: ¿Quién responde los mensajes? */}
        <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
          <h2 className="text-base font-bold font-display text-fg">
            ¿Quién responde los mensajes?
          </h2>
          <div className="space-y-3">
            {[
              {
                id: "wachato" as Mode,
                title: "Agente Wachato",
                desc: "Aprende de lo que cargas en «Entrenar IA». Listo para usar.",
              },
              {
                id: "externo" as Mode,
                title: "Agente externo del cliente",
                desc: "Conecta un agente que ya tengas (n8n, Make, OpenAI, Botpress…) por webhook.",
              },
              {
                id: "mixto" as Mode,
                title: "Mixto",
                desc: "El agente externo responde y Wachato toma el control si falla o tarda más de 10 s.",
              },
            ].map((opt) => {
              const active = profile.mode === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`card flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    active
                      ? "border-accent bg-accent-soft/30"
                      : "border-line bg-panel2/50 hover:bg-panel2 text-fg"
                  }`}
                >
                  <input
                    type="radio"
                    name="agent_mode"
                    value={opt.id}
                    checked={active}
                    onChange={() => void saveProfilePatch({ mode: opt.id })}
                    className="mt-1 accent-[#00C4C0]"
                  />
                  <div>
                    <b className="text-sm font-semibold text-fg block">
                      {opt.title}
                    </b>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* CARD 2: Motor de IA (oculto si modo es externo puro) */}
        {profile.mode !== "externo" && (
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <h2 className="text-base font-bold font-display text-fg">
              Motor de IA
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Elige qué inteligencia artificial usa tu agente y conecta tu propia clave API. El consumo lo cobra directamente el proveedor a tu cuenta.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg" htmlFor="aiProv">
                Proveedor
              </label>
              <select
                id="aiProv"
                value={aiProv}
                onChange={(e) => {
                  const p = e.target.value;
                  setAiProv(p);
                  const entry = PROV_CATALOG[p];
                  if (entry) {
                    if (entry.models[0]) setAiModel(entry.models[0][0]);
                    if (entry.baseUrl) setAiBase(entry.baseUrl);
                  }
                }}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              >
                {Object.entries(PROV_CATALOG).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.n}
                  </option>
                ))}
              </select>
            </div>

            {aiProv === "custom" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg" htmlFor="aiBase">
                  URL base de la API
                </label>
                <input
                  type="url"
                  id="aiBase"
                  value={aiBase}
                  onChange={(e) => setAiBase(e.target.value)}
                  placeholder="https://openrouter.ai/api o tu servidor vLLM"
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg" htmlFor="aiModel">
                Modelo
              </label>
              {aiProv === "custom" ? (
                <input
                  type="text"
                  id="aiModel"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="p. ej. meta-llama/llama-3.3-70b-instruct"
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              ) : (
                <select
                  id="aiModel"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                >
                  {pv.models.map(([id, d]) => (
                    <option key={id} value={id}>
                      {id} · {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-fg block" htmlFor="aiKey">
                Clave API de {pv.n}
              </label>
              {connectedKey ? (
                <div className="flex items-center justify-between p-2.5 bg-panel2 border border-accent/40 rounded-lg">
                  <span className="text-xs font-semibold text-accent">
                    {connectedKey}
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnectKey}
                    className="text-xs px-2.5 py-1 rounded border border-line text-muted hover:text-danger hover:border-danger transition-colors"
                  >
                    Quitar clave
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    id="aiKey"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder={pv.ph}
                    autoComplete="off"
                    className="flex-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    disabled={testingAi || !aiKey.trim()}
                    onClick={handleConnectKey}
                    className="px-3.5 py-2 bg-accent text-on-accent text-xs font-bold font-display rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {testingAi ? "Guardando…" : "Conectar"}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>
                  Consíguela en{" "}
                  <a
                    href={pv.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline inline-flex items-center gap-0.5"
                  >
                    {pv.url} <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
                <button
                  type="button"
                  onClick={handleTestAiProbe}
                  disabled={testingAi}
                  className="text-accent hover:underline font-medium"
                >
                  Probar conexión
                </button>
              </div>
              {aiTestResult && (
                <p
                  className={`text-xs mt-1 font-medium ${
                    aiTestResult.ok ? "text-accent" : "text-danger"
                  }`}
                >
                  {aiTestResult.msg}
                </p>
              )}
            </div>

            <p className="text-[11px] text-muted border-t border-line/60 pt-3">
              En Wachato la clave se almacena cifrada en reposo con AES-256-GCM y nunca se expone en logs ni en la UI.
            </p>
          </div>
        )}

        {/* CARD 3: Agente Wachato (oculto si modo es externo puro) */}
        {profile.mode !== "externo" && (
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-fg">
                Personalidad y Reglas
              </h2>
              <Link
                href="/agent/training"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                Ir a Entrenar IA →
              </Link>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg" htmlFor="agName">
                Nombre del agente
              </label>
              <input
                type="text"
                id="agName"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                onBlur={() => void saveProfilePatch({ name: profile.name })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg" htmlFor="agTone">
                Tono
              </label>
              <input
                type="text"
                id="agTone"
                value={profile.tone ?? ""}
                placeholder="p. ej. cálido, profesional, de usted, cercano"
                onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                onBlur={() => void saveProfilePatch({ tone: profile.tone })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-fg block">
                Pasar a un humano cuando…
              </span>
              {[
                {
                  id: "persona" as const,
                  label: "El cliente pide hablar con una persona",
                },
                {
                  id: "queja" as const,
                  label: "Hay una queja o reclamo",
                },
                {
                  id: "medica" as const,
                  label: "Hay preguntas médicas (embarazo, alergias, medicamentos)",
                },
                {
                  id: "fuera" as const,
                  label: "Escriben fuera del horario laboral",
                },
              ].map((rule) => {
                const checked = !!profile.handoffRules?.[rule.id];
                return (
                  <label
                    key={rule.id}
                    className="flex items-center gap-2.5 text-xs text-fg cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = {
                          ...profile.handoffRules,
                          [rule.id]: e.target.checked,
                        };
                        void saveProfilePatch({ handoffRules: updated });
                      }}
                      className="accent-[#00C4C0] rounded"
                    />
                    <span>{rule.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* CARD 4: Agente externo (oculto si modo es wachato puro) */}
        {profile.mode !== "wachato" && (
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm md:col-span-2">
            <h2 className="text-base font-bold font-display text-fg">
              Agente externo
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Wachato despachará cada turno de conversación al webhook indicado. Si elegiste modo Mixto, Wachato responderá automáticamente si el webhook no responde en 10 segundos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg" htmlFor="hookUrl">
                  URL del webhook
                </label>
                <input
                  type="url"
                  id="hookUrl"
                  value={profile.externalWebhookUrl ?? ""}
                  placeholder="https://tu-servidor.com/webhook/wachato"
                  onChange={(e) =>
                    setProfile({ ...profile, externalWebhookUrl: e.target.value })
                  }
                  onBlur={() =>
                    void saveProfilePatch({
                      externalWebhookUrl: profile.externalWebhookUrl,
                    })
                  }
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg" htmlFor="hookKey">
                  Clave secreta (Header x-wachato-secret)
                </label>
                <input
                  type="password"
                  id="hookKey"
                  value={profile.externalSecret ?? ""}
                  placeholder="clave-segura-del-webhook"
                  onChange={(e) =>
                    setProfile({ ...profile, externalSecret: e.target.value })
                  }
                  onBlur={() =>
                    void saveProfilePatch({
                      externalSecret: profile.externalSecret,
                    })
                  }
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-fg">
                  Wachato envía cada mensaje así
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(samplePayload);
                    setCopiedPayload(true);
                    setTimeout(() => setCopiedPayload(false), 1500);
                  }}
                  className="text-xs text-muted hover:text-fg flex items-center gap-1"
                >
                  {copiedPayload ? (
                    <Check className="h-3 w-3 text-accent" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedPayload ? "Copiado" : "Copiar JSON"}
                </button>
              </div>
              <pre className="p-3 bg-panel2 border border-line rounded-lg text-xs font-mono text-muted overflow-x-auto">
                {samplePayload}
              </pre>
              <p className="text-xs text-muted">
                Tu agente responde con{" "}
                <code className="text-accent bg-panel2 px-1 rounded">
                  {'{"respuesta": "...", "mover_a": "cita"}'}
                </code>{" "}
                y Wachato lo publica en el canal correspondiente.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestHook}
                disabled={testingHook}
                className="px-4 py-2 bg-panel2 border border-line hover:border-accent text-fg text-xs font-bold font-display rounded-lg transition-colors"
              >
                {testingHook ? "Probando…" : "Probar conexión"}
              </button>
              {hookTested && (
                <span
                  className={`text-xs font-semibold ${
                    hookTested.startsWith("✓") ? "text-accent" : "text-danger"
                  }`}
                >
                  {hookTested}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
