# ADR 0017 — Agentes locales con Groq, herramientas y cuotas

Fecha: 2026-11-27
Estado: ACEPTADO para la integración local autorizada por el responsable

## Decisión

Integrar Groq desde servicios de agentes independientes y herramientas de dominio
autorizadas antes de llamar al modelo. Mantener diseño, sesión, MySQL activo y
compatibilidad PostgreSQL. No ejecutar herramientas elegidas libremente por el LLM.

- Centro de IA privado. La matriz de permisos existente determina sus asistentes.
- AG-01 clasifica referencias explícitas y consulta el catálogo autorizado; como
  máximo una llamada al modelo por consulta, dentro del máximo de cinco previsto.
- AG-02 consulta ficha propia y categorías/propiedades. Sin visión configurada.
- AG-03 filtra necesidad propia activa, categoría y unidad exactas, disponibilidad,
  empresa activa y restricciones conocidas; excluye incompatibilidades explícitas.
  Propiedades desconocidas quedan pendientes. Hasta 100 ofertas y 6 candidatos;
  no es recomendación exhaustiva, conversión de unidades ni garantía de aptitud.
- AG-06 lee etapa/condiciones e historial de solicitud participante. Solo borrador.
- AG-07 lee indicadores persistidos; empresa propia o agregados globales sin
  identificación empresarial. Rechaza cifras escritas que no aparezcan en el contexto.
  Esta comprobación numérica no acredita por sí sola corrección semántica.
- AG-08 revisa borrador propio o publicación pública de caso asignado. No abre
  evidencia privada excepcional sin el flujo de acceso motivado correspondiente.
- AG-04 y AG-05 permanecen bloqueados: requieren guías/corpus autorizado e índice
  RAG. Groq de texto no autoriza por sí mismo un proveedor de embeddings/visión.
  No sustituirlos por respuestas fijas ni declarar RF-15/16 terminados.

## Controles y trazabilidad

Clave solo backend y confirmación humana de ZDR según ADR 0015. Revalidar sesión,
permisos y contexto después de la llamada: baja, retirada de función o cambio del
recurso impiden entregar una respuesta obsoleta. No mantener bloqueos SQL durante
la red. Citas solo de herramientas autorizadas; enlaces internos construidos por
backend. Respuesta en texto, sin HTML del modelo.

Cuotas de desarrollo: 20 consultas por usuario/día UTC, 100 por empresa/día UTC;
reserva transaccional bloqueando empresa y usuario. Límite adicional de 100
intentos/IP/15 min, en memoria local. Groq puede imponer límites menores y
compartidos por organización: conservar Retry-After, sin reintento automático.

Clave UUID única por usuario evita consumir de nuevo una consulta repetida.
Misma clave con otro contenido o contexto se rechaza. Estado pendiente tras una
interrupción no se reejecuta automáticamente: puede haber consumido al proveedor.

Registrar agente, versión de prompt, usuario/empresa, modelo, estado, duración,
tokens disponibles y referencias. No persistir preguntas/prompts completos.
Respuesta validada privada conservada para reintento del mismo titular, sin
exponerla en listados. Costo nulo hasta establecer tarifa fechada verificable.
Definir plazo/purga de respuestas y metadatos antes de producción; no declarar
RF-22 completo. Versionar prompts al cambiar comportamiento.

## Evidencia y límites

La conexión real fue reportada por el responsable y se ejecutaron consultas
con fixtures nuevos en la base exclusiva de pruebas. Separar pruebas aisladas,
llamadas reales, evaluación humana de calidad y revisión visual. El banco de
40 casos y accesibilidad de la pantalla nueva siguen pendientes de evidencia.
