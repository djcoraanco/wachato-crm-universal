"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe,
  HelpCircle,
  Layers,
  MessageSquare,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { LandingContentPayload } from "@/server/landing/service";

export default function LandingSettingsPage() {
  const [content, setContent] = useState<LandingContentPayload | null>(null);
  const [activeTab, setActiveTab] = useState<
    "hero" | "features" | "pricing" | "faq" | "testimonials" | "seo"
  >("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    async function loadLanding() {
      try {
        const res = await fetch("/api/landing");
        const json = await res.json();
        if (json.ok && json.content) {
          setContent(json.content);
        }
      } catch {
        setMessage({
          type: "error",
          text: "No se pudo cargar la configuración de la landing page.",
        });
      } finally {
        setLoading(false);
      }
    }
    loadLanding();
  }, []);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setContent(json.content);
        setMessage({
          type: "success",
          text: "¡La landing page se actualizó y publicó correctamente!",
        });
      } else {
        setMessage({
          type: "error",
          text: json.message || "Error al guardar los cambios de la landing.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Error de red al intentar guardar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Cargando configuración de la landing page...</span>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
        Error al cargar la información. Recarga la página.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div>
          <h3 className="text-xl font-bold tracking-tight">CMS & Landing Page Pública</h3>
          <p className="text-sm text-text-2 mt-1">
            Edita los textos, propuesta de valor, precios y testimonios visibles en la página principal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Previsualizar</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-brand-text hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-lg text-sm flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs de Secciones */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b text-xs font-semibold text-text-2">
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "hero" ? "bg-accent text-foreground font-bold" : "hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hero & Cabecera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("features")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "features" ? "bg-accent text-foreground font-bold" : "hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Características ({content.features.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "pricing" ? "bg-accent text-foreground font-bold" : "hover:text-foreground"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Precios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("faq")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "faq" ? "bg-accent text-foreground font-bold" : "hover:text-foreground"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ ({content.faq.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "testimonials"
              ? "bg-accent text-foreground font-bold"
              : "hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Testimonios ({content.testimonials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "seo" ? "bg-accent text-foreground font-bold" : "hover:text-foreground"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Tema & SEO</span>
        </button>
      </div>

      {/* Tab: HERO */}
      {activeTab === "hero" && (
        <div className="space-y-4 rounded-xl border p-5 bg-card">
          <h4 className="text-sm font-bold text-foreground">Encabezado Principal (Hero)</h4>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Badge Superior</label>
            <input
              type="text"
              value={content.hero.badge ?? ""}
              onChange={(e) =>
                setContent({ ...content, hero: { ...content.hero, badge: e.target.value } })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
              placeholder="Ej: CRM Universal de WhatsApp & IA para Negocios"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Título Principal (H1)</label>
            <input
              type="text"
              value={content.hero.title}
              onChange={(e) =>
                setContent({ ...content, hero: { ...content.hero, title: e.target.value } })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-semibold"
              placeholder="Título llamativo con valor claro"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Subtítulo Descriptivo</label>
            <textarea
              rows={3}
              value={content.hero.subtitle}
              onChange={(e) =>
                setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
              placeholder="Explica qué hace tu plataforma y para quién es"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Texto Botón Primario (CTA)</label>
              <input
                type="text"
                value={content.hero.ctaText}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
                placeholder="Ej: Comenzar Ahora"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Enlace Botón Primario</label>
              <input
                type="text"
                value={content.hero.ctaLink}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, ctaLink: e.target.value } })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
                placeholder="Ej: /register"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Texto Botón Secundario</label>
              <input
                type="text"
                value={content.hero.secondaryCtaText ?? ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, secondaryCtaText: e.target.value },
                  })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
                placeholder="Ej: Ver Planes y Precios"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Enlace Botón Secundario</label>
              <input
                type="text"
                value={content.hero.secondaryCtaLink ?? ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, secondaryCtaLink: e.target.value },
                  })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
                placeholder="Ej: #pricing"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: FEATURES */}
      {activeTab === "features" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Tarjetas de Características</h4>
            <span className="text-xs text-text-2">{content.features.length} módulos</span>
          </div>

          <div className="space-y-4">
            {content.features.map((feat, index) => (
              <div key={index} className="p-4 rounded-xl border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-brand uppercase tracking-wider">
                    Característica #{index + 1}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Título</label>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => {
                        const updated = [...content.features];
                        const item = updated[index];
                        if (item) {
                          item.title = e.target.value;
                          setContent({ ...content, features: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Badge</label>
                    <input
                      type="text"
                      value={feat.badge ?? ""}
                      onChange={(e) => {
                        const updated = [...content.features];
                        const item = updated[index];
                        if (item) {
                          item.badge = e.target.value;
                          setContent({ ...content, features: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                      placeholder="Ej: Meta Oficial"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Ícono Lucide</label>
                    <input
                      type="text"
                      value={feat.icon}
                      onChange={(e) => {
                        const updated = [...content.features];
                        const item = updated[index];
                        if (item) {
                          item.icon = e.target.value;
                          setContent({ ...content, features: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-2">Descripción</label>
                  <textarea
                    rows={2}
                    value={feat.description}
                    onChange={(e) => {
                      const updated = [...content.features];
                      const item = updated[index];
                      if (item) {
                        item.description = e.target.value;
                        setContent({ ...content, features: updated });
                      }
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: PRICING */}
      {activeTab === "pricing" && (
        <div className="space-y-4 rounded-xl border p-5 bg-card">
          <h4 className="text-sm font-bold text-foreground">Configuración de la Sección de Precios</h4>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Título de Precios</label>
            <input
              type="text"
              value={content.pricing.headline}
              onChange={(e) =>
                setContent({
                  ...content,
                  pricing: { ...content.pricing, headline: e.target.value },
                })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Subtítulo</label>
            <input
              type="text"
              value={content.pricing.subheadline}
              onChange={(e) =>
                setContent({
                  ...content,
                  pricing: { ...content.pricing, subheadline: e.target.value },
                })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Plan Destacado (Slug)</label>
              <input
                type="text"
                value={content.pricing.highlightedPlanSlug ?? "pro"}
                onChange={(e) =>
                  setContent({
                    ...content,
                    pricing: { ...content.pricing, highlightedPlanSlug: e.target.value },
                  })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                placeholder="pro"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">% Descuento Anual (Badge)</label>
              <input
                type="number"
                value={content.pricing.yearlyDiscountPercent ?? 17}
                onChange={(e) =>
                  setContent({
                    ...content,
                    pricing: {
                      ...content.pricing,
                      yearlyDiscountPercent: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                placeholder="17"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Preguntas Frecuentes</h4>
            <button
              type="button"
              onClick={() => {
                setContent({
                  ...content,
                  faq: [
                    ...content.faq,
                    {
                      question: "¿Nueva pregunta de ejemplo?",
                      answer: "Respuesta clara y precisa para tus clientes.",
                    },
                  ],
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-accent hover:bg-accent/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Pregunta</span>
            </button>
          </div>

          <div className="space-y-3">
            {content.faq.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-card space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">Pregunta #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = content.faq.filter((_, i) => i !== idx);
                      setContent({ ...content, faq: updated });
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => {
                    const updated = [...content.faq];
                    const q = updated[idx];
                    if (q) {
                      q.question = e.target.value;
                      setContent({ ...content, faq: updated });
                    }
                  }}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                  placeholder="Pregunta"
                />

                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...content.faq];
                    const q = updated[idx];
                    if (q) {
                      q.answer = e.target.value;
                      setContent({ ...content, faq: updated });
                    }
                  }}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                  placeholder="Respuesta"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: TESTIMONIALS */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Testimonios de Clientes</h4>
          </div>

          <div className="space-y-4">
            {content.testimonials.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-card space-y-3">
                <div className="text-xs font-bold text-brand">Testimonio #{idx + 1}</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Nombre</label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const updated = [...content.testimonials];
                        const item = updated[idx];
                        if (item) {
                          item.name = e.target.value;
                          setContent({ ...content, testimonials: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Cargo</label>
                    <input
                      type="text"
                      value={t.role}
                      onChange={(e) => {
                        const updated = [...content.testimonials];
                        const item = updated[idx];
                        if (item) {
                          item.role = e.target.value;
                          setContent({ ...content, testimonials: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-2">Empresa</label>
                    <input
                      type="text"
                      value={t.company ?? ""}
                      onChange={(e) => {
                        const updated = [...content.testimonials];
                        const item = updated[idx];
                        if (item) {
                          item.company = e.target.value;
                          setContent({ ...content, testimonials: updated });
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-2">Cita / Opinión</label>
                  <textarea
                    rows={2}
                    value={t.quote}
                    onChange={(e) => {
                      const updated = [...content.testimonials];
                      const item = updated[idx];
                      if (item) {
                        item.quote = e.target.value;
                        setContent({ ...content, testimonials: updated });
                      }
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: SEO & TEMA */}
      {activeTab === "seo" && (
        <div className="space-y-4 rounded-xl border p-5 bg-card">
          <h4 className="text-sm font-bold text-foreground">Configuración SEO & Colores</h4>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Título de la Página (Meta Title)</label>
            <input
              type="text"
              value={content.seo.metaTitle}
              onChange={(e) =>
                setContent({
                  ...content,
                  seo: { ...content.seo, metaTitle: e.target.value },
                })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">
              Descripción para Motores de Búsqueda (Meta Description)
            </label>
            <textarea
              rows={3}
              value={content.seo.metaDescription}
              onChange={(e) =>
                setContent({
                  ...content,
                  seo: { ...content.seo, metaDescription: e.target.value },
                })
              }
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Color Primario (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.theme.primaryColor}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      theme: { ...content.theme, primaryColor: e.target.value },
                    })
                  }
                  className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={content.theme.primaryColor}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      theme: { ...content.theme, primaryColor: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Color de Acento (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.theme.accentColor}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      theme: { ...content.theme, accentColor: e.target.value },
                    })
                  }
                  className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={content.theme.accentColor}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      theme: { ...content.theme, accentColor: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
