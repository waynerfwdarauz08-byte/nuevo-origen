# Trazabilidad funcional local

Corte: 2026-11-26. Anteproyecto vigente; evidencia técnica en TASKS.md. La
compilación no acredita revisión visual; RF completos incluyen criterios que
todavía pueden depender de publicación o integración.

- RF-01: registro empresarial transaccional. API/MySQL y validación manual
  reportada por el responsable en la entrega de identidad. Aceptaciones
  versionadas y consentimientos persistidos; textos locales en borrador.
- RF-02: sesión, revocación y recuperación mediante token local verificadas por
  API. Correo productivo pendiente; entrega manual exclusiva de desarrollo.
- RF-03: equipo, combinación de funciones, invitaciones, bajas/reactivación y
  cuentas globales. Ver pruebas de equipo y operación; funciones nuevas requieren
  revisión manual. No convertir cuentas empresariales en globales.
- RF-04: perfil empresarial editable y perfil público con proyección autorizada;
  contactos internos y dirección privada excluidos del catálogo. API/MySQL y
  validación manual reportada por el responsable.
- RF-05 a RF-08: catálogos, ofertas, necesidades y consulta pública reales.
  API/MySQL y validación manual de materiales reportada por el responsable.
  Ajustes visuales y comparación de capturas pendientes.
- RF-09: compatibilidad explicada pendiente de agentes/IA; filtros manuales reales
  disponibles. No se ha simulado una recomendación de IA.
- RF-10 y RF-11: solicitudes, versiones, conversación privada, estados y
  seguimiento persistidos; pruebas API/MySQL. Historial de solicitud muestra
  hasta 200 eventos; ampliación de paginación histórica pendiente.
- RF-12: reserva atómica bilateral, cancelación y concurrencia verificadas por API.
- RF-13: entregas parciales, idempotencia, recepción/uso de ambas empresas,
  discrepancia y evidencia privada verificadas por API. Revisión manual pendiente.
- RF-14: indicadores SQL, periodos, tendencia diaria, unidades separadas y CSV
  empresariales. No CO2 ni masas inferidas sin factor/fuente. Resumen IA y vistas
  globales de impacto quedan pendientes; revisión manual nueva pendiente.
- RF-15 a RF-17: ocho agentes, documentos/RAG y Drive pendientes por instrucción
  del responsable de conectar servicios al final.
- RF-18: avisos de interfaz propios y deduplicados. Correo, coincidencias y
  recordatorios automáticos pendientes; preferencia opcional separada.
- RF-19: tres workflows n8n y su bitácora/reintentos pendientes.
- RF-20: reportes autenticados, asignación de caso, revisión humana, resolución
  motivada y evidencia limitada al revisor. Pruebas de API; revisión manual
  pendiente. No sustituye intervención especializada ni confirma uso por empresas.
- RF-21: perfil propio editable, exportación acotada y solicitudes con estado.
  Exportación de conversaciones/documentos completos y resolución integral de
  derechos pendientes; no se acredita entrega exhaustiva de todos los datos.
- RF-22: recepción verificada de solicitud personal o empresarial; revisión
  registrada. Ejecución de supresión/anonimización, excepciones, aviso final y
  tratamiento de respaldos pendientes. No se marca completo.
- RF-23: trazabilidad IA pendiente; auditoría de negocio local existente.
- RF-24: cuentas globales, borradores y auditoría de referencias locales.
  Configuración y verificaciones reales de integraciones pendientes.
- RF-25: retorno de intención segura y rechazo de acciones privadas sin sesión;
  sin ejecución automática al acceder. API y pruebas unitarias de retorno seguro.
- RF-26: espacio integrado según funciones y herramientas globales separadas;
  backend verifica permisos. Nuevos paneles compilados, recorrido manual pendiente.

## Fuentes académicas adicionales consultadas

- Proyecto Final Full Stack FWD: página física 6 permite PostgreSQL y exige ramas
  de Git; modelo/diccionario normalizado y entidades de gobernanza/ejecuciones.
- Taller CRM y plataforma de FWD: páginas 23–26 corresponden al miniproyecto
  separado de admisiones. El anteproyecto 18.3 lo usa para seguimiento y métricas.
- Plan de Producción FWD: URL pública, comparación de alternativas/costos y
  evidencias de seguridad, respaldo y recuperación antes de la entrega productiva.

Se consultaron originales locales de Downloads. No se incorporaron documentos
académicos adicionales ni datos del taller a este repositorio público.
## Actualización de RF-11/P-23 — 2026-11-27

ADR 0014 concilia la instrucción actual: chat independiente ligado a solicitud/
acuerdo, con historial conservado, cursores y envío idempotente. RF-26: marco
privado común por funciones. RF-13: confirmación adaptada a recepción o uso,
sin cambiar reglas del backend. Evidencia en TASKS.md. Revisión visual, teclado
y responsive del marco nuevo pendientes; reportes anteriores no se extienden.
