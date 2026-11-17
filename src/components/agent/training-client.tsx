"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Globe,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
  Wand2,
} from "lucide-react";

type Service = {
  n: string;
  p: number;
};

type QaItem = {
  q: string;
  k: string;
  a: string;
};

type DocItem = {
  n: string;
  frag: number;
};

type BizData = {
  name: string;
  rubro: string;
  address: string;
  hours: string;
  faq: string;
  rules: string;
  tone: string;
  services: Service[];
  qa: QaItem[];
  docs: DocItem[];
};

type ChatMessage = {
  role: "ai" | "user";
  text: string;
  time: string;
  src?: string;
};

const DEFAULT_BIZ: BizData = {
  name: "Clínica Bella Piel",
  rubro: "Clínica de Estética y Dermatología",
  address: "Av. Abraham Lincoln 456, Piantini, Santo Domingo",
  hours: "Lunes a viernes 9:00 AM – 7:00 PM · Sábados 9:00 AM – 2:00 PM",
  faq: "Aceptamos efectivo, transferencias bancarias y tarjetas de crédito Visa y Mastercard.",
  rules: "Nunca diagnosticar afecciones cutáneas graves sin consulta médica previa.\nTratar al cliente siempre con respeto y cordialidad.\nOfrecer siempre agendamiento para valoración gratuita.",
  tone: "cálido, empático y profesional",
  services: [
    { n: "Limpieza facial profunda", p: 2500 },
    { n: "Botox (por zona)", p: 7500 },
    { n: "Ácido hialurónico (labios)", p: 12000 },
    { n: "Depilación láser (sesión)", p: 3500 },
  ],
  qa: [
    {
      q: "¿Duele el tratamiento de botox?",
      k: "duele, dolor, molestia, botox",
      a: "No duele; se aplica una crema anestésica tópica 15 minutos antes y se usan microagujas ultra finas que solo causan una ligera sensación de cosquilleo.",
    },
    {
      q: "¿Cuál es el precio del tratamiento láser?",
      k: "precio laser, costo laser, depilacion laser",
      a: "La sesión de depilación láser tiene un costo desde RD$ 3,500 por zona. Tenemos paquetes con descuento por varias sesiones.",
    },
    {
      q: "¿Dónde están ubicados?",
      k: "donde, ubicacion, direccion, como llegar",
      a: "Estamos ubicados en la Av. Abraham Lincoln 456, sector Piantini, Santo Domingo, con parqueo vigilado para clientes.",
    },
  ],
  docs: [
    { n: "Catalogo_Servicios_BellaPiel_2025.pdf", frag: 24 },
    { n: "Politicas_Cancelacion_Citas.docx", frag: 8 },
  ],
};

