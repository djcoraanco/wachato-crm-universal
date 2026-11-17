"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Menu, X, ArrowRight } from "lucide-react";

interface LandingNavbarProps {
  primaryColor?: string;
}

export function LandingNavbar({ primaryColor = "#00C4C0" }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, #008f8c)`,
              boxShadow: `0 0 20px -3px ${primaryColor}40`,
            }}
          >
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
              Wachato <span style={{ color: primaryColor }}>CRM</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">
            Características
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Precios
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors">
            Testimonios
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            Preguntas Frecuentes
          </a>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 shadow-md shadow-cyan-500/20"
            style={{ backgroundColor: primaryColor }}
          >
            Empezar Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 pt-2 text-base font-medium text-slate-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-white transition-colors"
            >
              Características
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-white transition-colors"
            >
              Precios
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-white transition-colors"
            >
              Testimonios
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-white transition-colors"
            >
              Preguntas Frecuentes
            </a>
          </nav>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-950 rounded-lg shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              Empezar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
