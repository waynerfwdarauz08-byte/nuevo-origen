# ADR 0015 — Groq y modelo autorizados para IA

Fecha: 2026-11-27
Estado: DECISIÓN ACEPTADA; integración y evaluación sujetas a evidencia

El responsable autorizó Groq con `openai/gpt-oss-120b` después de comparar Groq
y Gemini. Se conserva ADR 0001 como antecedente; este ADR cierra su elección
pendiente de proveedor/modelo, sin reescribirlo.

- Proveedor: GroqCloud; modelo configurable, inicialmente openai/gpt-oss-120b.
- Solo backend conserva la clave. Ningún secreto VITE ni clave en repositorio.
- Antes de enviar contexto privado, confirmar retención cero en la cuenta y
  documentar finalidad/destinatario. Sin esa confirmación, solo contexto público
  depurado o datos ficticios de evaluación. No afirmar ZDR por activar una variable
  local: la variable registra una confirmación humana del ajuste del proveedor.
- Salidas estructuradas con validación independiente, fuentes autorizadas y
  herramientas limitadas. No pagos, publicaciones, roles ni decisiones autónomas.
- Tiempo total máximo, cuotas y seguimiento sin registrar prompts privados en logs.
- El modelo debe superar el banco del anteproyecto; su selección no acredita
  calidad, ausencia de fugas ni cumplimiento de los ocho agentes.
- No hay clave configurada todavía. Fallar de forma explícita sin simular IA.

Fuentes oficiales consultadas: [modelos/precios](https://console.groq.com/docs/models),
[salidas estructuradas](https://console.groq.com/docs/structured-outputs),
[datos y retención](https://console.groq.com/docs/your-data).
Groq contempla excepciones de retención para ciertas funciones/abuso, controlables
desde la cuenta; el responsable debe confirmar su configuración y condiciones.
Los proyectos de Render, Vercel y Supabase aún no fueron creados por el responsable.
