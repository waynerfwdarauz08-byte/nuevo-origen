# Nori — Chat del Centro de IA

Abrir `/mi-espacio/ia` con sesión vigente. Nori es la plantita asistente de
Nuevo Origen: conserva los permisos y fuentes de los agentes existentes.
No cambia el logo ni el alcance de los módulos de negocio.

## Prueba manual pendiente

1. Entrar y abrir Centro de IA. Comprobar mascota, bienvenida y cuadro de mensaje.
2. Escribir «Hola». Enviar con botón o Enter. Ver mensaje propio y respuesta real.
3. Preguntar «¿Podés explicar mejor lo anterior?». Comprobar continuidad.
4. Recargar: deben recuperarse ambos mensajes y respuestas desde SQL.
5. Crear otro chat. Abrir «Tus conversaciones» y volver al anterior.
6. En un chat nuevo, desplegar «¿Sobre qué querés conversar?», elegir ayuda y
   un recurso propio o periodo. Revisar fuentes y advertencias de su respuesta.
7. Una sugerencia solo rellena texto: no envía hasta confirmarlo.
8. Probar Shift+Enter para salto, Enter para enviar y composición de teclado.
9. Si falla Groq, revisar mensaje de error. «Preparar un nuevo intento» solo
   rellena el cuadro; no cobra/envía otra consulta por sí mismo.
10. Probar otro usuario/empresa: no debe listar ni abrir los chats de la primera.
11. Cambiar permiso o datos del recurso: ese chat debe pedir iniciar uno nuevo,
    sin mostrar contenido cuyo contexto autorizado ya cambió.
12. Revisar teclado, lector, foco, 360/768/1440 px, desplazamiento del historial,
    cuadro de entrada y ausencia de cortes/solapamientos. Pendiente: sin navegador CUA.

El historial carga veinte turnos por página y conserva los anteriores al
actualizar. El modelo recibe solo dos intercambios previos acotados, no toda la
conversación. No introducir secretos. Las preguntas sí se guardan en SQL para
esta función; no se incluyen en auditoría ni logs. Ver ADR 0018.

La identidad amigable no cierra AG-04/05, documentos, RAG, Drive ni evaluación
de 40 casos. No hay envío de mensajes comerciales, publicación o aceptación
automática. No se añadieron dependencias de aplicación.

## Evaluación técnica real

Desde `backend/`, `npm run nori:evaluate`: crea fixtures nuevos en la base
exclusiva de pruebas y hace dos consultas reales a Groq. Consume cuota.
El resultado se guarda en `.local/nori-evaluation.json`, sin clave ni texto
completo. No ejecutar repetidamente para eludir límites de Groq.

Se ejecutó el 2026-11-27: dos turnos completados, una fuente por respuesta,
Nori identificada y ambos turnos recuperados desde SQL. Esto no acredita
calidad general ni recorrido visual. Ver TASKS.md para regresión final.
