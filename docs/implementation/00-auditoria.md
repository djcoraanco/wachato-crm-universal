# Fase 0: Informe de Auditoría Inicial, Línea Base e Inspección del Prototipo Wachato

**Fecha:** 17 de noviembre de 2026  
**Proyecto:** Wachato CRM Universal (Evolución de Vocero CRM)  
**Fuente de Verdad Visual:** `specs/design/wachato-prototype.html`  
**Estado:** Completado (Línea Base Verificada)

---

## 1. Resumen Ejecutivo

El presente documento establece la auditoría inicial de arquitectura, diseño y contratos para la transformación de **Vocero CRM 2.0** en **Wachato CRM Universal**.
Se ha inspeccionado de forma exhaustiva tanto la base de código existente en `src/`, `drizzle/` y `tests/`, como el archivo de referencia `specs/design/wachato-prototype.html`.

La línea base del proyecto se encuentra en un estado de salud técnica impecable:
- **TypeScript (`pnpm typecheck`):** 0 errores de tipado.
- **Linter (`pnpm lint`):** 0 advertencias y 0 errores en ESLint 9.
- **Pruebas Unitarias (`pnpm test`):** 122 archivos de test pasados, 1389 pruebas superadas con éxito.

---

## 2. Inspección Exhaustiva del Prototipo (`specs/design/wachato-prototype.html`)

El prototipo HTML contiene la especificación visual y funcional completa para el nuevo sistema de diseño y la interacción de usuario de Wachato CRM:

### 2.1 Design Tokens y Variables CSS
- **Tipografías:**
  - *Display / Headings / Métricas:* `Nunito` (pesos 800 y 900), con `-0.01em` a `-0.02em` letter-spacing.
  - *Body / Form Controls / Tablas:* `Plus Jakarta Sans` (pesos 400, 500, 600, 700).
- **Paleta de Colores (Dark por defecto con soporte Light nativo):**
  - `--bg`: `#0D1920` (Dark) / `#EEF4F5` (Light)
  - `--panel`: `#13222B` (Dark) / `#FFFFFF` (Light)
  - `--panel2`: `#1A2E39` (Dark) / `#F3F8F9` (Light)
  - `--line`: `#243C4A` (Dark) / `#D3E1E5` (Light)
  - `--fg`: `#E6F0F2` (Dark) / `#0D1D25` (Light)
  - `--muted`: `#8BA4AE` (Dark) / `#587079` (Light)
  - `--accent`: `#00C4C0` (Turquesa Wachato) / `#009C98` (Light)
  - `--accent-soft`: `rgba(0,196,192,.14)` (Dark) / `rgba(0,156,152,.12)` (Light)
  - `--on-accent`: `#03201F` (Dark) / `#FFFFFF` (Light)
  - Canales: `--wa: #25D366`, `--ig: #EA4F86`, `--fb: #5B97F7`
  - Estados: `--ok: #3BD38A`, `--warn: #F2B544`, `--bad: #F2706B`
  - Burbujas de chat:
    - Entrada (`--bubble-in`): `#1E3542` (Dark) / `#E7F0F2` (Light)
    - Equipo (`--bubble-out`): `#0B514E` (Dark) / `#CFF1EE` (Light)
    - IA (`--bubble-ai`): `#173F4A` con borde acento suave (Dark) / `#DDEFF6` (Light)

### 2.2 App Shell y Estructura Visual
- **Sidebar fija (228px):**
  - Isotipo / Logotipo "wachat" + círculo de chat SVG con acento turquesa `#00C4C0`.
  - Navegación vertical con badges de conteo no leído (`.count`: fondo `#00C4C0`, texto `#03201F`).
  - Separador horizontal sutil (`.navsep`).
  - Tarjeta de información del negocio activo en el pie (`.biz`).
- **Topbar:**
  - Título dinámico de la sección activa (`h1` de 20px).
  - Insignia de modo de entorno (ej. "Prototipo · datos de ejemplo" o "Producción").
  - Fecha contextual formateada en español.
