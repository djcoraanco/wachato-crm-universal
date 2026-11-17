# Bitácora de Implementación — Fase 1: Design System Wachato y App Shell en Next.js 15

**Fecha:** 17 de noviembre de 2026  
**Fase:** FASE 1 — Design System Wachato y App Shell  
**Estado:** `[X] COMPLETADO`  
**Referencia de Diseño:** `specs/design/wachato-prototype.html`

---

## 1. Resumen de Trabajo Realizado

En esta fase se implementaron los tokens de diseño, fuentes y la estructura del App Shell de Wachato CRM Universal, replicando la especificación del prototipo HTML:

1. **Configuración de Tipografías Google (`src/app/layout.tsx`):**
   - Se incorporó `Nunito` (pesos 800 y 900) para `font-display` (encabezados, isotipo y métricas).
   - Se incorporó `Plus_Jakarta_Sans` (pesos 400, 500, 600, 700) para `font-body` (textos, controles y tablas).
   - Integración nativa con `next/font/google` descargada en tiempo de compilación para total soberanía y cero llamadas a CDNs en runtime.

2. **Configuración de Tailwind CSS (`tailwind.config.ts`):**
   - Se extendió la paleta de colores con los tokens de Wachato:
     - `panel`: `var(--panel)`
     - `panel2`: `var(--panel2)`
     - `line`: `var(--line)`
     - `fg`: `var(--fg)`
     - Canales: `wa` (`#25D366`), `ig` (`#EA4F86`), `fb` (`#5B97F7`)
     - Estados: `ok` (`#3BD38A`), `warn` (`#F2B544`), `bad` (`#F2706B`)
     - `bubble-ai`: `var(--bubble-ai)`
     - `on-accent`: `var(--on-accent)`
     - `accent-soft`: `var(--wachato-accent-soft, var(--accent-soft))`
     - `accent-wachato`: `var(--wachato-accent)`
   - Se extendieron las familias de fuentes: `display` (`var(--font-nunito)`), `body` (`var(--font-jakarta)`).

3. **Variables CSS en `globals.css` (`src/app/globals.css`):**
   - Modos Dark (por defecto en el prototipo) y Light.
   - Preservación estricta de los pisos de contraste y de los tests de accesibilidad WCAG AA (`tests/unit/contraste-temas.test.ts` y `tests/unit/temas.test.ts`).

4. **Componente de Marca Wachato (`src/components/brand-mark.tsx`):**
   - `WachatoLogo`: Logotipo SVG interactivo de Wachato con texto `wachat` en tipografía display 900 y círculo de chat con acento turquesa `#00C4C0`.

5. **Topbar Contextual (`src/components/topbar.tsx`):**
   - `WachatoTopbar`: Título dinámico por ruta (`Bandeja`, `Pipeline`, `Contactos`, `Automatizaciones`, `Agentes de IA`, `Entrenar IA`, `Calendario`, `Estadísticas`, `Conexiones y Meta`), badge de entorno `Prototipo · datos de ejemplo` y fecha contextual formateada en español.

6. **Sidebar y App Shell Responsivo (`src/components/app-nav.tsx` y `src/components/app-shell.tsx`):**
   - Sidebar fija de 228px en escritorio y drawer accesible en móvil.
   - Navegación principal con estados activos en acento suave y contadores numéricos `.count`.
   - Separador horizontal `.navsep`.
   - Tarjeta inferior del negocio `.biz` con nombre de organización y plaza.
   - Barra de utilidades con silenciador de timbre, toggle de tema y cierre de sesión.

---

## 2. Archivos Modificados y Creados

| Archivo | Acción | Descripción |
|---|---|---|
| `tailwind.config.ts` | Modificado | Tokens de color y fuentes `display`/`body` de Wachato |
| `src/app/layout.tsx` | Modificado | Carga de fuentes `Nunito` y `Plus_Jakarta_Sans` con `next/font/google` |
| `src/app/globals.css` | Modificado | Variables CSS de Wachato para `:root` y `:root[data-theme="dark"]` |
| `src/lib/branding.ts` | Modificado | Añadido preset `Turquesa Wachato` (`#00c4c0`) |
| `src/components/brand-mark.tsx` | Modificado | Añadido componente `WachatoLogo` con SVG oficial |
| `src/components/topbar.tsx` | Creado | Topbar con título dinámico y fecha |
| `src/components/app-shell.tsx` | Modificado | Estructura responsiva de layout con Topbar integrada |
| `src/components/app-nav.tsx` | Modificado | Sidebar fija 228px, badges `.count` y tarjeta `.biz` |
| `docs/implementation/01-design-system.md` | Creado | Bitácora de la fase |

---

## 3. Puertas de Verificación (Gates)

```bash
# 1. Typecheck
$ pnpm typecheck
> tsc --noEmit (0 errores)

# 2. Linter
$ pnpm lint
> eslint . (0 errores, 0 warnings)

# 3. Pruebas Unitarias
$ pnpm test
> vitest run
# 122 test files passed (122)
# 1389 tests passed (1389)
```

---

## 4. Estado en Plan Maestro

- `Tarea 1.1`: `[X] COMPLETADO`
- `Tarea 1.2`: `[X] COMPLETADO`
- `Tarea 1.3`: `[X] COMPLETADO`
