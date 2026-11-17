# PLAN MAESTRO DE EJECUCIÓN — WACHATO CRM UNIVERSAL

> **Referencia de Diseño:** `specs/design/wachato-prototype.html`  
> **Modo Operativo:** Autónomo, Incremental, Spec-Driven Development (SDD), Tareas Atómicas y Verificación por Puertas (Gates: `pnpm typecheck` && `pnpm lint` && `pnpm test`).  
> **Convención de Estados:**  
> - `[ ] PENDIENTE`  
> - `[>] EN DESARROLLO`  
> - `[X] COMPLETADO`  
> - `[!] BLOQUEADO`  

---

## RESUMEN DE PROGRESO GLOBAL

- **FASE 0: Auditoría Inicial, Línea Base e Inspección del Prototipo** — `[X] COMPLETADO (100 %)`
- **FASE 1: Design System Wachato y App Shell en Next.js 15** — `[X] COMPLETADO (100 %)`
- **FASE 2: Core CRM Universal y Modelo Extendido** — `[ ] PENDIENTE (0 %)`
- **FASE 3: Bandeja en Tiempo Real, Medios Vocales y Conexiones** — `[ ] PENDIENTE (0 %)`
- **FASE 4: Motor Modular Nativo y SDK** — `[ ] PENDIENTE (0 %)`
- **FASE 5: Automatizaciones Persistentes (DB-Backed) y Calendario** — `[ ] PENDIENTE (0 %)`
- **FASE 6: Plataforma de IA, Entrenamiento y Sandbox** — `[ ] PENDIENTE (0 %)`
- **FASE 7: Módulos Sectoriales Oficiales** — `[ ] PENDIENTE (0 %)`
- **FASE 8: Seguridad, Backups, Telemetría de Agencia y Release** — `[ ] PENDIENTE (0 %)`

---

## DESGLOSE DETALLADO DE FASES Y TAREAS

### FASE 0: Auditoría Inicial, Línea Base e Inspección del Prototipo
- [X] **Tarea 0.1:** Inspección de repositorios locales (`src/`, `drizzle/`, `specs/design/wachato-prototype.html`).
- [X] **Tarea 0.2:** Generación del documento de auditoría `docs/implementation/00-auditoria.md` con mapeo exhaustivo.
- [X] **Tarea 0.3:** Creación del archivo de seguimiento maestro `docs/UNIVERSAL_CRM_MASTER_PLAN.md`.
- [X] **Tarea 0.4:** Ejecución y documentación de gates de línea base (`pnpm typecheck`, `pnpm lint`, `pnpm test`).

---

### FASE 1: Design System Wachato y App Shell en Next.js 15
*Objetivo: Replicar con fidelidad 100% los tokens visuales, tipografías y cascarón del prototipo HTML en Next.js 15 App Router.*
- [X] **Tarea 1.1:** Configurar Tailwind (`tailwind.config.ts`), fuentes Google (`Nunito` 800/900 y `Plus Jakarta Sans`) y variables CSS de Wachato (`globals.css`) con soporte dark/light nativo.
- [X] **Tarea 1.2:** Construir el App Shell responsivo (`Sidebar` de 228px con logo SVG interactivo de Wachato, navegación con badges `.count`, separador, tarjeta `.biz`, y `Topbar` con estado de entorno y fecha).
- [X] **Tarea 1.3:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y redacción de bitácora `docs/implementation/01-design-system.md`.

---

### FASE 2: Core CRM Universal y Modelo Extendido
*Objetivo: Extender el modelo de datos relacional para empresas B2B, campos personalizados dinámicos JSONB indexados con GIN, pipelines múltiples y tratos.*
- [X] **Tarea 2.1:** Migraciones aditivas en Drizzle para Contactos y Empresas (`companies`, `company_contacts`).
- [X] **Tarea 2.2:** Sistema de Campos Personalizados (`custom_fields`, `custom_field_values`) con validación Zod y JSONB indexado en PostgreSQL.
- [X] **Tarea 2.3:** Pipelines múltiples y Tratos (`deals`) con registro de etapas y eventos Meta Conversions API (CAPI).
- [X] **Tarea 2.4:** Implementar vista de Contactos según el prototipo (búsqueda, filtros, tabla y exportadores nativos a Excel `.xlsx` y PDF horizontal `.pdf`).
- [X] **Tarea 2.5:** Implementar vista de Pipeline Kanban interactivo con drag-and-drop, recálculo económico en vivo y selectores de evento CAPI en columnas.
- [X] **Tarea 2.6:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/02-core-crm.md`.

---

### FASE 3: Bandeja en Tiempo Real, Medios Vocales y Conexiones
*Objetivo: Llevar la bandeja al diseño exacto de 3 columnas del prototipo, integrar Whisper para notas de voz y la vista de conexiones de Meta.*
- [X] **Tarea 3.1:** Refactorizar la Bandeja interactiva con 3 paneles, filtros (Todos, WA, IG, FB, Humano), switch "Simular cliente" vs. "Responder como equipo", monitor visual de ventana de 24h con bloqueo de texto libre y selector de plantillas, toggle "IA responde" y panel lateral de contacto.
- [X] **Tarea 3.2:** Pipeline de notas de voz entrantes (`audio/ogg`) con transcripción automática Whisper (Groq/OpenAI compatible), visualización en chat y pase al contexto del agente como `[Nota de voz transcrita]`.
- [X] **Tarea 3.3:** Implementar vista de Conexiones y Meta (`#conexiones`: estado de canales, requisitos Meta, tabla de plantillas y log de eventos CAPI en tiempo real).
- [X] **Tarea 3.4:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/03-bandeja-medios.md`.

---

### FASE 4: Motor Modular Nativo y SDK
*Objetivo: Arquitectura precompilada en `modules/{module_id}/` con activación/desactivación dinámica en base de datos (`module_installations`).*
- [X] **Tarea 4.1:** Definir arquitectura y SDK en `src/lib/modules/` (`manifest.ts`, `schema.ts`, `navigation.ts`, `routes/`, `services/`, `tools.ts`) y persistencia en `module_installations`.
- [X] **Tarea 4.2:** Catálogo de Módulos en la interfaz (`Configuración → Módulos`) para activación/desactivación con 1 clic sin recompilación en runtime.
- [X] **Tarea 4.3:** Middleware de protección de rutas y filtrado dinámico del menú según módulos instalados.
- [X] **Tarea 4.4:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/04-motor-modulos.md`.