- **Área Principal (`.view`):**
  - Despliegue con scroll independiente o modo `flush` (sin padding) específico para la Bandeja.

### 2.3 Mapeo de Vistas del Prototipo
1. **`#bandeja` (Bandeja Multicanal):**
   - 3 columnas: Lista de conversaciones con filtros (Todos, WA, IG, FB, Con humano), visor central de mensajes y panel lateral del contacto.
   - Segmented control: "Simular cliente" vs. "Responder como equipo".
   - Indicador de Ventana de 24 horas de Meta: Alerta visual del tiempo restante (ej. `Ventana abierta · quedan 23 h 45 min` o `Ventana de 24 h cerrada`), bloqueando el texto libre y forzando selección de plantilla aprobada.
   - Interruptor "IA responde" por conversación.
   - Panel de contacto con cambio de etapa, origen, valor estimado, tags, agendamiento rápido y notas internas.
2. **`#pipeline` (Tablero Kanban):**
   - Columnas configurables por etapas (Nuevo lead, Calificado, Cita agendada, Asistió, Cliente, Perdido).
   - Selector por columna de Evento Meta Conversions API (`Lead`, `Contact`, `Schedule`, `SubmitApplication`, `InitiateCheckout`, `Purchase`).
   - Drag & drop de tarjetas con totalización automática de valor monetario en tiempo real.
3. **`#contactos` (Directorio y Exportación):**
   - Búsqueda en tiempo real (nombre, teléfono/handle, etiquetas).
   - Filtros desplegables por etapa, canal y etiqueta.
   - Botones nativos "Descargar Excel" (`.xlsx` vía biblioteca) y "Descargar PDF" (`.pdf` horizontal con tabla).
4. **`#automatizaciones` (Flujos de Trabajo):**
   - Tarjetas de automatizaciones con switches de activación/pausa.
   - Contador de ejecuciones (`runs`).
   - Diagrama horizontal paso a paso: Disparador (`trig`) $\rightarrow$ Acciones $\rightarrow$ Esperas.
5. **`#agentes` (Configuración de IA y Enrutamiento):**
   - Selector de modo: "Agente Wachato", "Agente externo" (webhook) o "Mixto" (con fallback por timeout a 10s).
   - Configuración de Motor de IA multi-proveedor: Anthropic, OpenAI, Gemini, Mistral, DeepSeek y Custom/OpenRouter.
   - Gestión de claves API cifradas con test de validación.
   - Reglas de escalado a humano: pedido explícito, queja/reclamo, dudas médicas, fuera de horario.
6. **`#entrenar` (Entrenamiento con Sandbox Sticky):**
   - Layout 2 columnas: Formulario a la izquierda y simulador de prueba interactivo sticky a la derecha.
   - Medidor de completitud superior (0 % a 100 % entrenado).
   - 5 bloques pedagógicos: 1. Información del negocio, 2. Servicios y precios, 3. Preguntas y respuestas (Q&A con keywords), 4. Instrucciones y límites (reglas de negocio), 5. Documentos y lectura de URL web.
   - Chat interactivo de prueba con chips de preguntas frecuentes ("¿Duele el botox?", "Precio del láser", etc.).
7. **`#calendario` (Agenda Visual Semanal):**
   - Cuadrícula semanal lunes a sábado de 9:00 a 18:00.
   - Citas visuales diferenciadas: agendadas por IA vs. agendadas por equipo humano.
8. **`#estadisticas` (Métricas y KPIs):**
   - KPIs superiores con deltas comparativos (+% vs mes anterior).
   - Gráfico de barras apiladas por día (distribución WhatsApp, Instagram, Messenger).
   - Embudo de conversión visual (Conversaciones $\rightarrow$ Leads $\rightarrow$ Calificados $\rightarrow$ Citas $\rightarrow$ Asistieron $\rightarrow$ Clientes).
   - Tabla de atribución de leads por anuncio de Meta con ventas asociadas.
