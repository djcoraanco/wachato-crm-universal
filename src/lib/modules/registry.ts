import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import type { InstalledModuleDto, ModuleManifest } from "./types";

/**
 * Catálogo maestro de Hard Modules precompilados en Wachato CRM Universal.
 */
export const OFFICIAL_MODULES: ModuleManifest[] = [
  {
    id: "restaurantes",
    name: "Restaurantes y Gastronomía",
    category: "restaurantes",
    version: "1.0.0",
    description: "Toma de pedidos por WhatsApp, reserva de mesas en tiempo real, menú digital con alérgenos y cálculo de propinas.",
    author: "Wachato Core Team",
    icon: "UtensilsCrossed",
    official: true,
    navigationItems: [
      { label: "Menú y Carta", href: "/modules/restaurantes/menu", icon: "UtensilsCrossed" },
      { label: "Mesas y Reservas", href: "/modules/restaurantes/mesas", icon: "Calendar" },
      { label: "Comandas", href: "/modules/restaurantes/comandas", icon: "ClipboardList" },
    ],
    tools: [
      {
        name: "consultar_menu",
        description: "Consulta los platos disponibles, precios e ingredientes del menú.",
        parameters: { type: "object", properties: { categoria: { type: "string" } } },
      },
      {
        name: "crear_reserva_mesa",
        description: "Reserva una mesa para comensales en fecha y hora específica.",
        parameters: {
          type: "object",
          required: ["personas", "fecha", "hora"],
          properties: {
            personas: { type: "number" },
            fecha: { type: "string" },
            hora: { type: "string" },
          },
        },
      },
    ],
    pipelineTemplate: {
      name: "Pipeline Gastronómico",
      stages: [
        { name: "Consulta Menú", capiEvent: "Lead" },
        { name: "Reserva Solicitada", capiEvent: "Schedule" },
        { name: "Mesa Confirmada", capiEvent: "Schedule" },
        { name: "Comensal en Restaurante", capiEvent: "Purchase" },
      ],
    },
    systemPromptEnhancement: "Eres un maître y asesor gastronómico amable. Conoces el menú, recomiendas maridajes y confirmas reservas de mesa con cortesía.",
  },
  {
    id: "clinicas",
    name: "Clínicas Médicas y Salud",
    category: "clinicas",
    version: "1.0.0",
    description: "Agendamiento con especialistas, triaje preliminar no diagnóstico, confirmación de seguro médico y recordatorios de consulta.",
    author: "Wachato Core Team",
    icon: "HeartPulse",
    official: true,
    navigationItems: [
      { label: "Especialistas", href: "/modules/clinicas/especialistas", icon: "Stethoscope" },
      { label: "Citas Médicas", href: "/modules/clinicas/citas", icon: "Calendar" },
      { label: "Seguros Médicos", href: "/modules/clinicas/seguros", icon: "ShieldAlert" },
    ],
    tools: [
      {
        name: "consultar_especialistas",
        description: "Obtiene los médicos especialistas disponibles y sus horarios de consulta.",
        parameters: { type: "object", properties: { especialidad: { type: "string" } } },
      },
      {
        name: "agendar_consulta_medica",
        description: "Agenda una consulta médica con un doctor.",
        parameters: {
          type: "object",
          required: ["especialidad", "fecha", "hora"],
          properties: {
            especialidad: { type: "string" },
            doctor: { type: "string" },
            fecha: { type: "string" },
            hora: { type: "string" },
          },
        },
      },
    ],
    pipelineTemplate: {
      name: "Pipeline de Salud",
      stages: [
        { name: "Triaje y Síntomas", capiEvent: "Contact" },
        { name: "Cita Agendada", capiEvent: "Schedule" },
        { name: "Consulta Realizada", capiEvent: "Purchase" },
      ],
    },
    systemPromptEnhancement: "Eres un asistente administrativo médico. NUNCA emitas diagnósticos clínicos ni recetes medicamentos. Solo gestiona citas, horarios y seguros con empatía.",
  },
  {
    id: "ecommerce",
    name: "E-commerce y Retail",
    category: "ecommerce",
    version: "1.0.0",
    description: "Catálogo de productos interactivo, generación de carritos, seguimiento de envíos y cálculo automático de flete.",
    author: "Wachato Core Team",
    icon: "ShoppingBag",
    official: true,
    navigationItems: [
      { label: "Catálogo", href: "/modules/ecommerce/catalogo", icon: "ShoppingBag" },
      { label: "Órdenes", href: "/modules/ecommerce/ordenes", icon: "Receipt" },
      { label: "Envíos", href: "/modules/ecommerce/envios", icon: "Truck" },
    ],
    tools: [
      {
        name: "buscar_producto",
        description: "Busca productos por nombre, SKU o categoría con inventario disponible.",
        parameters: { type: "object", properties: { query: { type: "string" } } },
      },
      {
        name: "consultar_estado_orden",
        description: "Consulta el estado y tracking de una orden de compra.",
        parameters: { type: "object", required: ["numeroOrden"], properties: { numeroOrden: { type: "string" } } },
      },
    ],
    pipelineTemplate: {
      name: "Pipeline E-commerce",
      stages: [
        { name: "Carrito Abandonado", capiEvent: "InitiateCheckout" },
        { name: "Pago Pendiente", capiEvent: "InitiateCheckout" },
        { name: "Pedido Pagado", capiEvent: "Purchase" },
        { name: "Enviado", capiEvent: "Purchase" },
      ],
    },
    systemPromptEnhancement: "Eres un asesor de ventas de e-commerce entusiasta y resolutivo. Ayudas a encontrar productos, resuelves dudas de tallas y tracking de envíos.",
  },
  {
    id: "inmobiliarias",
    name: "Inmobiliarias y Bienes Raíces",
    category: "inmobiliarias",
    version: "1.0.0",
    description: "Filtrado de propiedades por zona y presupuesto, agendamiento de visitas presenciales y cálculo de cuotas hipotecarias.",
    author: "Wachato Core Team",
    icon: "Building2",
    official: true,
    navigationItems: [
      { label: "Propiedades", href: "/modules/inmobiliarias/propiedades", icon: "Building2" },
      { label: "Visitas", href: "/modules/inmobiliarias/visitas", icon: "CalendarCheck" },
    ],
    tools: [
      {
        name: "buscar_propiedades",
        description: "Busca casas, apartamentos o locales por ciudad, rango de precio y habitaciones.",
        parameters: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            zona: { type: "string" },
            precioMax: { type: "number" },
          },
        },
      },
    ],
    pipelineTemplate: {
      name: "Pipeline Inmobiliario",
      stages: [
        { name: "Perfilamiento", capiEvent: "Lead" },
        { name: "Visita Coordinada", capiEvent: "Schedule" },
        { name: "Oferta Recibida", capiEvent: "SubmitApplication" },
        { name: "Cierre / Escrituración", capiEvent: "Purchase" },
      ],
    },
    systemPromptEnhancement: "Eres un asesor inmobiliario profesional. Indagas sobre el presupuesto, zona de interés y estilo de vida para proponer la propiedad ideal.",
  },
  {
    id: "marketing",
    name: "Agencias de Marketing y Leads",
    category: "marketing",
    version: "1.0.0",
    description: "Calificación automatizada B2B (BANT), atribución de anuncios de Meta y Google, y reporte directo a la Conversions API.",
    author: "Wachato Core Team",
    icon: "Megaphone",
    official: true,
    navigationItems: [
      { label: "Campañas", href: "/modules/marketing/campanas", icon: "Megaphone" },
      { label: "Atribución CAPI", href: "/modules/marketing/atribucion", icon: "TrendingUp" },
    ],
    tools: [
      {
        name: "calificar_lead_bant",
        description: "Registra el presupuesto, autoridad, necesidad y tiempo estimado de un prospecto.",
        parameters: {
          type: "object",
          properties: {
            presupuesto: { type: "number" },
            autoridad: { type: "boolean" },
            timeline: { type: "string" },
          },
        },
      },
    ],
    systemPromptEnhancement: "Eres un calificador SDR experto. Detectas con agudeza si el prospecto tiene presupuesto y poder de decisión antes de pasarlo a un ejecutivo.",
  },
  {
    id: "servicios",
    name: "Servicios Profesionales y Legal",
    category: "servicios",
    version: "1.0.0",
    description: "Propuestas de honorarios, horas de asesoría legal/contable, contratos y acuerdos de confidencialidad.",
    author: "Wachato Core Team",
    icon: "Briefcase",
    official: true,
    navigationItems: [
      { label: "Servicios y Tarifas", href: "/modules/servicios/tarifas", icon: "Briefcase" },
      { label: "Cotizaciones", href: "/modules/servicios/cotizaciones", icon: "FileText" },
    ],
    tools: [
      {
        name: "generar_cotizacion",
        description: "Genera una cotización estimada de servicios profesionales.",
        parameters: {
          type: "object",
          required: ["servicio"],
          properties: { servicio: { type: "string" }, horas: { type: "number" } },
        },
      },
    ],
  },
  {
    id: "educacion",
    name: "Educación y Academias",
    category: "educacion",
    version: "1.0.0",
    description: "Admisiones, folletos de cursos y carreras, recordatorios de inicio de clases y resolución de dudas curriculares.",
    author: "Wachato Core Team",
    icon: "GraduationCap",
    official: true,
    navigationItems: [
      { label: "Cursos y Programas", href: "/modules/educacion/cursos", icon: "GraduationCap" },
      { label: "Inscripciones", href: "/modules/educacion/inscripciones", icon: "Users" },
    ],
    tools: [
      {
        name: "consultar_cursos",
        description: "Consulta el catálogo de diplomados, talleres y cursos con fechas de inicio.",
        parameters: { type: "object", properties: { tema: { type: "string" } } },
      },
    ],
  },
  {
    id: "logistica",
    name: "Logística y Despacho",
    category: "logistica",
    version: "1.0.0",
    description: "Seguimiento satelital de guías, cálculo de peso volumétrico y confirmación de recepción con firma digital.",
    author: "Wachato Core Team",
    icon: "Truck",
    official: true,
    navigationItems: [
      { label: "Rastreo de Guías", href: "/modules/logistica/rastreo", icon: "Truck" },
      { label: "Tarifas y Zonas", href: "/modules/logistica/tarifas", icon: "MapPin" },
    ],
    tools: [
      {
        name: "rastrear_guia",
        description: "Obtiene la ubicación y estatus de un envío mediante su número de guía.",
        parameters: { type: "object", required: ["numeroGuia"], properties: { numeroGuia: { type: "string" } } },
      },
    ],
  },
];

