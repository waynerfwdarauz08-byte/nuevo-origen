# Política de uso de IA — Nuevo Origen

Versión: 0.1
Estado: BORRADOR DE DISEÑO
Fecha: 2026-11-24

## 1. Propósito

Explicar qué asistencia proporciona la IA, sus límites
y cómo se revisan sus resultados.

## 2. Funciones

La IA podrá:
- Orientar sobre el uso de la plataforma.
- Sugerir clasificación de materiales.
- Explicar coincidencias entre oferta y necesidad.
- Sugerir aprovechamientos respaldados.
- Responder sobre documentos autorizados.
- Redactar borradores de seguimiento.
- Explicar indicadores calculados.
- Detectar información faltante para revisión.

## 3. Límites

La IA no:
- Certifica materiales.
- Garantiza compatibilidad.
- Fija precios.
- Acepta acuerdos.
- Confirma entregas.
- Publica por iniciativa propia.
- Cambia permisos.
- Envía mensajes comerciales sin confirmación.
- Inventa fuentes o beneficios ambientales.

## 4. Revisión humana

La persona debe revisar las sugerencias antes de utilizarlas.
Las acciones operativas requieren un usuario autorizado.

Las respuestas deben distinguir hechos documentados,
declaraciones de la empresa y sugerencias.

## 5. Fuentes

Las consultas documentales deben señalar referencias verificables.
Cuando no exista evidencia suficiente, la respuesta debe decirlo.

Una cita no garantiza por sí sola que el material sea apropiado
para un uso particular.

## 6. Datos

Solo se utilizará el contexto necesario y autorizado.
No introducir secretos ni datos personales innecesarios.

Los documentos privados conservarán sus restricciones.
El sistema debe aplicar esas restricciones antes de consultar IA.

Proveedor y modelo autorizados: Groq/openai/gpt-oss-120b, ADR 0015.
La implementación local transmite pregunta y contexto mínimo autorizado desde
backend. La retención cero se configura en la cuenta y confirma el operador;
no se activa mediante una variable local. Los seis asistentes habilitados y
los dos documentales pendientes se detallan en ADR 0017. La política sigue
siendo borrador: no equivale a condiciones productivas aprobadas.

El chat Nori guarda preguntas y respuestas en un historial privado para su
titular (ADR 0018), con aviso junto al cuadro de mensaje. El backend recupera
hasta dos intercambios previos acotados para continuar la conversación con Groq.
Las preguntas no se copian a logs ni auditoría. No introducir claves o datos
innecesarios. Plazos/purga y políticas productivas siguen pendientes.

## 7. Errores y correcciones

La IA puede producir resultados incorrectos o incompletos.
El sistema debe permitir reportar respuestas problemáticas.

Canal de reporte: PENDIENTE.

Las correcciones no deben alterar retroactivamente
la evidencia de una operación confirmada sin trazabilidad.

## 8. Transparencia

Identificar las respuestas generadas por IA.
Distinguir simulación, recomendación y operación ejecutada.
No presentar un asistente simulado como IA conectada.

## 9. Condiciones de publicación

Verificar:
- Agentes implementados.
- Permisos.
- Fuentes.
- Proveedor.
- Tratamiento de datos.
- Canal de reporte.
- Confirmaciones humanas.