9. **`#conexiones` (Estado de Canales y Meta Compliance):**
   - Estado de canales conectados (WhatsApp Cloud API, Instagram, Messenger, Google Calendar).
   - Lista de verificación de requisitos y políticas de Meta.
   - Tabla de plantillas con categoría y estado de aprobación.
   - Log en tiempo real de eventos enviados a la Conversions API (CAPI).

---

## 3. Estado Actual de la Base de Código (Vocero CRM)

### 3.1 Arquitectura Existente
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (estricto).
- **Base de Datos & ORM:** PostgreSQL 16 + Drizzle ORM.
  - Tablas existentes: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `contact`, `pipelineStage`, `lead`, `leadStageEvent`, `conversation`, `message`, `mediaAsset`, `metaCredentials`, `instagramCredentials`, `messengerCredentials`, `tiktokCredentials`, `agentProfile`, `kbEntry`, `template`, `agentTestRun`, `calendarSettings`, `booking`, `offeredSlot`, `zoomCredentials`, `googleCredentials`, `agentTestCase`, `adAttribution`, `conversionEvent`, `capiSettings`, `aiCredentials`, `dispatch`, `webhookEvent`, `quickReply`, `conversationNote`.
- **Autenticación:** Better Auth con plugin organization (`src/lib/auth/`).
- **Seguridad:** Cifrado simétrico AES-256-GCM (`src/lib/crypto/`).
- **Tiempo Real:** Server-Sent Events (SSE) vía bus en memoria por organización (`src/server/events/bus.ts`).
- **Ingesta:** Webhooks de Meta para WhatsApp, Instagram y Messenger, con outbox de webhook eventos persistidos antes de procesamiento (`src/server/webhooks/`).
- **Despacho hacia cerebro de IA:** Despacho persistido en `dispatch` con ráfaga de mensajes coalescida (`AGENT_COALESCE_MS`) y firma HMAC hacia Nea u otro agente externo.

---

## 4. Análisis de Brechas (Gap Analysis) y Plan de Mapeo

