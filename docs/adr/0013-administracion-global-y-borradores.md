# ADR 0013 — Administración global y borradores locales

Fecha: 2026-11-26
Estado: ALCANCE AUTORIZADO; evidencia técnica en TASKS.md

HU-20 y RF-26 requieren funciones globales separadas de la operación empresarial.

- Administración de plataforma crea cuentas globales o modifica funciones y
  estado de cuentas globales existentes. No convierte una cuenta empresarial.
- Solo se aceptan los roles globales ya definidos. Sus funciones pueden
  combinarse; los permisos vigentes se recargan desde persistencia.
- Serializar cambios sobre la fila del rol administrador de plataforma y volver
  a verificar al actor. No retirar ni desactivar la última administración activa.
- Desactivar revoca sesiones; modificar funciones tiene efecto en la próxima
  petición. Registrar motivo y auditoría sin contraseña ni token.
- Versionar exclusivamente borradores locales: contenido anterior inmutable,
  versión nueva y cambio de vigencia transaccional. No convertirlos en textos
  definitivos ni ejecutar una publicación productiva.
- Panel de auditoría global con referencias y motivos, sin contenido de
  conversaciones ni credenciales. Detalle/evidencias de incidencias requieren
  asignación al propio revisor y acceso auditado, también para plataforma.
- Proveedores, secretos, límites de IA y estados de integraciones productivas
  quedan pendientes; no crear indicadores de conexión ficticios.
