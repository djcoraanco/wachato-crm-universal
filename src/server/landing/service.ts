import { getDb, schema } from "@/lib/db";
import type {
  LandingFaqItem,
  LandingFeatureItem,
  LandingHeroConfig,
  LandingPricingConfig,
  LandingSeoConfig,
  LandingTestimonialItem,
  LandingThemeConfig,
} from "@/lib/billing/types";
import { eq } from "drizzle-orm";

export interface LandingContentPayload {
  id: string;
  agencyId?: string | null;
  hero: LandingHeroConfig;
  features: LandingFeatureItem[];
  pricing: LandingPricingConfig;
  testimonials: LandingTestimonialItem[];
  faq: LandingFaqItem[];
  theme: LandingThemeConfig;
  seo: LandingSeoConfig;
  isPublished: boolean;
}

export const DEFAULT_LANDING_CONTENT: LandingContentPayload = {
  id: "default",
  agencyId: null,
  hero: {
    badge: "CRM Universal de WhatsApp & IA para Negocios",
    title: "Vende más por WhatsApp con tu Agente de IA autónomo",
    subtitle:
      "La plataforma todo-en-uno con WhatsApp Cloud API oficial, pipeline kanban, automatizaciones y módulos especializados para clínicas, restaurantes, e-commerce y servicios.",
    ctaText: "Comenzar Ahora",
    ctaLink: "/register",
    secondaryCtaText: "Ver Planes y Precios",
    secondaryCtaLink: "#pricing",
    imageUrl: "/brand/wachato-dashboard-preview.png",
  },
  features: [
    {
      icon: "MessageSquare",
      title: "WhatsApp Cloud API Oficial",
      description:
        "Cero riesgo de baneos con sesiones web o Baileys. Integración nativa directa con los servidores de Meta, verificación criptográfica y soporte para ventana de 24 horas.",
      badge: "Meta Oficial",
    },
    {
      icon: "Bot",
      title: "Agente IA Multi-Proveedor",
      description:
        "Conecta OpenAI, Anthropic, Gemini o DeepSeek con un clic. Tu agente responde con conocimiento exacto de tu negocio, agenda citas y califica prospectos.",
      badge: "Multi-LLM",
    },
    {
      icon: "Kanban",
      title: "Pipeline Kanban con Meta CAPI",
      description:
        "Mueve tratos entre etapas, calcula el valor total por columna y reporta conversiones automáticamente a Meta Ads para optimizar tus campañas de Click-to-WhatsApp.",
      badge: "Ventas B2B",
    },
    {
      icon: "Zap",
      title: "Automatizaciones con Cola DB",
      description:
        "Flujos automáticos resistentes a fallos con arquitectura PostgreSQL SKIP LOCKED sin necesidad de Redis. Triggers, esperas y acciones diferidas seguras.",
      badge: "Ultra Concurrente",
    },
    {
      icon: "Mic",
      title: "Transcripción de Voz con Whisper",
      description:
        "Convierte notas de voz de clientes en texto al instante. Tu equipo y tu agente leen y responden los audios sin perder tiempo escuchándolos.",
      badge: "Voz a Texto",
    },
    {
      icon: "Boxes",
      title: "8 Módulos de Industria Precompilados",
      description:
        "Activa funciones médicas, menús de restaurantes, pedidos de e-commerce o gestión inmobiliaria con un solo interruptor desde la interfaz.",
      badge: "Plug & Play",
    },
  ],
  pricing: {
    headline: "Planes transparentes que crecen con tu negocio",
    subheadline:
      "Paga mensual o ahorra 2 meses con la facturación anual. Todas las pasarelas automatizadas con Stripe y PayPal.",
    highlightedPlanSlug: "pro",
    yearlyDiscountPercent: 17, // ~2 meses gratis
  },
  testimonials: [
    {
      name: "Dra. Sofía Mendoza",
      role: "Directora Médica",
      company: "Clínica Dental Estética",
      quote:
        "Wachato transformó nuestra atención. El agente califica a los pacientes, les explica tratamientos y agenda citas en el calendario automáticamente.",
      rating: 5,
    },
    {
      name: "Carlos Villagrán",
      role: "Gerente de E-commerce",
      company: "Tienda Urbana Calzados",
      quote:
        "Las ventas desde anuncios de WhatsApp se duplicaron gracias a la integración con Meta CAPI y el seguimiento de pedidos por WhatsApp.",
      rating: 5,
    },
    {
      name: "Rodrigo Morales",
      role: "CEO & Founder",
      company: "Agencia ScaleMarketing",
      quote:
        "Manejamos más de 15 clientes en la versión de Marca Blanca. Cada cliente tiene su propio subdominio y nosotros gestionamos todo desde un solo panel.",
      rating: 5,
    },
  ],
  faq: [
    {
      question: "¿Puedo usar mi propio número de WhatsApp actual?",
      answer:
        "Sí. Puedes conectar cualquier número fijo o móvil a la WhatsApp Cloud API oficial de Meta. Te guiaremos paso a paso en menos de 5 minutos.",
    },
    {
      question: "¿Qué pasarelas de pago aceptan?",
      answer:
        "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex), Apple Pay y Google Pay mediante Stripe, además de suscripciones automáticas con PayPal.",
    },
    {
      question: "¿Cómo funciona el Agente de Inteligencia Artificial?",
      answer:
        "Puedes configurar tu clave de OpenAI, Anthropic Claude, Google Gemini o DeepSeek en Ajustes. Tu agente aprenderá los servicios, preguntas frecuentes y reglas de tu negocio para atender a tus clientes 24/7.",
    },
    {
      question: "¿Puedo cancelar mi suscripción en cualquier momento?",
      answer:
        "Sí, sin contratos forzosos ni letras pequeñas. Puedes cancelar directamente desde el Portal de Facturación con un solo clic y mantendrás el servicio hasta el final de tu ciclo facturado.",
    },
    {
      question: "¿Ofrecen soporte para agencias y marca blanca?",
      answer:
        "Absolutamente. Con el Plan Agency Partner puedes revender el CRM con tu propia marca, logotipo, colores corporativos y subdominios personalizados para cada cliente.",
    },
  ],
  theme: {
    primaryColor: "#00C4C0",
    accentColor: "#00E5E0",
    darkBg: "#0D1920",
    panelBg: "#13222B",
  },
  seo: {
    metaTitle: "Wachato CRM Universal — CRM de WhatsApp con Agente de IA para Negocios",
    metaDescription:
      "Plataforma CRM omnicanal con WhatsApp Cloud API oficial, pipeline kanban, automatizaciones y agentes de inteligencia artificial para aumentar tus ventas.",
  },
  isPublished: true,
};

