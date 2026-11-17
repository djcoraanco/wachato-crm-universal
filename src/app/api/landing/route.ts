import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getLandingContent, saveLandingContent } from "@/server/landing/service";
import { isSuperAdmin } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

/**
 * GET público: Obtiene la configuración de la landing page pública.
 * Puede recibir query param ?agencyId=ag_xxx para landings de marca blanca de agencias.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agencyId = url.searchParams.get("agencyId");
    const content = await getLandingContent(agencyId);
    return Response.json({ ok: true, content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener la landing page";
    return apiError(500, "internal_error", message);
  }
}

const landingSchema = z.object({
  id: z.string().optional(),
  agencyId: z.string().nullable().optional(),
  hero: z.object({
    badge: z.string().optional(),
    title: z.string().min(1, "El título principal es requerido"),
    subtitle: z.string().min(1, "El subtítulo es requerido"),
    ctaText: z.string().min(1, "El texto del botón CTA es requerido"),
    ctaLink: z.string().min(1, "El enlace del botón CTA es requerido"),
    secondaryCtaText: z.string().optional(),
    secondaryCtaLink: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  features: z.array(
    z.object({
      icon: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      badge: z.string().optional(),
    })
  ),
  pricing: z.object({
    headline: z.string().min(1),
    subheadline: z.string().min(1),
    highlightedPlanSlug: z.string().optional(),
    yearlyDiscountPercent: z.number().optional(),
  }),
  testimonials: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      company: z.string().optional(),
      quote: z.string().min(1),
      avatarUrl: z.string().optional(),
      rating: z.number().optional(),
    })
  ),
  faq: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ),
  theme: z.object({
    primaryColor: z.string().min(1),
    accentColor: z.string().min(1),
    darkBg: z.string().min(1),
    panelBg: z.string().min(1),
  }),
  seo: z.object({
    metaTitle: z.string().min(1),
    metaDescription: z.string().min(1),
    ogImage: z.string().optional(),
  }),
  isPublished: z.boolean().optional(),
});

/**
 * PUT: Guarda o actualiza el contenido de la landing page.
 * Requiere ser propietario de la organización o superadmin de la plataforma.
 */
export const PUT = withAuth(async (session, req: Request) => {
  const allowed = session.role === "owner" || isSuperAdmin(session.role);
  if (!allowed) {
    return apiError(403, "forbidden", "Solo el propietario o superadministrador puede editar la landing page");
  }

  const parsed = await parseBody(req, landingSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const saved = await saveLandingContent(parsed.data);
    return Response.json({ ok: true, content: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar la landing page";
    return apiError(500, "save_failed", message);
  }
});
