"use client";

import {
  Bot,
  Boxes,
  Calendar,
  CheckCircle,
  Database,
  Kanban,
  MessageSquare,
  Mic,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { LandingFeatureItem } from "@/lib/billing/types";

interface LandingFeaturesProps {
  features: LandingFeatureItem[];
  primaryColor?: string;
}

// Mapa de íconos seguros de Lucide
const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  Bot,
  Kanban,
  Zap,
  Mic,
  Boxes,
  Calendar,
  Users,
  Shield,
  Database,
  Sparkles,
  CheckCircle,
};

export function LandingFeatures({
  features,
  primaryColor = "#00C4C0",
}: LandingFeaturesProps) {
  return (
    <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 mb-4">
            Poder Omnicanal & Automatización
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Todo lo que necesitas para escalar tus ventas por WhatsApp
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Diseñado específicamente para negocios con alto volumen que exigen estabilidad,
            cumplimiento oficial de Meta y respuesta inmediata con Inteligencia Artificial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const IconComponent = ICON_MAP[feature.icon] ?? MessageSquare;

            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-7 hover:border-cyan-500/50 hover:bg-slate-900/70 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`,
                        border: `1px solid ${primaryColor}40`,
                      }}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color: primaryColor }}
                      />
                    </div>

                    {feature.badge && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center text-xs font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">
                  <span>Descubrir más</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
