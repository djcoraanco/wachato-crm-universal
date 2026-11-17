# Bitácora de Implementación — Fase 6: Plataforma de IA, Dynamic Tool Router y Sandbox de Entrenamiento

## Resumen Ejecutivo
Se implementó la suite completa de Inteligencia Artificial de Wachato CRM Universal acorde a `specs/design/wachato-prototype.html`:
1. **Dynamic Context-Aware Tool Router**: Inyección contextualizada en runtime de las herramientas de los módulos activos (`m.status === "active"`) en `/api/bot/profile` sin sobrecargar el contexto del LLM.
2. **Vista de Agentes (`#agentes` / `/agent`)**:
   - Selector tripartito de modo de atención: "Agente Wachato" vs. "Agente externo del cliente" vs. "Mixto (con fallback automático de 10s)".
   - Catálogo multi-proveedor de IA: Anthropic (Claude), OpenAI (ChatGPT), Google Gemini, Mistral, DeepSeek y Custom/OpenRouter con prueba interactiva de conexión y cifrado AES-256-GCM.
   - Reglas declarativas de traspaso a humano (solicitud explícita de persona, queja/reclamo, dudas médicas, fuera de horario).
   - Configuración de agente externo con webhook, secreto HMAC, especificación del payload JSON de Wachato y probador de conectividad.
3. **Vista de Entrenar IA (`#entrenar` / `/agent/training`)**:
   - Layout de 2 columnas: 5 pasos de entrenamiento a la izquierda y Sandbox sticky interactivo a la derecha.
   - Medidor superior dinámico del 0 al 100% de entrenamiento (`trainScore`).
   - 5 bloques de conocimiento: Información del negocio, Servicios y precios, Q&A con keywords, Instrucciones y límites, Documentos y lectura web.
   - Probador en vivo interactivo con chips de prueba rápida y citas de fuentes de conocimiento en las respuestas.

## Migración Drizzle Aditiva
- Archivo generado: `drizzle/0028_stiff_blindfold.sql`.
- Columnas añadidas a `agent_profile`: `mode`, `external_webhook_url`, `external_secret`, `handoff_rules`, `business_info`.

## Verificación de Gates
- `pnpm typecheck`: 0 errores.
- `pnpm lint`: 0 errores.
- `pnpm test`: 122 suites pasadas, 1389 pruebas exitosas.
