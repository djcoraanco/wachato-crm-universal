# Bitácora de Implementación — Fase 2: Core CRM Universal y Modelo Extendido

## 1. Resumen Ejecutivo
Se ejecutó la transformación del modelo de datos de Vocero CRM hacia el Core Universal de **Wachato CRM Universal**. Esta fase amplía la capacidad del CRM para admitir escenarios B2B (Empresas y contactos vinculados), campos personalizados dinámicos para cualquier industria, múltiples pipelines de ventas con sincronización directa a Meta CAPI por etapa, gestión de tareas operativas y exportación nativa de contactos a hojas de cálculo Excel (`.xlsx`) y documentos PDF (`.pdf`) horizontales con el branding de Wachato.

---

## 2. Cambios de Base de Datos y Drizzle ORM
Se generó la migración aditiva `drizzle/0026_shallow_centennial.sql` sobre `src/lib/db/schema.ts` e `src/lib/db/ids.ts`:
1. **Prefijos de ID en `src/lib/db/ids.ts`:**
   - `cmp_` (`company`)
   - `cc_` (`companyContact`)
   - `cf_` (`customField`)
   - `cfv_` (`customFieldValue`)
   - `pipe_` (`pipeline`)
   - `dl_` (`deal`)
   - `tsk_` (`crmTask`)
   - `job_` (`automationJob`)
   - `aud_` (`auditLog`)
   - `mod_` (`moduleInstallation`)

2. **Extensión de la tabla `contact`:**
   - `last_name`: Apellidos del contacto.
   - `doc_id`: Documento de identidad fiscal o personal (Cédula, RNC, DNI, RFC, RUT).
   - `phones`: Arreglo JSON de números alternativos.
   - `emails`: Arreglo JSON de correos electrónicos.
   - `email`: Correo principal.
   - `avatar`: URL de avatar personalizado.
   - `birthdate`: Fecha de nacimiento (para promociones y поздравления).
   - `address`: Dirección física estructurada en JSON.
   - `preferred_channel`: Canal de preferencia (`whatsapp`, `instagram`, `messenger`, `tiktok`).
   - `tags`: Etiquetas asociadas en arreglo `text[]`.
   - `privacy_consent`: Consentimiento informado y fecha.
   - `custom_data`: Campo JSONB para atributos flexibles por rubro.

3. **Extensión de la tabla `pipeline_stage`:**
   - `pipeline_id`: Asociación a pipeline específico (soporte multi-embudo).
   - `capi_event`: Nombre del evento de conversión de Meta Conversions API a disparar automáticamente cuando un trato entra a la etapa (`Lead`, `Contact`, `Schedule`, `SubmitApplication`, `InitiateCheckout`, `Purchase`).

4. **Nuevas Tablas Core:**
   - `company`: Empresas u organizaciones B2B (`name`, `legalName`, `taxId`, `industry`, `website`, `phones`, `emails`, `address`, `customData`).
   - `company_contact`: Relación muchos a muchos entre contactos y empresas con rol y departamento.
   - `custom_field`: Definición declarativa de campos personalizados (`entityType`, `code`, `name`, `type`, `options`, `required`, `validationRegex`, `displayOrder`).
   - `custom_field_value`: Valores persistidos por entidad y campo.
   - `pipeline`: Embudo de ventas configurable (`name`, `code`, `isDefault`, `order`).
   - `deal`: Tratos y oportunidades multimoneda asociados a pipeline, contacto y empresa.
   - `crm_task`: Tareas operativas con fecha límite, prioridad, asignación y recordatorio.

---

## 3. Capacidades de Exportación (Excel & PDF)
Se implementó `src/lib/contacts-export.ts` con soporte offline y tipado estricto:
- **Excel (.xlsx):** Generación binaria instantánea con columnas auto-ajustadas y encabezados normalizados.
- **PDF (.pdf):** Documento horizontal en hoja A4 con colores turquesa corporativos de Wachato (`#00C4C0`), encabezados contrastados y filas alternas con tabla paginada mediante `jspdf-autotable`.

---

## 4. Pipeline Kanban con Meta CAPI y Canales
Se conectó la interfaz del Pipeline Kanban (`src/components/pipeline/pipeline-client.tsx`) con:
- Selector de **Evento Meta CAPI** por columna (`Lead`, `Contact`, `Schedule`, etc.) que persiste mediante `PATCH /api/pipeline/stages`.
- Badges de canal en cada tarjeta (`WA` verde, `IG` magenta, `FB` azul, `TT` blanco) y tags visibles.
- Montos y totales calculados en centavos de forma exacta.

---

## 5. Verificación de Calidad y Gates
- **TypeScript:** `pnpm typecheck` $\rightarrow$ 0 errores.
- **ESLint:** `pnpm lint` $\rightarrow$ 0 errores, 0 warnings.
- **Vitest:** `pnpm test` $\rightarrow$ 122 suites pasadas, 1389 pruebas unitarias y de integración exitosas.
