# ADR 0018 — Nori: chat privado y mascota vegetal

Fecha: 2026-11-27
Estado: ACEPTADO por instrucción del responsable

El responsable solicita que el Centro de IA sea un chat y que su mascota se
llame Nori, una plantita. Se mantiene la ruta y los seis agentes habilitados.
Nori es la identidad conversacional de esas herramientas, no un noveno agente
ni un sustituto del logo oficial. Ilustración SVG original con colores de marca;
sin reutilizar código del prototipo ni proveedores gráficos externos.

## Conversación y persistencia

Mensajes propios y respuestas en burbujas, historial privado, nuevo chat,
selección de tema/recurso y fuentes por respuesta. Enter envía; Shift+Enter
permite salto. Los mensajes cortos, como «Hola», son válidos. No envíos al pulsar
una sugerencia: solo prepara el texto. Sin presencia ni streaming simulados.

Cada conversación conserva su agente y contexto autorizado. Para cambiar tema,
material o periodo se abre otra. Si cambian datos/permisos que originaron el
contexto, se bloquea la consulta de ese historial y se solicita nuevo chat;
no reutilizar respuestas que pudieran revelar una oferta retirada u otro recurso.

Nuevas tablas `conversaciones_ia` y `turnos_ia`. Mensajes y respuestas se recuperan
desde SQL; no localStorage. A diferencia del endpoint de consultas aisladas del
ADR 0017, el chat **sí guarda las preguntas** para permitir el historial pedido.
Esto sustituye la regla de no conservar preguntas únicamente para el canal de
chat. No se guardan prompts de sistema ni se copian preguntas a logs/auditoría.
La interfaz informa el guardado y pide no incluir claves ni datos innecesarios.
Plazo/purga, exportación integral y políticas productivas siguen pendientes.

## Memoria y límites

El backend recupera hasta dos intercambios anteriores completados, acotando
longitud y bytes. El navegador no puede inyectar un historial de roles o mensajes
de sistema. El historial conversacional es información no confiable, no fuente
de hechos; las fuentes actuales autorizadas siguen siendo la evidencia.
Prompt adicional Nori versionado como `+nori-1` en la ejecución.

Permisos, sesión, ZDR, cuotas, timeout, validación y bloqueo de acciones del
ADR 0017 continúan vigentes. UUID por usuario para crear chat y enviar mensaje;
concurrencia no duplica llamadas. Un turno interrumpido no se reenvía solo.
Consulta del resultado pendiente con pestaña visible, sin volver a llamar Groq.
Reintento de fallo prepara un nuevo mensaje y exige envío humano explícito.

## Comprobación

Pruebas SQL por motor, fusión del historial, compilación y dos turnos reales con
Groq usando fixtures nuevos en base de pruebas. Ilustración renderizada e
inspeccionada como imagen local. La imagen no acredita la pantalla completa:
el navegador CUA continúa no disponible. Teclado, lector y responsive siguen
pendientes de revisión manual. Sin cambios a inicio, MySQL80 o despliegue.
