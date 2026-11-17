import { describe, expect, it } from "vitest";
import { DEFAULT_LANDING_CONTENT } from "@/server/landing/service";
import { settingsSections } from "@/lib/nav";

describe("SaaS Fase 3: Landing Page Pública & CMS Visual", () => {
  it("DEFAULT_LANDING_CONTENT posee una estructura de contenido completa y válida", () => {
    expect(DEFAULT_LANDING_CONTENT.id).toBe("default");
    expect(DEFAULT_LANDING_CONTENT.isPublished).toBe(true);

    // Hero
    expect(DEFAULT_LANDING_CONTENT.hero.title).toBeTruthy();
    expect(DEFAULT_LANDING_CONTENT.hero.subtitle).toBeTruthy();
    expect(DEFAULT_LANDING_CONTENT.hero.ctaText).toBeTruthy();
    expect(DEFAULT_LANDING_CONTENT.hero.ctaLink).toBe("/register");

    // Features
    expect(DEFAULT_LANDING_CONTENT.features.length).toBeGreaterThanOrEqual(6);
    for (const f of DEFAULT_LANDING_CONTENT.features) {
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.icon).toBeTruthy();
    }

    // Pricing
    expect(DEFAULT_LANDING_CONTENT.pricing.headline).toBeTruthy();
    expect(DEFAULT_LANDING_CONTENT.pricing.subheadline).toBeTruthy();
    expect(DEFAULT_LANDING_CONTENT.pricing.highlightedPlanSlug).toBe("pro");
    expect(DEFAULT_LANDING_CONTENT.pricing.yearlyDiscountPercent).toBe(17);

    // Testimonials
    expect(DEFAULT_LANDING_CONTENT.testimonials.length).toBeGreaterThanOrEqual(3);
    for (const t of DEFAULT_LANDING_CONTENT.testimonials) {
      expect(t.name).toBeTruthy();
      expect(t.quote).toBeTruthy();
      expect(t.rating).toBeGreaterThanOrEqual(4);
    }

    // FAQ
    expect(DEFAULT_LANDING_CONTENT.faq.length).toBeGreaterThanOrEqual(5);
    for (const item of DEFAULT_LANDING_CONTENT.faq) {
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    }

    // Theme & SEO
    expect(DEFAULT_LANDING_CONTENT.theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(DEFAULT_LANDING_CONTENT.seo.metaTitle).toContain("Wachato");
    expect(DEFAULT_LANDING_CONTENT.seo.metaDescription).toBeTruthy();
  });

  it("settingsSections incluye el enlace de Landing Page cuando landing está activo", () => {
    const withoutLanding = settingsSections({});
    const negocioSinLanding = withoutLanding.find((s) => s.title === "Negocio");
    expect(negocioSinLanding?.links.some((l) => l.href === "/settings/landing")).toBe(false);

    const withLanding = settingsSections({ landing: true });
    const negocioConLanding = withLanding.find((s) => s.title === "Negocio");
    expect(negocioConLanding?.links.some((l) => l.href === "/settings/landing")).toBe(true);
    expect(negocioConLanding?.links.find((l) => l.href === "/settings/landing")?.label).toBe(
      "Landing Page"
    );
  });
});
