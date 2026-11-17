import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { OFFICIAL_MODULES } from "@/lib/modules/registry";
import { RestaurantesModuleView } from "@/modules/restaurantes/view";
import { ClinicasModuleView } from "@/modules/clinicas/view";
import { EcommerceModuleView } from "@/modules/ecommerce/view";
import { MarketingModuleView } from "@/modules/marketing/view";
import {
  InmobiliariaModuleView,
  ServiciosModuleView,
  EducacionModuleView,
  LogisticaModuleView,
} from "@/modules/sectoriales-otros/view";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = OFFICIAL_MODULES.find((m) => m.id === moduleId);

  if (!mod) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header del Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/modules"
            className="p-2 rounded-lg bg-panel2 border border-line text-muted hover:text-fg hover:border-accent transition-colors"
            title="Volver al Catálogo de Módulos"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-fg">
                {mod.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Precompilado v{mod.version}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">{mod.description}</p>
          </div>
        </div>
      </div>

      {/* Renderizado del Módulo según ID */}
      <div className="pt-2">
        {moduleId === "restaurantes" && <RestaurantesModuleView />}
        {moduleId === "clinicas" && <ClinicasModuleView />}
        {moduleId === "ecommerce" && <EcommerceModuleView />}
        {moduleId === "marketing" && <MarketingModuleView />}
        {moduleId === "inmobiliaria" && <InmobiliariaModuleView />}
        {moduleId === "servicios" && <ServiciosModuleView />}
        {moduleId === "educacion" && <EducacionModuleView />}
        {moduleId === "logistica" && <LogisticaModuleView />}
      </div>
    </div>
  );
}
