"use client";

import { LandingNavbar } from "./landing-navbar";
import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { LandingPricing } from "./landing-pricing";
import { LandingTestimonials } from "./landing-testimonials";
import { LandingFaq } from "./landing-faq";
import { LandingFooter } from "./landing-footer";
import type { LandingContentPayload } from "@/server/landing/service";

interface LandingPageClientProps {
  content: LandingContentPayload;
}

export function LandingPageClient({ content }: LandingPageClientProps) {
  const primaryColor = content.theme?.primaryColor || "#00C4C0";
  const accentColor = content.theme?.accentColor || "#00E5E0";
  const brandName = content.seo?.metaTitle?.split("—")[0]?.trim() || "CRM";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 flex flex-col font-sans">
      {/* Barra de navegación superior */}
      <LandingNavbar primaryColor={primaryColor} brandName={brandName} />

      <main className="flex-1">
        {/* Sección Hero con preview del dashboard */}
        <LandingHero
          hero={content.hero}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />

        {/* Sección de Características y Módulos */}
        <LandingFeatures
          features={content.features}
          primaryColor={primaryColor}
        />

        {/* Sección de Precios y Facturación */}
        <LandingPricing
          pricing={content.pricing}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />

        {/* Sección de Testimonios */}
        <LandingTestimonials
          testimonials={content.testimonials}
          primaryColor={primaryColor}
        />

        {/* Preguntas frecuentes */}
        <LandingFaq faq={content.faq} primaryColor={primaryColor} />
      </main>

      {/* Footer corporativo */}
      <LandingFooter primaryColor={primaryColor} brandName={brandName} />
    </div>
  );
}
