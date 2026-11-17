# Bitácora de Implementación — Fase 5: Automatizaciones Persistentes y Calendario

## 1. Resumen Ejecutivo
Se implementó el motor de automatizaciones transaccional en PostgreSQL de **Wachato CRM Universal** prescindiendo totalmente de Redis y temporizadores volátiles en memoria Node.js (Regla Innegociable 3). Toda tarea programada o diferida se serializa en la tabla `automation_job` y es procesada por un runner con concurrencia segura mediante `FOR UPDATE SKIP LOCKED`. Asimismo, se desarrollaron las vistas de Automatizaciones (`/automations`) y de Calendario Semanal (`/calendar`) fieles a `specs/design/wachato-prototype.html`.

---

## 2. Motor Transaccional de Automatizaciones (`src/server/automations/runner.ts`)
1. **Reclamo de Trabajos Concurrente (`claimNextPendingJob`):**
   - Utiliza `.for("update", { skipLocked: true })` de Drizzle ORM sobre `automation_job` para garantizar que múltiples instancias o workers nunca tomen el mismo trabajo ni se bloqueen entre sí.
   - Pasa el estado a `processing` y anota `locked_at` y `locked_by`.
2. **Ejecutor de Pasos (`processJob`):**
   - Acción `send_message`: Verifica si la ventana de 24 h de Meta está abierta antes de enviar texto libre.
   - Acción `move_stage`: Transición transaccional de etapa del lead mediante `moveLeadToStage` registrando la bitácora de auditoría.
   - Reintentos exponenciales con cálculo de backoff (`2 ^ attempts` minutos) hasta alcanzar `max_attempts`.
3. **Planificador Diferido (`scheduleAutomationJob`):**
   - Inserta nuevos jobs diferidos con fecha y hora `runAt` programada.

---

## 3. Pantalla de Automatizaciones (`/automations`)
- Muestra el listado de flujos con contadores reales de ejecuciones (`ejecuciones registradas`).
- Visualizador horizontal de pasos (`Trigger → Acción 1 → Acción 2 → Espera`).
- Interruptor accesible `<Switch />` para pausar o activar automatizaciones al instante.
- Cumplimiento de políticas de Meta en cada flujo.

---

## 4. Pantalla de Calendario Semanal (`/calendar`)
- Rejilla semanal interactiva con horas laborables de 9:00 a. m. a 6:00 p. m.
- Distintivo visual de citas agendadas:
  * Agendadas por IA: turquesa corporativo Wachato (`#00C4C0`).
  * Agendadas por Equipo: azul (#5B97F7).
- Indicador de sincronización con Google Calendar (`Google Calendar conectado`).
- Enlace oficial integrado en la barra de navegación lateral (`src/components/app-nav.tsx`).

---

## 5. Verificación de Calidad y Gates
- **TypeScript (`pnpm typecheck`):** 0 errores.
- **ESLint (`pnpm lint`):** 0 errores, 0 advertencias.
- **Vitest (`pnpm test`):** 122 suites pasadas, 1389 pruebas pasadas al 100%.
