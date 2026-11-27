# ADR 0014 — Mensajería independiente y experiencia privada

Fecha: 2026-11-27
Estado: DECISIÓN AUTORIZADA; ver evidencia técnica en TASKS.md

El responsable solicita revisar y mejorar el proyecto, con mensajería en un
módulo aparte conectado a solicitudes y acuerdos, apariencia de chat y controles
coherentes. RF-11 y P-23 del anteproyecto restringen la conversación a participantes.

- Bandeja independiente en `/mi-espacio/mensajes`. Una conversación por solicitud;
  continúa disponible cuando existe acuerdo. Enlaces recíprocos a las condiciones,
  entregas y material. No crear conversaciones generales sin contexto empresarial.
- Reutilizar los mensajes persistidos, sin trasladarlos ni borrar historial.
  API nueva de mensajería con pertenencia y acuerdos.gestionar vigentes en backend.
  Rutas anteriores compatibles; mismas reglas transaccionales y auditoría.
- Cronología ascendente, historial por cursor, actualización periódica visible y
  suspendida cuando la pestaña está oculta. No fingir WebSockets, presencia,
  lectura, correo ni notificaciones externas.
- Clave de envío generada por cliente, única por autor y persistida; reintentar
  exactamente el mismo envío no duplica mensaje, auditoría ni aviso. Reutilizar
  una clave con otro contenido o solicitud devuelve conflicto.
- Navegación privada común según permisos, controles y foco consistentes, estados
  legibles y confirmaciones sensibles separadas de la conversación. El chat no
  acepta acuerdos ni convierte un mensaje en una orden o publicación automática.
- Conservar logo, Fraunces, DM Sans y paleta vigentes. No copiar código del
  prototipo, incorporar dependencias externas ni rediseñar la portada pública.
- Cambios de esquema aditivos y datos conservados. Revisión visual y responsive
  solo se acreditan con evidencia; compilación no sustituye navegación real.
