"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

interface LandingFooterProps {
  primaryColor?: string;
  brandName?: string;
}

export function LandingFooter({ primaryColor = "#00C4C0", brandName = "CRM" }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, #008f8c)`,
                }}
              >
                <Bot className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {brandName}
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma SaaS de WhatsApp Cloud API oficial y Agentes de IA autónomos. Diseñado
              para negocios y agencias que buscan escalar sus ventas con tecnología robusta.
            </p>
          </div>

          {/* Col 1: Producto */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Producto
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Planes y Precios
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-white transition-colors">
                  Casos de Éxito
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Canales & IA */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Ecosistema
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300">WhatsApp Cloud API</span>
              </li>
              <li>
                <span className="text-slate-300">Instagram Direct & Messenger</span>
              </li>
              <li>
                <span className="text-slate-300">TikTok Business Chat</span>
              </li>
              <li>
                <span className="text-slate-300">OpenAI & Anthropic Claude</span>
              </li>
              <li>
                <span className="text-slate-300">Google Gemini & DeepSeek</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Soporte */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Plataforma
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Acceso a Clientes
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Crear Cuenta Nueva
                </Link>
              </li>
              <li>
                <a
                  href="mailto:soporte@crm.com"
                  className="hover:text-white transition-colors"
                >
                  Soporte Técnico
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {currentYear} {brandName}. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>Privacidad de Datos</span>
            <span>•</span>
            <span>Términos de Servicio</span>
            <span>•</span>
            <span>Seguridad AES-256</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
