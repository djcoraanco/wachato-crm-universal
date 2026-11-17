"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Zap,
  DollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type AdminSaaSMetrics, type AdminOrganizationItem } from "@/server/admin/service";

interface RecentSubscription {
  id: string;
  organizationId: string | null;
  agencyId: string | null;
  planName: string;
  planSlug: string;
  provider: string;
  providerSubscriptionId: string | null;
  status: string;
  billingInterval: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [metrics, setMetrics] = useState<AdminSaaSMetrics | null>(null);
  const [organizations, setOrganizations] = useState<AdminOrganizationItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<RecentSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"orgs" | "subs" | "gateways">("orgs");
  const [error, setError] = useState<string | null>(null);

  // Modal para cambiar plan
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganizationItem | null>(null);
  const [targetPlanSlug, setTargetPlanSlug] = useState("pro");
  const [targetInterval, setTargetInterval] = useState<"monthly" | "yearly">("monthly");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  // Modal para crear organización / empresa
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("pro");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, oRes, sRes] = await Promise.all([
        fetch("/api/admin/metrics").then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/admin/organizations${search ? `?search=${encodeURIComponent(search)}` : ""}`).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch("/api/admin/subscriptions").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (mRes?.metrics) setMetrics(mRes.metrics);
      if (oRes?.organizations) setOrganizations(oRes.organizations);
      if (sRes?.subscriptions) setSubscriptions(sRes.subscriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando panel de administración");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleUpdatePlan() {
    if (!selectedOrg) return;
    setUpdatingPlan(true);
    setPlanSuccess(null);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrg.id}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: targetPlanSlug,
          billingInterval: targetInterval,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "No se pudo actualizar el plan");

      setPlanSuccess(`Plan de "${selectedOrg.name}" actualizado a ${targetPlanSlug.toUpperCase()}`);
      setTimeout(() => {
        setSelectedOrg(null);
        setPlanSuccess(null);
        void fetchData();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar plan");
    } finally {
      setUpdatingPlan(false);
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    setCreateOrgError(null);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName.trim(),
          slug: newOrgSlug.trim() || undefined,
          planSlug: newOrgPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al crear la empresa");

      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgPlan("pro");
      setShowCreateOrgModal(false);
      void fetchData();
    } catch (err) {
      setCreateOrgError(err instanceof Error ? err.message : "Error al crear la empresa");
    } finally {
      setCreatingOrg(false);
    }
  }

  async function handleSwitchOrg(orgId: string) {
    try {
      const res = await fetch("/api/agency/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetOrgId: orgId }),
      });
      if (res.ok) {
        window.location.href = "/inbox";
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="h-6 w-6" />
            </span>
            Centro de Control Super Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión global del SaaS: métricas de ingresos, organizaciones, cuotas y pasarelas de pago.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Actualizar Datos
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR / ARR */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">MRR Estimado</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              ${(metrics?.mrrUsd ?? 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">USD/mes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>ARR: <strong>${(metrics?.arrUsd ?? 0).toLocaleString()} USD/año</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Organizaciones */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Organizaciones</span>
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {metrics?.totalOrganizations ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {metrics?.subscriptionsByTier.pro ?? 0} Pro · {metrics?.subscriptionsByTier.agency ?? 0} Agency Scale
            </div>
          </CardContent>
        </Card>

        {/* Usuarios Registrados */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Usuarios Totales</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {metrics?.totalUsers ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {metrics?.totalContacts.toLocaleString() ?? 0} contactos registrados
            </div>
          </CardContent>
        </Card>

        {/* Tokens IA */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tokens IA (Ciclo)</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {Math.round((metrics?.totalAiTokensMonthly ?? 0) / 1000)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Consumo de agentes este mes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("orgs")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "orgs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Organizaciones & Clientes ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab("subs")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "subs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Suscripciones & Pasarelas ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab("gateways")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "gateways"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Estado de Pasarelas
        </button>
      </div>

      {/* Tab 1: Organizaciones */}
      {activeTab === "orgs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de negocio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Button
              onClick={() => {
                setCreateOrgError(null);
                setShowCreateOrgModal(true);
              }}
              className="bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Nueva Empresa
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Organización</th>
                    <th className="p-3.5">Dueño</th>
                    <th className="p-3.5">Plan Actual</th>
                    <th className="p-3.5">Contactos</th>
                    <th className="p-3.5">Tokens IA</th>
                    <th className="p-3.5">Agencia Nodriza</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-medium">
                        <div>{org.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{org.slug}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-foreground">{org.ownerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{org.ownerEmail || "—"}</div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={
                            org.planTier === "agency"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              : org.planTier === "pro"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : org.planTier === "growth"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {org.planName}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-xs text-foreground font-medium">
                        {org.contactsCount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-xs text-foreground font-medium">
                        {Math.round(org.aiTokensCount / 1000)}k
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground">
                        {org.agencyName ? (
                          <span className="font-medium text-foreground">{org.agencyName}</span>
                        ) : (
                          "Directo"
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrg(org);
                            setTargetPlanSlug(org.planSlug);
                          }}
                        >
                          Cambiar Plan
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSwitchOrg(org.id)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Entrar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                        No se encontraron organizaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Suscripciones */}
      {activeTab === "subs" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="p-3.5">ID Suscripción</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Pasarela</th>
                  <th className="p-3.5">Intervalo</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Fecha Inicio</th>
                  <th className="p-3.5">Próximo Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-mono text-xs">{sub.providerSubscriptionId || sub.id}</td>
                    <td className="p-3.5 font-medium">{sub.planName}</td>
                    <td className="p-3.5 capitalize">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                        {sub.provider}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground capitalize">{sub.billingInterval}</td>
                    <td className="p-3.5">
                      <Badge variant={sub.status === "active" ? "default" : "destructive"}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                      No hay suscripciones registradas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Gateways Status */}
      {activeTab === "gateways" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stripe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-500" /> Stripe Checkout
                </CardTitle>
                <Badge variant={metrics?.gatewaysStatus.stripeConfigured ? "default" : "destructive"}>
                  {metrics?.gatewaysStatus.stripeConfigured ? "Activo" : "Faltan Llaves"}
                </Badge>
              </div>
              <CardDescription>
                Cobros automatizados con tarjeta de crédito/débito y suscripciones recurrentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>Variables: <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code></p>
            </CardContent>
          </Card>

          {/* PayPal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" /> PayPal Subscriptions
                </CardTitle>
                <Badge variant={metrics?.gatewaysStatus.paypalConfigured ? "default" : "destructive"}>
                  {metrics?.gatewaysStatus.paypalConfigured ? "Activo" : "Faltan Llaves"}
                </Badge>
              </div>
              <CardDescription>
                Suscripciones automatizadas y pagos internacionales por PayPal.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>Variables: <code>PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_SECRET</code></p>
            </CardContent>
          </Card>

          {/* Meta 1-Click Connect */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-500" /> Meta 1-Click Connect
                </CardTitle>
                <Badge variant={metrics?.gatewaysStatus.metaAppConfigured ? "default" : "destructive"}>
                  {metrics?.gatewaysStatus.metaAppConfigured ? "Activo" : "Faltan Llaves"}
                </Badge>
              </div>
              <CardDescription>
                Conexión en 1 clic de WhatsApp Embedded Signup, Instagram y Messenger.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>Variables: <code>META_APP_ID</code>, <code>META_APP_SECRET</code></p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para Cambiar Plan Administrativamente */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Cambiar Plan de Organización</h3>
            <p className="text-xs text-muted-foreground">
              Asigna o modifica el plan para <strong>{selectedOrg.name}</strong> directamente desde el Super Admin sin requerir pago inmediato.
            </p>

            {planSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{planSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Seleccionar Nuevo Plan</label>
                <select
                  value={targetPlanSlug}
                  onChange={(e) => setTargetPlanSlug(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm font-medium"
                >
                  <option value="starter">Starter Free (1 Canal, 500 Contactos)</option>
                  <option value="growth">Growth ($29/mes - Omnicanal, 2,500 Contactos)</option>
                  <option value="pro">Pro ($79/mes - IA Avanzada, 10,000 Contactos)</option>
                  <option value="agency-scale">Agency Scale ($199/mes - Marca Blanca, Ilimitado)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">Ciclo de Facturación</label>
                <select
                  value={targetInterval}
                  onChange={(e) => setTargetInterval(e.target.value as "monthly" | "yearly")}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm font-medium"
                >
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrg(null)}
                disabled={updatingPlan}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleUpdatePlan}
                disabled={updatingPlan}
              >
                {updatingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar y Aplicar Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Organización / Empresa */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Crear Nueva Empresa / Cliente
            </h3>
            <p className="text-xs text-muted-foreground">
              Aprovisiona una nueva organización en la plataforma con su propio pipeline, agentes y plan activo de inmediato.
            </p>

            {createOrgError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{createOrgError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Nombre del Negocio / Empresa *</label>
                <Input
                  required
                  placeholder="Ej: Clínica Dental San Lucas"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="mt-1 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Slug Identificador (opcional)</label>
                <Input
                  placeholder="ej: clinica-san-lucas"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="mt-1 text-sm font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  Se generará automáticamente si lo dejas en blanco.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Plan Inicial Asignado</label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm font-medium"
                >
                  <option value="pro">Plan Pro (Recomendado - 10k contactos, multicanal)</option>
                  <option value="starter">Plan Starter (1 canal, 1k contactos)</option>
                  <option value="business">Plan Business (50k contactos, multi-pipeline)</option>
                  <option value="agency-scale">Plan Agency Partner (Marca Blanca)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateOrgModal(false)}
                  disabled={creatingOrg}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingOrg || !newOrgName.trim()}
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  {creatingOrg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Crear y Activar Empresa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
