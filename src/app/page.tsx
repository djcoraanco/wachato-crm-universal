import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/auth/session";
import { guideFirst } from "@/server/onboarding/guide";
import { getLandingContent } from "@/server/landing/service";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const dynamic = "force-dynamic";

/**
 * La raíz decide a dónde se entra:
 * - Si hay sesión activa:
 *   - mientras falte un paso de la guía de inicio o el agente siga apagado, a `/onboarding`.
 *   - con todo listo, a `/inbox`.
 * - Sin sesión (visitante público): se presenta la Landing Page oficial del SaaS
 *   con el catálogo de planes, características, testimonios y CMS editable.
 */
export default async function Home() {
  const session = await getSessionOrNull();
  if (session) {
    if (await guideFirst(session)) redirect("/onboarding");
    redirect("/inbox");
  }

  const content = await getLandingContent();
  return <LandingPageClient content={content} />;
}