export function getAllModules(): ModuleManifest[] {
  return OFFICIAL_MODULES;
}

export function getModule(id: string): ModuleManifest | undefined {
  return OFFICIAL_MODULES.find((m) => m.id === id);
}

export async function getInstalledModules(organizationId: string): Promise<InstalledModuleDto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.moduleInstallation)
    .where(eq(schema.moduleInstallation.organizationId, organizationId));

  const installedMap = new Map(rows.map((r) => [r.moduleId, r]));

  return OFFICIAL_MODULES.map((m) => {
    const inst = installedMap.get(m.id);
    return {
      ...m,
      installed: Boolean(inst),
      status: inst?.status ?? "uninstalled",
      installedAt: inst?.installedAt ? new Date(inst.installedAt).toISOString() : undefined,
      config: inst?.config ?? {},
    };
  });
}

export async function toggleModuleInstallation(
  organizationId: string,
  moduleId: string,
  targetStatus: "active" | "disabled"
): Promise<InstalledModuleDto> {
  const db = getDb();
  const mod = getModule(moduleId);
  if (!mod) throw new Error(`Módulo desconocido: ${moduleId}`);

  const [existing] = await db
    .select()
    .from(schema.moduleInstallation)
    .where(
      and(
        eq(schema.moduleInstallation.organizationId, organizationId),
        eq(schema.moduleInstallation.moduleId, moduleId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.moduleInstallation)
      .set({
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.moduleInstallation.id, existing.id))
      .returning();

    return {
      ...mod,
      installed: true,
      status: updated?.status ?? targetStatus,
      installedAt: existing.installedAt ? new Date(existing.installedAt).toISOString() : undefined,
      config: existing.config ?? {},
    };
  }

  const [inserted] = await db
    .insert(schema.moduleInstallation)
    .values({
      id: newId("moduleInstallation"),
      organizationId,
      moduleId,
      status: targetStatus,
      version: mod.version,
      config: {},
    })
    .returning();

  return {
    ...mod,
    installed: true,
    status: inserted?.status ?? targetStatus,
    installedAt: inserted?.installedAt ? new Date(inserted.installedAt).toISOString() : undefined,
    config: inserted?.config ?? {},
  };
}
