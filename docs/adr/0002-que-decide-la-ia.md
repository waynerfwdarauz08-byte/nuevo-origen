# ADR 0002 — Qué decide la IA

Fecha: 2026-11-24
Estado: PROPUESTO PARA RATIFICACIÓN
Base: límites definidos en el anteproyecto

## Contexto

La IA puede ayudar a interpretar materiales y documentos,
pero una respuesta incorrecta puede generar acuerdos inadecuados,
divulgaciones o afirmaciones técnicas sin respaldo.

## Decisión

La IA produce recomendaciones, explicaciones y borradores.
Las personas autorizadas confirman las decisiones operativas.

El backend aplica permisos y reglas de negocio.
Los prompts no sustituyen esos controles.

## Funciones permitidas

| Agente | Función | Límite |
|---|---|---|
| AG-01 | Orientar y enrutar consultas | No concede permisos |
| AG-02 | Sugerir clasificación y campos | No publica ni certifica |
| AG-03 | Explicar compatibilidad | No garantiza aptitud |
| AG-04 | Sugerir aprovechamientos | Requiere respaldo y verificación |
| AG-05 | Consultar documentos autorizados | No consulta corpus ajenos |
| AG-06 | Redactar seguimiento | No envía sin confirmación |
| AG-07 | Explicar indicadores calculados | No inventa cifras |
| AG-08 | Asistir en revisión | No sanciona ni aprueba por sí solo |

Los contratos definitivos deben cotejarse con el anteproyecto.

## Acciones reservadas a personas autorizadas

- Publicar una oferta.
- Aceptar o rechazar condiciones de un acuerdo.
- Confirmar entregas y aprovechamiento.
- Resolver discrepancias.
- Cambiar roles.
- Aprobar documentos.
- Enviar mensajes comerciales.
- Fijar precios o condiciones.
- Autorizar integraciones.

## Acciones prohibidas para la IA

- Ejecutar SQL arbitrario.
- Leer secretos.
- Elegir libremente archivos o empresas.
- Cambiar reglas de acceso.
- Borrar datos por iniciativa propia.
- Certificar composición o seguridad.
- Inventar fuentes, porcentajes o impactos ambientales.
- Ejecutar instrucciones encontradas dentro de documentos externos.

## Recuperación documental

1. Autenticar al usuario.
2. Resolver permisos y empresa desde la sesión.
3. Filtrar documentos autorizados y vigentes.
4. Recuperar fragmentos.
5. Generar respuesta.
6. Verificar que las referencias corresponden al contexto utilizado.

Un documento retirado no debe seguir siendo recuperable.
La invalidación debe cubrir índice y cachés aplicables.

## Compatibilidad de materiales

Distinguir:
- Propiedades declaradas.
- Propiedades verificadas.
- Información desconocida.
- Coincidencias.
- Restricciones y datos faltantes.

No convertir una coincidencia documental en una certificación.
No usar porcentajes sin metodología definida.

## Salidas estructuradas

Definir esquemas por agente que incluyan, cuando corresponda:
- Resumen.
- Sugerencias.
- Fuentes.
- Datos faltantes.
- Limitaciones.
- Acción propuesta.
- Necesidad de confirmación.

El backend debe rechazar salidas inválidas.

## Fallos

Si falta evidencia:
- Expresarlo.
- Solicitar información concreta.
- No completar hechos por suposición.

Si falla el proveedor:
- Informar indisponibilidad.
- Conservar el trabajo del usuario cuando sea posible.
- No presentar un texto fijo como análisis real.

## Verificación

Probar:
- Acceso autorizado y denegado.
- Documento de otra empresa.
- Documento retirado.
- Fuente inexistente.
- Prompt malicioso dentro de un documento.
- Salida inválida.
- Error y límite del proveedor.
- Intento de ejecutar una acción sin confirmación.

## Responsabilidad

El responsable del proyecto revisa implementación y evidencia.
Los usuarios autorizados responden por las acciones que confirman.
La IA no reemplaza esa responsabilidad.

Aceptado por: PENDIENTE.
Fecha: PENDIENTE.