| Componente / Área | Estado Actual (Vocero) | Requerimiento Wachato CRM | Estrategia de Migración / Evolución |
|---|---|---|---|
| **Tokens & Theme** | Variables en `globals.css` y `tailwind.config.ts` enfocadas en tonos Vocero pizarra/marino. | Tokens idénticos al prototipo: `#0D1920`, `#13222B`, `#00C4C0` (turquesa), `Nunito` y `Plus Jakarta Sans`. | Ajustar variables CSS en `globals.css`, configurar `tailwind.config.ts` y fuentes Google de Next.js sin romper selectores existentes. |
| **App Shell & Navegación** | Shell con menú lateral dinámico por banderas y roles. | Sidebar fija 228px con logo SVG "wachat", navegación con contadores `.count` en turquesa, tarjeta `.biz`. | Actualizar `AppNav` y `AppShell` para adoptar la estructura, tipografía y estilo visual exacto del prototipo. |
| **Contactos & Empresas** | Solo tabla plana `contact`. No existe concepto de empresas corporativas B2B ni campos libres tipados. | Contactos universales con múltiples teléfonos, DNI/cédula, tabla `companies` y relación N:M `company_contacts`. Campos personalizados dinámicos (`custom_fields`, `custom_field_values`) JSONB indexados con GIN. | Migración aditiva en Drizzle: tablas `companies`, `company_contacts`, `custom_fields`, `custom_field_values`. Mantener intacta `contact.wa_identity`. |
| **Exportación de Contactos** | No existe exportador en la vista de contactos. | Exportación nativa directa a Excel (`.xlsx`) y PDF horizontal (`.pdf`). | Implementar librerías de generación/exportación de archivos en cliente/servidor. |
| **Bandeja (Inbox)** | Bandeja funcional de 3 paneles pero con diseño previo de tarjetas y sin simulador de cliente. | Diseño exacto del prototipo con switch "Simular cliente" vs. "Responder como equipo", monitor de ventana 24h, agendamiento rápido y panel lateral. | Refactorizar componentes en `src/components/inbox/` conservando los contratos de streaming, SSE y envío seguro. |
| **Pipeline (Kanban)** | Tablero Kanban básico por `pipeline_stage`. | Kanban drag & drop con selección de evento Meta CAPI por columna, recálculo económico en vivo por etapa y estilo del prototipo. | Extender modelo con soporte para tratos (`deals`) y pipelines múltiples, integrando el selector de evento CAPI en cabecera de columna. |
| **Notas de Voz (Whisper)** | Solo descarga/almacenamiento de archivos de audio. | Transcripción automática de audios entrantes `audio/ogg` mediante modelo Whisper (Groq/OpenAI compatible), indexando el texto y etiquetándolo como `[Nota de voz transcrita]`. | Añadir servicio en segundo plano que procese audios entrantes y actualice el cuerpo del mensaje y el contexto para el agente. |
| **Automatizaciones** | Lógica de negocio dispersa; sin runner persistente. | Sistema de colas en base de datos (`automation_jobs`), concurrencia segura con `FOR UPDATE SKIP LOCKED` y vista gráfica horizontal de flujos. | Crear tabla `automation_jobs`, runner asíncrono y vista en `src/app/(app)/automations` (o mapeada a la navegación correspondiente). |
| **Motor de Módulos** | Monolito sin modularización sectorial; banderas booleanas globales (`AGENDA`, `CHANNELS`). | Arquitectura de módulos estáticos precompilados en `modules/{module_id}/` (restaurantes, clínicas, e-commerce, marketing, inmobiliarias, servicios, educación, logística) con activación persistida en `module_installations`. | Crear estándar `src/lib/modules/`, tabla `module_installations`, inyección de navegación y router dinámico de tools para el agente. |
| **Entrenamiento de IA** | Configuración básica de perfil y tabla `kb_entry` sin estructura por bloques ni simulador en vivo. | Vista de 2 columnas con barra de score (0-100%), 5 pasos estructurados (negocio, servicios, Q&A, reglas, docs) y Sandbox interactivo sticky. | Diseñar la pantalla de entrenamiento con persistencia en `agent_profile`, `kb_entry` y campos ampliados, proveyendo API para el sandbox interactivo. |
| **Seguridad & RBAC** | Roles básicos `owner`, `admin`, `member`. | RBAC granular: Superadmin, Administrador, Operador, Recepcionista, Solo Lectura con `assertPermission()`, y bitácora `audit_logs`. | Extender catálogo de roles, añadir helper de verificación y tabla `audit_logs`. |
| **Backups & Telemetría** | Scripts manuales; `/api/health` básico. | Respaldo nativo PostgreSQL `pg_dump` comprimido `.sql.gz`, exportador ZIP total de datos + medios, y telemetría `/api/agency/health`. | Implementar endpoints y utilidades de respaldo protegidas. |

---

## 5. Verificación de la Línea Base (Gates Ejecutados)

Para constatar que partimos de una base 100% estable, se corrieron los comandos de verificación obligatorios:

```bash
# 1. Chequeo estático de tipos
$ pnpm typecheck
> tsc --noEmit
# Resultado: Salida limpia, Código de salida 0.

# 2. Verificación de estilo y reglas de lint
$ pnpm lint
> eslint .
# Resultado: 0 advertencias, 0 errores, Código de salida 0.

# 3. Suite completa de pruebas unitarias y contratos
$ pnpm test
> vitest run
# Resultado:
# Test Files  122 passed (122)
# Tests       1389 passed (1389)
# Duration    15.64s
# Código de salida 0.
```

---

## 6. Conclusión de la Fase 0

La auditoría confirma que el repositorio base cuenta con una arquitectura sólida y limpia sobre la cual construir la evolución a Wachato CRM.
Los contratos de Meta, Better Auth, el outbox de webhooks y el despacho al agente externo (`/api/bot/*`) se preservarán intactos conforme a las reglas innegociables.
La Fase 0 queda formalmente completada y documentada.