---

### FASE 5: Automatizaciones Persistentes (DB-Backed) y Calendario
*Objetivo: Motor de automatizaciones transaccional en PostgreSQL sin Redis (`FOR UPDATE SKIP LOCKED`) y vista de calendario semanal.*
- [X] **Tarea 5.1:** Esquema `automation_jobs`, runner asíncrono con concurrencia segura `SKIP LOCKED`, reintentos exponenciales y prevención de loops.
- [X] **Tarea 5.2:** Vista de Automatizaciones (`#automatizaciones`: tarjetas, diagramas paso a paso, contadores de ejecuciones, alertas de handoff con Web Push / Webhook).
- [X] **Tarea 5.3:** Vista de Calendario semanal (`#calendario`: citas visuales de IA vs. equipo, sincronización Google Calendar y agendamiento directo).
- [X] **Tarea 5.4:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/05-automatizaciones-calendario.md`.

---

### FASE 6: Plataforma de IA, Entrenamiento y Sandbox
*Objetivo: Configuración de motor de IA multi-proveedor, enrutador dinámico de herramientas y pantalla de entrenamiento con sandbox interactivo sticky.*
- [ ] **Tarea 6.1:** Dynamic Context-Aware Tool Router: `/api/bot/profile` expone exclusivamente herramientas de módulos activos para no saturar el contexto del LLM.
- [ ] **Tarea 6.2:** Vista de Agentes (`#agentes`: selector de modo Wachato / Externo / Mixto con fallback de 10s, claves API multi-proveedor cifradas y reglas de escalado a humano).
- [ ] **Tarea 6.3:** Vista de Entrenar IA (`#entrenar`: medidor de progreso 0-100%, 5 bloques de conocimiento estructurado y Sandbox interactivo sticky con chips de prueba rápida).
- [ ] **Tarea 6.4:** Ejecución de Gates (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/06-ia-entrenamiento.md`.

---

### FASE 7: Módulos Sectoriales Oficiales
*Objetivo: Implementar los 8 módulos precompilados de Wachato.*
- [ ] **Tarea 7.1:** Módulo Restaurantes (`modules/restaurants`: mesas, zonas, menú QR, comandas y tickets ESC/POS; tools de IA para menú y reservas).
- [ ] **Tarea 7.2:** Módulo Clínicas y Salud (`modules/clinics`: doctores, agenda médica, citas con confirmación WhatsApp 24h previas, privacidad estricta de expediente médico aislado del bot).
- [ ] **Tarea 7.3:** Módulo E-Commerce y Retail (`modules/ecommerce`: catálogo, SKUs, variantes, stock multialmacén, carrito por chat y links Stripe/MercadoPago).
- [ ] **Tarea 7.4:** Módulo Marketing y Agencias (`modules/marketing`: atribución CAPI, UTMs, entregables de clientes y webhooks n8n/Make).
- [ ] **Tarea 7.5:** Módulos Inmobiliaria, Servicios Profesionales, Educación y Logística (`modules/real-estate`, `modules/professional-services`, `modules/education`, `modules/logistics`).
- [ ] **Tarea 7.6:** Ejecución de Gates para todos los módulos (`pnpm typecheck` && `pnpm lint` && `pnpm test`) y bitácora `docs/implementation/07-modulos-sectoriales.md`.

---

### FASE 8: Seguridad, Backups, Telemetría de Agencia y Release
*Objetivo: Blindaje empresarial, auditoría, respaldo integral, analíticas y verificación para producción.*
- [ ] **Tarea 8.1:** RBAC granular (Superadmin, Administrador, Operador, Recepcionista, Solo Lectura con `assertPermission()`) y bitácora inmutable `audit_logs`.
- [ ] **Tarea 8.2:** Motor de backups nativo PostgreSQL con `pg_dump` comprimido `.sql.gz` y función "Export All" a ZIP (base de datos + medios).
- [ ] **Tarea 8.3:** Vista de Estadísticas (`#estadisticas`: KPIs con deltas comparativos, barras apiladas multicanal por día, embudo visual y tabla de atribución de anuncios).
- [ ] **Tarea 8.4:** Telemetría para agencias (`GET /api/agency/health` protegido por `AGENCY_API_KEY`) y asistente de presets iniciales por rubro.
- [ ] **Tarea 8.5:** Compilación final de producción (`pnpm build`), suite completa de tests de regresión y bitácora `docs/implementation/08-release-final.md`.
