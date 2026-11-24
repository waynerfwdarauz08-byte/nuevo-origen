# Registro de riesgos — Nuevo Origen

Fecha: 2026-11-24
Estado: evaluación inicial

## Escala

Probabilidad e impacto: bajo, medio o alto.
Las valoraciones iniciales son estimaciones de diseño.

Responsable provisional: responsable del proyecto.
Asignar responsables operativos antes de producción.

Una mitigación descrita no se considera implementada
hasta tener evidencia.

| ID | Riesgo | Probabilidad | Impacto | Mitigación y verificación | Estado |
|---|---|---|---|---|---|
| R01 | Acceso a datos de otra empresa | Media | Alto | Filtrar por empresa y recurso; pruebas cruzadas | Pendiente |
| R02 | Exposición de claves | Media | Alto | Secretos en backend; revisión de Git y compilados | Pendiente |
| R03 | Acceso simulado desplegado como real | Media | Alto | Sustituir login demo y retirar selector de roles | Pendiente |
| R04 | Instrucciones maliciosas en documentos | Alta | Alto | Aislar texto, limitar herramientas y probar inyección | Pendiente |
| R05 | Recomendación técnica sin respaldo | Media | Alto | Fuentes, datos faltantes y confirmación humana | Pendiente |
| R06 | Envío excesivo de datos al proveedor IA | Media | Alto | Minimizar contexto y revisar cargas enviadas | Pendiente |
| R07 | Documentos retirados siguen en RAG | Media | Alto | Invalidar índice y cachés; probar retiro | Pendiente |
| R08 | Doble reserva o entrega excesiva | Media | Alto | Transacciones y control de concurrencia | Pendiente |
| R09 | Indicadores ambientales inventados | Media | Alto | Separar medido y estimado; metodología explícita | Pendiente |
| R10 | Pérdida de datos o migración destructiva | Media | Alto | Entornos separados, respaldo y recuperación | Pendiente |
| R11 | Archivos peligrosos o públicos por error | Media | Alto | Límites, validación y descargas autorizadas | Pendiente |
| R12 | Robo o abuso de sesión | Media | Alto | Sesión segura, vencimiento, revocación y límites | Pendiente |
| R13 | Costos o abuso de IA | Media | Medio | Cuotas, límites y monitoreo | Pendiente |
| R14 | Notificaciones duplicadas | Media | Medio | Idempotencia y reintentos controlados | Pendiente |
| R15 | Baja elimina información de terceros | Media | Alto | Evaluar relaciones y anonimizar según resolución | Pendiente |
| R16 | Respaldos reintroducen datos eliminados | Media | Alto | Registro mínimo y reaplicación de supresiones | Pendiente |
| R17 | Políticas prometen controles inexistentes | Media | Alto | Cotejar textos con pruebas antes de publicar | Pendiente |
| R18 | Dependencia o cambio de proveedor | Media | Medio | Adaptador, configuración y fallos explícitos | Pendiente |
| R19 | Ubicación o contacto privado expuesto | Media | Alto | Visibilidad limitada y pruebas de respuesta API | Pendiente |

## Evidencia de mitigación

Para cerrar un riesgo registrar:
- ID.
- Control implementado.
- Responsable.
- Fecha.
- Prueba o evidencia.
- Riesgo residual.
- Revisión siguiente.

## Incidentes

1. Contener el acceso o comportamiento afectado.
2. Preservar evidencia mínima y protegida.
3. Identificar datos, usuarios y operaciones involucradas.
4. Escalar al responsable.
5. Evaluar las comunicaciones y obligaciones aplicables.
6. Corregir y probar.
7. Documentar causa y prevención.

No inventar plazos legales de notificación.
Validarlos antes de adoptar el procedimiento productivo.