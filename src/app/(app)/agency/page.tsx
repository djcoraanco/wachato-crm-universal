"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Layers,
  LogIn,
  Palette,
  Plus,
  Save,
  Sparkles,
  Users,
} from "lucide-react";
import type { AgencyRecord } from "@/server/agency/service";

interface ClientOrg {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
}

interface AgencyDataResponse {
  ok: boolean;
  agency: AgencyRecord | null;
  clients: ClientOrg[];
  canCreateAgency: boolean;
  plan?: string;
}

export default function AgencyPage() {
  const [data, setData] = useState<AgencyDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "branding" | "team">("clients");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form para crear agencia
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencySlug, setNewAgencySlug] = useState("");
  const [newAgencySubdomain, setNewAgencySubdomain] = useState("");

  // Form para crear cliente
  const [newClientName, setNewClientName] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Branding form
  const [brandingForm, setBrandingForm] = useState({
    brandName: "",
    primaryColor: "#00C4C0",
    accentColor: "#00E5E0",
    customDomain: "",
    logoUrl: "",
  });

  const loadAgencyData = async () => {
    try {
      const res = await fetch("/api/agency");
      const json = (await res.json()) as AgencyDataResponse;
      if (json.ok) {
        setData(json);
        if (json.agency?.branding) {
          setBrandingForm({
            brandName: json.agency.branding.brandName ?? json.agency.name,
            primaryColor: json.agency.branding.primaryColor ?? "#00C4C0",
            accentColor: json.agency.branding.accentColor ?? "#00E5E0",
            customDomain: json.agency.customDomain ?? "",
            logoUrl: json.agency.branding.logoUrl ?? "",
          });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Error cargando información de la agencia" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencyData();
  }, []);

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create_agency");
    setMessage(null);

    try {
      const res = await fetch("/api/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgencyName,
          slug: newAgencySlug,
          subdomain: newAgencySubdomain || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setMessage({ type: "success", text: "¡Agencia creada exitosamente!" });
        await loadAgencyData();
      } else {
        setMessage({ type: "error", text: json.message || "Error al crear la agencia" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de red al crear la agencia" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setActionLoading("create_client");
    setMessage(null);

    try {
      const res = await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setMessage({ type: "success", text: `Subcuenta '${newClientName}' creada con éxito.` });
        setNewClientName("");
        setShowNewClientModal(false);
        await loadAgencyData();
      } else {
        setMessage({ type: "error", text: json.message || "Error al crear la subcuenta" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de red al crear la subcuenta" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSwitchOrganization = async (orgId: string, orgName: string) => {
    setActionLoading(`switch_${orgId}`);
    try {
      const res = await fetch("/api/agency/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Cambiando al contexto de '${orgName}'... Redirigiendo a la bandeja.`,
        });
        setTimeout(() => {
          window.location.href = "/inbox";
        }, 600);
      }
    } catch {
      setMessage({ type: "error", text: "Error al cambiar de subcuenta" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveBranding = async () => {
    if (!data?.agency) return;
    setActionLoading("save_branding");
    setMessage(null);

    try {
      const res = await fetch("/api/agency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: data.agency.id,
          brandName: brandingForm.brandName,
          primaryColor: brandingForm.primaryColor,
          accentColor: brandingForm.accentColor,
          logoUrl: brandingForm.logoUrl || undefined,
          customDomain: brandingForm.customDomain || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setMessage({ type: "success", text: "Marca blanca actualizada correctamente." });
        await loadAgencyData();
      } else {
        setMessage({ type: "error", text: json.message || "Error al guardar marca blanca" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de red al guardar marca blanca" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Cargando panel de agencia...</span>
        </div>
      </div>
    );
  }

  // Si no tiene agencia y su plan NO permite crearla
  if (!data?.agency && !data?.canCreateAgency) {
    return (
      <div className="max-w-4xl mx-auto p-8 rounded-2xl border bg-card text-center space-y-6 my-10">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="max-w-lg mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Panel Agency Partner & Marca Blanca</h2>
          <p className="text-sm text-text-2">
            El módulo de agencia te permite revender el CRM con tu propio logo, colores corporativos,
            subdominios personalizados y gestionar clientes ilimitados desde un único panel centralizado.
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-accent/40 max-w-md mx-auto text-xs text-text-2">
          Esta característica está reservada para suscriptores del <strong>Plan Agency Partner</strong>.
        </div>

        <div>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-brand-text font-bold text-sm shadow-md hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Actualizar a Plan Agency Partner
          </Link>
        </div>
      </div>
    );
  }

  // Si no tiene agencia pero su plan SÍ lo permite: mostrar formulario de bienvenida
  if (!data?.agency && data?.canCreateAgency) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl border bg-card space-y-6 my-8">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Activar tu Agencia Partner</h2>
            <p className="text-xs text-text-2">
              Configura los datos base de tu agencia para comenzar a desplegar clientes.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateAgency} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Nombre de la Agencia</label>
            <input
              type="text"
              required
              value={newAgencyName}
              onChange={(e) => {
                setNewAgencyName(e.target.value);
                if (!newAgencySlug) {
                  setNewAgencySlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-")
                  );
                }
              }}
              placeholder="Ej: Scale Marketing Digital"
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Identificador Slug</label>
            <input
              type="text"
              required
              value={newAgencySlug}
              onChange={(e) => setNewAgencySlug(e.target.value.toLowerCase())}
              placeholder="ej: scalemarketing"
              className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-2">Subdominio deseado</label>
            <div className="flex items-center">
              <input
                type="text"
                value={newAgencySubdomain}
                onChange={(e) => setNewAgencySubdomain(e.target.value.toLowerCase())}
                placeholder="scalemarketing"
                className="w-full text-sm px-3 py-2 rounded-l-lg border bg-background text-foreground font-mono"
              />
              <span className="px-3 py-2 text-xs border border-l-0 rounded-r-lg bg-accent text-text-2 font-mono">
                .dominio.com
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading === "create_agency"}
            className="w-full py-2.5 rounded-lg bg-brand text-brand-text font-bold text-sm shadow hover:opacity-90 transition-all disabled:opacity-50"
          >
            {actionLoading === "create_agency" ? "Creando Agencia..." : "Activar Mi Agencia"}
          </button>
        </form>
      </div>
    );
  }

  const agency = data!.agency!;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-brand" />
              {agency.name}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30">
              Agency Partner
            </span>
          </div>
          <p className="text-sm text-text-2 mt-1">
            Administra tus subcuentas de clientes, marca blanca, subdominios y roles de equipo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewClientModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-brand-text font-bold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Subcuenta Cliente
        </button>
      </div>

      {/* Feedback Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border shadow-sm ${
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

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="text-xs font-semibold text-text-2 uppercase tracking-wider">
            Clientes Activos
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data!.clients.length} subcuentas
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="text-xs font-semibold text-text-2 uppercase tracking-wider">
            Subdominio Oficial
          </div>
          <div className="text-sm font-mono text-brand truncate">
            {agency.subdomain ? `${agency.subdomain}.dominio.com` : "No asignado"}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="text-xs font-semibold text-text-2 uppercase tracking-wider">
            Marca Blanca
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: brandingForm.primaryColor }} />
            <span className="text-sm font-semibold text-foreground">
              {brandingForm.brandName || agency.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b text-xs font-semibold text-text-2">
        <button
          type="button"
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === "clients" ? "border-b-2 border-brand text-brand font-bold" : "hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Clientes & Subcuentas ({data!.clients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === "branding" ? "border-b-2 border-brand text-brand font-bold" : "hover:text-foreground"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Marca Blanca & Dominios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === "team" ? "border-b-2 border-brand text-brand font-bold" : "hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipo de Agencia</span>
        </button>
      </div>

      {/* Tab 1: Clientes */}
      {activeTab === "clients" && (
        <div className="space-y-4">
          {data!.clients.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-card/50 space-y-3">
              <Building2 className="w-10 h-10 text-text-2 mx-auto" />
              <div className="text-sm font-semibold text-foreground">Aún no tienes subcuentas de clientes</div>
              <p className="text-xs text-text-2 max-w-sm mx-auto">
                Crea tu primera organización cliente para aprovisionar un CRM independiente con su propio WhatsApp y pipeline.
              </p>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-brand-text font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Primer Cliente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data!.clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-2xl border bg-card p-5 space-y-4 flex flex-col justify-between hover:border-brand/40 transition-all shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-foreground">{client.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-text-2">
                        {client.slug}
                      </span>
                    </div>
                    <div className="text-xs text-text-2">
                      ID: <span className="font-mono text-[11px]">{client.id}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between">
                    <span className="text-[11px] text-text-2">
                      Creado: {new Date(client.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSwitchOrganization(client.id, client.name)}
                      disabled={actionLoading === `switch_${client.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent hover:bg-brand hover:text-brand-text transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{actionLoading === `switch_${client.id}` ? "Entrando..." : "Gestionar"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Marca Blanca */}
      {activeTab === "branding" && (
        <div className="rounded-2xl border bg-card p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-foreground">Personalización de Marca Blanca</h3>
            <p className="text-xs text-text-2 mt-0.5">
              Tus clientes verán este nombre, logotipo y colores en la barra lateral y en sus pantallas.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">Nombre Comercial</label>
              <input
                type="text"
                value={brandingForm.brandName}
                onChange={(e) => setBrandingForm({ ...brandingForm, brandName: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-2">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-2">Color de Acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.accentColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandingForm.accentColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-2">URL del Logotipo (PNG / SVG)</label>
              <input
                type="text"
                value={brandingForm.logoUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                placeholder="https://tuagencia.com/logo.png"
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-xs font-semibold text-text-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand" />
                Dominio Personalizado (CNAME)
              </label>
              <input
                type="text"
                value={brandingForm.customDomain}
                onChange={(e) => setBrandingForm({ ...brandingForm, customDomain: e.target.value })}
                placeholder="crm.tuagencia.com"
                className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground font-mono"
              />
              <p className="text-[11px] text-text-2">
                Apunta un registro CNAME en tu DNS hacia el host de tu servidor CRM.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={actionLoading === "save_branding"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-text font-bold text-xs shadow-md hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{actionLoading === "save_branding" ? "Guardando..." : "Guardar Marca Blanca"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Equipo */}
      {activeTab === "team" && (
        <div className="rounded-2xl border bg-card p-6 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Miembros de la Agencia</h3>
              <p className="text-xs text-text-2">
                Usuarios con permisos para supervisar y cambiar de contexto entre las subcuentas de clientes.
              </p>
            </div>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center text-xs">
                  YO
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Propietario de la Agencia</div>
                  <div className="text-xs text-text-2">Acceso total a todas las subcuentas</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Agency Owner
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Subcuenta */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                Nueva Subcuenta Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-text-2 hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-2">Nombre de la Empresa / Negocio</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Clínica Dental San Lucas"
                  className="w-full text-sm px-3 py-2 rounded-lg border bg-background text-foreground"
                />
              </div>

              <div className="p-3 rounded-lg bg-accent/40 text-[11px] text-text-2 leading-relaxed">
                Esta subcuenta se creará con su propio pipeline de ventas, bandeja de mensajes independiente y perfil de IA listo para vincularse a su número de WhatsApp.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-text-2 hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create_client"}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-brand text-brand-text shadow hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {actionLoading === "create_client" ? "Creando..." : "Crear Subcuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