/**
 * Obtiene el contenido de la landing page para una agencia o el default global.
 */
export async function getLandingContent(agencyId?: string | null): Promise<LandingContentPayload> {
  try {
    const db = getDb();
    if (!schema?.landingContent) {
      return DEFAULT_LANDING_CONTENT;
    }

    if (agencyId) {
    const rows = await db
      .select()
      .from(schema.landingContent)
      .where(eq(schema.landingContent.agencyId, agencyId))
      .limit(1);

    if (rows[0] && rows[0].isPublished) {
      return {
        id: rows[0].id,
        agencyId: rows[0].agencyId,
        hero: rows[0].hero,
        features: rows[0].features,
        pricing: rows[0].pricing,
        testimonials: rows[0].testimonials,
        faq: rows[0].faq,
        theme: rows[0].theme,
        seo: rows[0].seo,
        isPublished: rows[0].isPublished,
      };
    }
  }

  // Buscar el contenido default
  const defaultRows = await db
    .select()
    .from(schema.landingContent)
    .where(eq(schema.landingContent.id, "default"))
    .limit(1);

  if (defaultRows[0]) {
    return {
      id: defaultRows[0].id,
      agencyId: null,
      hero: defaultRows[0].hero,
      features: defaultRows[0].features,
      pricing: defaultRows[0].pricing,
      testimonials: defaultRows[0].testimonials,
      faq: defaultRows[0].faq,
      theme: defaultRows[0].theme,
      seo: defaultRows[0].seo,
      isPublished: defaultRows[0].isPublished,
    };
  }

    return DEFAULT_LANDING_CONTENT;
  } catch {
    return DEFAULT_LANDING_CONTENT;
  }
}

/**
 * Guarda o actualiza el contenido de la landing page en base de datos.
 */
export async function saveLandingContent(
  payload: Partial<LandingContentPayload> & { id?: string; agencyId?: string | null }
): Promise<LandingContentPayload> {
  const db = getDb();
  const id = payload.id ?? (payload.agencyId ? `land_${payload.agencyId}` : "default");

  const existing = await db
    .select({ id: schema.landingContent.id })
    .from(schema.landingContent)
    .where(eq(schema.landingContent.id, id))
    .limit(1);

  const hero = payload.hero ?? DEFAULT_LANDING_CONTENT.hero;
  const features = payload.features ?? DEFAULT_LANDING_CONTENT.features;
  const pricing = payload.pricing ?? DEFAULT_LANDING_CONTENT.pricing;
  const testimonials = payload.testimonials ?? DEFAULT_LANDING_CONTENT.testimonials;
  const faq = payload.faq ?? DEFAULT_LANDING_CONTENT.faq;
  const theme = payload.theme ?? DEFAULT_LANDING_CONTENT.theme;
  const seo = payload.seo ?? DEFAULT_LANDING_CONTENT.seo;
  const isPublished = payload.isPublished ?? true;

  if (existing.length === 0) {
    await db.insert(schema.landingContent).values({
      id,
      agencyId: payload.agencyId ?? null,
      hero,
      features,
      pricing,
      testimonials,
      faq,
      theme,
      seo,
      isPublished,
    });
  } else {
    await db
      .update(schema.landingContent)
      .set({
        hero,
        features,
        pricing,
        testimonials,
        faq,
        theme,
        seo,
        isPublished,
        updatedAt: new Date(),
      })
      .where(eq(schema.landingContent.id, id));
  }

  return {
    id,
    agencyId: payload.agencyId ?? null,
    hero,
    features,
    pricing,
    testimonials,
    faq,
    theme,
    seo,
    isPublished,
  };
}
