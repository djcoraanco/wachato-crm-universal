# Bitácora de Implementación — Fase 3: Bandeja en Tiempo Real, Medios Vocales y Conexiones

## 1. Resumen Ejecutivo
Se completó la implementación de la Fase 3 de **Wachato CRM Universal**. La bandeja de mensajes ahora cuenta con un diseño de 3 columnas alineado estrictamente con `specs/design/wachato-prototype.html`, incorporando los filtros rápidos por canal y atención humana, el interruptor "Simular cliente" vs. "Responder como equipo", el monitor visual de ventana de 24 horas de Meta con tiempo restante exacto, el toggle "IA responde" en la cabecera del chat, el pipeline de transcripción de notas de voz con Whisper y la nueva vista de **Conexiones y Meta** (`/connections`).

---

## 2. Bandeja de Conversaciones (Fidelidad Prototipo)
1. **Filtros por Canal y Atención Humana (`conversation-list.tsx`):**
   - Selector en barra superior con chips: `Todos`, `WhatsApp`, `Instagram`, `Messenger`, `Con humano`.
   - Filtrado reactivo en memoria que aísla de inmediato las conversaciones atendidas por el equipo o los canales específicos.
2. **Cabecera del Hilo de Chat (`inbox-client.tsx`):**
   - Indicador pill en vivo de la ventana de Meta (verde con pulso si está abierta y tiempo restante exacto; rojo de alerta si está cerrada; azul cielo si está en ventana humana de 7 días).
   - Switch accesible `IA responde` usando `<Switch size="sm" />` de `@/components/ui/switch`.
3. **Compositor Interactivo (`composer.tsx`):**
   - Switch segmentado `[ Simular cliente | Responder como equipo ]` con texto explicativo dinámico.
   - Si `Simular cliente`: envía mediante `POST /api/conversations/[id]/simulate-inbound` para probar las respuestas del agente de IA directamente en vivo con frases como «precio», «¿tienen cita?», etc., reabriendo la ventana si estaba cerrada.
   - Si `Responder como equipo`: respuesta normal por el canal oficial. Si la ventana de 24 h está cerrada, bloquea el texto libre y activa el selector de plantillas aprobadas `TemplateSender`.
4. **Panel Lateral de Contacto (`contact-panel.tsx`):**
   - Acción rápida `Agendar cita rápida` que enlaza al flujo de agendamiento con el contacto precargado.

---

## 3. Pipeline de Notas de Voz y Whisper (`src/server/ai/whisper.ts`)
- Módulo de transcripción compatible con Groq (`whisper-large-v3-turbo`) y OpenAI (`whisper-1`).
- Ingesta automática post-descarga del asset de audio en `avisarAdjuntoListo` (`src/server/inbox/ingest.ts`).
- Los audios transcritos se asocian al texto del mensaje como `[Nota de voz transcrita]: "..."` y viajan en el contexto del despacho al agente de IA para permitirle contestar con comprensión total del audio.

---

## 4. Pantalla de Conexiones y Meta (`src/app/(app)/connections/page.tsx`)
- Grid de canales conectados: WhatsApp Business (API oficial), Instagram, Facebook Messenger, Google Calendar.
- Panel de Requisitos de Meta con estado de verificación y explicaciones de cumplimiento.
- Tabla de Plantillas de WhatsApp con categorías y estado de aprobación.
- Monitor de Conversions API (CAPI) con Dataset ID y tabla de log de eventos en tiempo real (`Hora`, `Evento`, `Contacto`, `Canal`, `Valor`, `Estado`).
- Integración en la navegación lateral (`src/components/app-nav.tsx`).

---

## 5. Verificación de Calidad y Gates
- **TypeScript (`pnpm typecheck`):** 0 errores.
- **ESLint (`pnpm lint`):** 0 errores, 0 advertencias.
- **Vitest (`pnpm test`):** 122 suites pasadas, 1389 pruebas pasadas al 100%.