export function TrainingClient() {
  const [biz, setBiz] = useState<BizData>(DEFAULT_BIZ);
  const [agentName, setAgentName] = useState("Sofi");
  const [agentModel, setAgentModel] = useState("anthropic/claude-3.5-sonnet");
  const [webUrl, setWebUrl] = useState("https://bellapiel.do");
  const [readingWeb, setReadingWeb] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  // Chat Sandbox
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const calculateScore = useCallback(() => {
    const checks = [
      Boolean(biz.name.trim() && biz.address.trim() && biz.hours.trim()),
      biz.services.some((s) => s.n.trim() && s.p > 0),
      biz.qa.filter((q) => q.a.trim().length > 0).length >= 3,
      Boolean(biz.rules.trim()),
      biz.docs.length > 0,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [biz]);

  // Cargar estado desde backend
  useEffect(() => {
    async function loadData() {
      const [res, aiRes] = await Promise.all([
        fetch("/api/agent/profile").catch(() => null),
        fetch("/api/settings/ai").catch(() => null),
      ]);
      if (res?.ok) {
        const data = await res.json();
        if (data.profile?.name) setAgentName(data.profile.name);
        if (data.profile?.tone) setBiz((b) => ({ ...b, tone: data.profile.tone }));
        if (data.profile?.instructions) {
          setBiz((b) => ({ ...b, rules: data.profile.instructions }));
        }
        if (data.profile?.businessInfo) {
          const info = data.profile.businessInfo;
          setBiz((b) => ({
            ...b,
            rubro: info.rubro || b.rubro,
            address: info.address || b.address,
            hours: info.hours || b.hours,
            faq: info.faq || b.faq,
            services: info.services || b.services,
            docs: info.docs || b.docs,
          }));
        }
      }
      if (aiRes?.ok) {
        const aiData = await aiRes.json();
        if (aiData.credencial?.modelo) {
          setAgentModel(aiData.credencial.modelo);
        }
      }
    }
    void loadData();
  }, []);

  // Inicializar chat
  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `¡Hola! Soy ${agentName}, de ${biz.name}. ¿En qué te puedo ayudar hoy?`,
        time: new Date().toLocaleTimeString("es-DO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }, [agentName, biz.name]);

  async function persistChanges(updated: BizData) {
    setSaving(true);
    await fetch("/api/agent/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: agentName,
        tone: updated.tone,
        instructions: updated.rules,
        businessInfo: {
          rubro: updated.rubro,
          address: updated.address,
          hours: updated.hours,
          faq: updated.faq,
          services: updated.services,
          docs: updated.docs,
        },
      }),
    }).catch(() => null);
    setSaving(false);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }

  function handleBizChange<K extends keyof BizData>(key: K, value: BizData[K]) {
    const next = { ...biz, [key]: value };
    setBiz(next);
  }

  function handleSaveAll() {
    void persistChanges(biz);
  }

  // Simulación inteligente de respuesta
  function generateReply(text: string): { reply: string; src: string } {
    const t = text.toLowerCase();

    // 1. Q&A
    const foundQa = biz.qa.find((q) =>
      q.k
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .some((k) => t.includes(k))
    );
    if (foundQa && foundQa.a.trim()) {
      return { reply: foundQa.a, src: "Preguntas y respuestas" };
    }

    // 2. Precios / Servicios
    const svc = biz.services.find(
      (s) => s.n && t.includes(s.n.toLowerCase())
    );
    if (/precio|cu[aá]nto|cuesta|costo|vale/.test(t)) {
      if (svc) {
        return {
          reply: `${svc.n} tiene un valor de RD$ ${svc.p.toLocaleString()}. ¿Deseas agendar una cita de evaluación?`,
          src: "Servicios y precios",
        };
      }
      return {
        reply:
          "Nuestros precios son:\n" +
          biz.services
            .map((s) => `• ${s.n}: RD$ ${s.p.toLocaleString()}`)
            .join("\n") +
          "\n¿Cuál te interesa consultar?",
        src: "Servicios y precios",
      };
    }

    if (svc) {
      return {
        reply: `Excelente elección. ${svc.n} está en RD$ ${svc.p.toLocaleString()}. ¿Quieres que te busquemos un espacio disponible esta semana?`,
        src: "Servicios y precios",
      };
    }

    // 3. Ubicación y Dirección
    if (/d[oó]nde|ubica|direcci|llegar/.test(t)) {
      return {
        reply: `Estamos ubicados en ${biz.address}.`,
        src: "Información del negocio",
      };
    }

    // 4. Horarios
    if (/horario|hora|abren|cierran/.test(t)) {
      return {
        reply: `Nuestro horario de atención es: ${biz.hours}.`,
        src: "Información del negocio",
      };
    }

    // 5. Formas de pago
    if (/pago|tarjeta|transfer|efectivo/.test(t)) {
      return {
        reply: biz.faq,
        src: "Información del negocio",
      };
    }

    // 6. Promociones
    if (/promo|descuento|oferta/.test(t)) {
      return {
        reply:
          "Actualmente tenemos 15 % de descuento en paquetes de tratamiento facial y botox. ¿Te gustaría agendar tu cita?",
        src: "Instrucciones y límites",
      };
    }

    // 7. Citas
    if (/cita|agenda|disponib|turno/.test(t)) {
      return {
        reply:
          "Tenemos espacios disponibles este viernes a las 3:00 PM o sábado a las 11:00 AM. ¿Cuál te conviene más?",
        src: "Disponibilidad de agenda",
      };
    }

    return {
      reply: `¡Gracias por contactarnos! ¿En qué servicio o tratamiento te podemos orientar hoy? Tenemos ${biz.services
        .map((s) => s.n)
        .join(", ")}.`,
      src: "Servicios y precios",
    };
  }

  function handleSend(msgToSend?: string) {
    const text = (msgToSend ?? inputMsg).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      role: "user",
      text,
      time: new Date().toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = generateReply(text);
      const aiMsg: ChatMessage = {
        role: "ai",
        text: resp.reply,
        src: resp.src,
        time: new Date().toLocaleTimeString("es-DO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 500);
  }

  function handleResetChat() {
    setMessages([
      {
        role: "ai",
        text: `¡Hola! Soy ${agentName}, de ${biz.name}. ¿En qué te puedo ayudar hoy?`,
        time: new Date().toLocaleTimeString("es-DO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }

  function handleReadWeb() {
    if (!webUrl.trim()) return;
    setReadingWeb(true);
    setTimeout(() => {
      setReadingWeb(false);
      setBiz((prev) => ({
        ...prev,
        docs: [
          ...prev.docs,
          { n: `Sitio web (${new URL(webUrl).hostname})`, frag: 18 },
        ],
      }));
    }, 1200);
  }

  const score = calculateScore();

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Meter */}
      <div className="card p-5 bg-panel border border-line rounded-xl space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-fg flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-accent" />
              Así aprende {agentName}, tu agente de IA
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Lo que escribas o subas aquí es lo que la IA usa para responder en WhatsApp, Instagram y Messenger. Los cambios se aplican al instante.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedBadge && (
              <span className="text-xs font-semibold text-accent animate-fade-in">
                Guardado ✓
              </span>
            )}
            <b className="text-lg font-bold font-display text-accent">
              {score} % entrenado
            </b>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2 bg-accent text-on-accent text-xs font-bold font-display rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Progress Bar Meter */}
        <div className="w-full h-2 bg-panel2 rounded-full overflow-hidden border border-line">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 2-Columns Layout: Form on Left (5 blocks), Sticky Sandbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 5 Blocks */}
        <div className="lg:col-span-7 space-y-5">
          {/* BLOQUE 1: Información del negocio */}
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Paso 1
              </span>
              <h2 className="text-base font-bold font-display text-fg">
                Información del negocio
              </h2>
              <p className="text-xs text-muted">
                Lo básico que la IA debe saber para presentarse y orientar al cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Nombre</label>
                <input
                  type="text"
                  value={biz.name}
                  onChange={(e) => handleBizChange("name", e.target.value)}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Rubro</label>
                <input
                  type="text"
                  value={biz.rubro}
                  onChange={(e) => handleBizChange("rubro", e.target.value)}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-fg">Dirección</label>
              <input
                type="text"
                value={biz.address}
                onChange={(e) => handleBizChange("address", e.target.value)}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-fg">Horario</label>
              <input
                type="text"
                value={biz.hours}
                onChange={(e) => handleBizChange("hours", e.target.value)}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-fg">
                Formas de pago y políticas
              </label>
              <textarea
                rows={2}
                value={biz.faq}
                onChange={(e) => handleBizChange("faq", e.target.value)}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* BLOQUE 2: Servicios y precios */}
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Paso 2
                </span>
                <h2 className="text-base font-bold font-display text-fg">
                  Servicios y precios
                </h2>
                <p className="text-xs text-muted">
                  La IA cotiza con estos precios. Si cambias uno, responde con el nuevo al instante.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBiz((prev) => ({
                    ...prev,
                    services: [...prev.services, { n: "Nuevo servicio", p: 1000 }],
                  }))
                }
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Añadir servicio
              </button>
            </div>

            <div className="space-y-2">
              {biz.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={svc.n}
                    placeholder="Nombre del servicio"
                    onChange={(e) => {
                      const updated = [...biz.services];
                      if (updated[i]) {
                        updated[i].n = e.target.value;
                        setBiz({ ...biz, services: updated });
                      }
                    }}
                    className="flex-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs font-bold text-muted">RD$</span>
                  <input
                    type="number"
                    value={svc.p}
                    onChange={(e) => {
                      const updated = [...biz.services];
                      if (updated[i]) {
                        updated[i].p = Number(e.target.value);
                        setBiz({ ...biz, services: updated });
                      }
                    }}
                    className="w-28 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent text-right"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = biz.services.filter((_, idx) => idx !== i);
                      setBiz({ ...biz, services: updated });
                    }}
                    className="p-2 text-muted hover:text-danger rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE 3: Preguntas y respuestas */}
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Paso 3
                </span>
                <h2 className="text-base font-bold font-display text-fg">
                  Preguntas y respuestas
                </h2>
                <p className="text-xs text-muted">
                  Enséñale cómo responder las preguntas frecuentes con tus propias palabras.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBiz((prev) => ({
                    ...prev,
                    qa: [
                      ...prev.qa,
                      {
                        q: "¿Nueva pregunta?",
                        k: "palabra clave",
                        a: "Respuesta recomendada",
                      },
                    ],
                  }))
                }
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Añadir pregunta
              </button>
            </div>

            <div className="space-y-4">
              {biz.qa.map((qa, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-panel2/50 border border-line rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-fg">
                      Pregunta del cliente #{i + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = biz.qa.filter((_, idx) => idx !== i);
                        setBiz({ ...biz, qa: updated });
                      }}
                      className="text-xs text-muted hover:text-danger flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={qa.q}
                    onChange={(e) => {
                      const updated = [...biz.qa];
                      if (updated[i]) {
                        updated[i].q = e.target.value;
                        setBiz({ ...biz, qa: updated });
                      }
                    }}
                    className="w-full bg-panel border border-line rounded-lg px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
                  />
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">
                      Palabras clave, separadas por coma
                    </label>
                    <input
                      type="text"
                      value={qa.k}
                      onChange={(e) => {
                        const updated = [...biz.qa];
                        if (updated[i]) {
                          updated[i].k = e.target.value;
                          setBiz({ ...biz, qa: updated });
                        }
                      }}
                      className="w-full bg-panel border border-line rounded-lg px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted">Respuesta ideal</label>
                    <textarea
                      rows={2}
                      value={qa.a}
                      onChange={(e) => {
                        const updated = [...biz.qa];
                        if (updated[i]) {
                          updated[i].a = e.target.value;
                          setBiz({ ...biz, qa: updated });
                        }
                      }}
                      className="w-full bg-panel border border-line rounded-lg px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE 4: Instrucciones y límites */}
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Paso 4
              </span>
              <h2 className="text-base font-bold font-display text-fg">
                Instrucciones y límites
              </h2>
              <p className="text-xs text-muted">
                Qué debe hacer siempre y qué no debe decir nunca.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Instrucciones, una por línea
              </label>
              <textarea
                rows={4}
                value={biz.rules}
                onChange={(e) => handleBizChange("rules", e.target.value)}
                placeholder="Escribe las directivas de comportamiento…"
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Tono de voz</label>
              <input
                type="text"
                value={biz.tone}
                onChange={(e) => handleBizChange("tone", e.target.value)}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* BLOQUE 5: Documentos y sitio web */}
          <div className="card p-5 bg-panel border border-line rounded-xl space-y-4 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Paso 5
              </span>
              <h2 className="text-base font-bold font-display text-fg">
                Documentos y sitio web
              </h2>
              <p className="text-xs text-muted">
                Sube tu catálogo, menú, lista de precios o políticas. La IA los procesa y responde con esa información.
              </p>
            </div>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-line hover:border-accent/60 bg-panel2/50 rounded-xl p-5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
              <UploadCloud className="h-7 w-7 text-accent mb-1" />
              <b className="text-xs font-semibold text-fg">Elegir archivos</b>
              <span className="text-[11px] text-muted">
                PDF, Word, Excel o texto (máx 20 MB)
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) {
                    const newDocs = files.map((f) => ({
                      n: f.name,
                      frag: Math.floor(Math.random() * 20) + 5,
                    }));
                    setBiz((prev) => ({
                      ...prev,
                      docs: [...prev.docs, ...newDocs],
                    }));
                  }
                }}
              />
            </label>

            {/* Lista de Documentos */}
            <div className="space-y-2">
              {biz.docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-panel2 border border-line rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <span className="truncate font-medium text-fg">{doc.n}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full">
                      Procesado · {doc.frag} fragmentos
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = biz.docs.filter((_, idx) => idx !== i);
                        setBiz({ ...biz, docs: updated });
                      }}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* URL sitio web */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Globe className="h-4 w-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="https://tu-sitio-web.com"
                  className="w-full bg-panel2 border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-fg focus:outline-none focus:border-accent"
                />
              </div>
              <button
                type="button"
                disabled={readingWeb}
                onClick={handleReadWeb}
                className="px-3.5 py-2 bg-panel2 border border-line hover:border-accent text-fg text-xs font-bold font-display rounded-lg transition-colors whitespace-nowrap"
              >
                {readingWeb ? "Leyendo sitio…" : "Leer sitio web"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Sandbox de Prueba */}
        <div className="lg:col-span-5 sticky top-4">
          <div className="card bg-panel border border-line rounded-xl shadow-md overflow-hidden flex flex-col h-[680px]">
            {/* Header del Chat */}
            <div className="p-3.5 border-b border-line bg-panel2/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center font-bold font-display text-xs">
                  IA
                </div>
                <div>
                  <b className="text-xs font-bold text-fg block">
                    Prueba a {agentName}
                  </b>
                  <span className="text-[11px] text-muted block truncate max-w-[200px]">
                    {agentModel} · escribe como cliente
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-muted hover:text-fg rounded-md transition-colors"
                title="Reiniciar chat"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mensajes del Sandbox */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0D1920]/40">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#1E3542] text-fg rounded-tr-sm"
                        : "bg-[#173F4A] text-fg border border-accent/20 rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.src && (
                      <span className="mt-1.5 block text-[10px] text-accent font-semibold">
                        Fuente: {m.src}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted px-1 mt-0.5">
                    {m.time}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-muted text-xs p-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse delay-300" />
                  <span className="text-[11px] ml-1">Escribiendo respuesta…</span>
                </div>
              )}
            </div>

            {/* Chips de Prueba Rápida */}
            <div className="p-2 border-t border-line/60 bg-panel2/30 flex items-center gap-1.5 overflow-x-auto">
              {[
                "¿Duele el botox?",
                "Precio del láser",
                "¿Tienen promociones?",
                "¿Dónde están?",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-panel2 border border-line text-[11px] text-muted hover:text-accent hover:border-accent transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Formulario de Entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 border-t border-line bg-panel2/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Escribe un mensaje de prueba…"
                className="flex-1 bg-panel border border-line rounded-lg px-3 py-2 text-xs text-fg focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isTyping}
                className="p-2 bg-accent text-on-accent rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
