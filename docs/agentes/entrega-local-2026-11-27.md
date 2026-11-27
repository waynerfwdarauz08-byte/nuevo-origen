# Centro de IA local — 2026-11-27

## Implementado

Ruta privada `/mi-espacio/ia`, visible en el menú. Catálogo según permisos,
selección de recursos persistidos con páginas, pregunta, carga, errores,
respuesta en texto, enlaces de fuentes, limitaciones e historial propio.
No se rediseñó el inicio ni se copiaron recursos técnicos del prototipo.

Servicios independientes para AG-01/02/03/06/07/08, prompts 1.0.0 y herramientas
de lectura. Backend verifica permisos y pertenencia antes de la red y revalida
sesión/contexto al terminar. Sin herramientas de escritura ni envío automático.
AG-04/05 aparecen pendientes por falta de corpus autorizado/RAG.

Cuotas transaccionales: 20 consultas/usuario y 100/empresa por día UTC. Las
ejecuciones fallidas consumen el cupo reservado: pueden haber consumido Groq.
100 intentos/IP/15 min adicionales en memoria. Una consulta simultánea por usuario;
interrupciones pendientes no se reejecutan automáticamente. Tiempo máximo de
red 30 s; cliente 40 s. Retry-After del proveedor conservado, sin reintentos
automáticos; la espera se comparte por modelo y no revela actividad ajena.

UUID por usuario: mismo contenido y contexto reutiliza respuesta completada;
otros contenidos/contextos se rechazan. «Nueva consulta» genera otra clave al
enviar y puede consumir cuota. No reenviar repetidamente tras un error de límite.

Migración aditiva `20261127000300-agentes-ejecuciones.js`: tablas `agentes` y
`ejecuciones_ia`, FK y unicidad usuario/clave. Aplicada en desarrollo MySQL,
desarrollo PostgreSQL y pruebas de ambos motores. No se borraron datos existentes.
MySQL 3307 sigue activo; MySQL80 no se modifica. La baseline PostgreSQL previa
no se reescribió. El adaptador incluye bulkInsert en la transacción de migración.

## Evidencia real

El responsable ejecutó `groq:check`: conexión y esquema válidos con retención
cero confirmada por él. Esa bandera no comprueba remotamente el ajuste.

`groq:evaluate` creó fixtures nuevos solo en `nuevo_origen_test`. Groq real
respondió con esquema/fuentes válidos en AG-01/02/03; después devolvió 429 en
los otros tres. No se ocultó ese fallo. Tras la espera, ejecución individual de
AG-06, AG-07 y AG-08 aprobó. Duraciones observadas de respuestas válidas:
2087, 3078, 2270, 2036, 1914 y 1987 ms respectivamente. Tokens reales registrados.
No se enviaron registros de desarrollo/producción como contexto de esas pruebas.

Estos seis casos verifican integración técnica, no precisión semántica general,
40 casos ni meta de 80 %. No se presentan transportes simulados como IA real.

La suite de agentes con SQL real prueba permisos, CSRF, aislamiento, campos
prohibidos, idempotencia/concurrencia, rollback, cifras/fuentes inventadas, baja
durante consulta, historial propio, límite persistido y espera del proveedor.
Última regresión completa: **97/97 en MySQL y 97/97 en PostgreSQL**, cero fallos
u omisiones. Suite focalizada: 18/18 por motor, incluidos agregados globales y
moderación asignada. Frontend: compilación correcta, cuatro pruebas existentes
aprobadas; OpenAPI 0.7.0 validado. No acredita recorrido visual.

## Prueba manual pendiente

1. Reiniciar backend con `npm run dev` desde `backend/` si el proceso no usa watch
   o todavía conserva configuración previa. Frontend: `npm run dev` en `frontend/`.
2. Entrar con administración empresarial y abrir «Centro de IA».
3. AG-01: preguntar qué herramientas permite la función; revisar la fuente.
4. AG-02: seleccionar una oferta propia y pedir campos pendientes. Comprobar que
   no publica ni altera la ficha. No hay análisis de fotografías.
5. AG-03: seleccionar necesidad activa; revisar que solo enumera ofertas reales
   publicadas con unidad/categoría exactas y no promete compatibilidad técnica.
6. AG-06: seleccionar solicitud; revisar estado, acuerdo/entregas cuando existan
   y borrador. Comprobar que no apareció un mensaje nuevo en el chat.
7. AG-07: elegir periodo y contrastar cada cifra con el bloque SQL mostrado.
8. AG-08: elegir borrador propio; revisar observaciones sin publicar.
9. Abrir AG-04/05: deben indicar pendiente, sin respuesta simulada.
10. Revisar historial, recargar y comprobar persistencia de metadatos propios.
    No se conserva la pregunta para reabrir conversaciones. La respuesta actual
    del formulario se pierde al recargar; se conserva internamente para reintento
    de su UUID, no se promete un historial de chats completo.
11. Probar con gestor de materiales, acuerdos, analista, moderador y plataforma:
    solo asistentes permitidos. Caso global requiere asignación; AG-08 global
    consulta únicamente la publicación pública, no evidencia privada excepcional.
12. Revisar teclado, lector, foco, errores y anchos 360/768/1440. Intento CUA:
    host de navegador no disponible. Sin capturas ni revisión visual acreditada.

## Pendientes

RAG/documentos/Drive para AG-04/05, esquemas de salidas especializadas más allá
del contrato común validado, revisión semántica de 40 casos, recomendaciones
persistidas vinculadas oferta-necesidad, visión, embeddings, tarifas fechadas,
plazo/purga de respuestas y metadatos, gestión productiva de cuotas/configuración
y evaluación adversarial ampliada. No declarar RF-15/16/23/24 completos.

Recuperación: el catálogo inicializado por migración solo se reutiliza al importar
un respaldo si coincide íntegramente con él; ninguna otra tabla ocupada se admite.
El respaldo sigue cifrado y la base origen nunca se sobrescribe.
