# ADR 0012 — Derechos propios y recuperación local

Fecha: 2026-11-26
Estado: ALCANCE AUTORIZADO; ver evidencia de controles en TASKS.md

El responsable solicita completar funciones locales y dejar las conexiones
externas al final. No hay proveedor de correo, responsable de privacidad ni
plazos definitivos de conservación compartida aprobados.

- Exportación propia con contraseña actual, consentimientos opcionales
  revocables e historial de solicitudes de derechos persistido.
- La recepción de una solicitud de baja no equivale a eliminar datos. La
  ejecución de supresión/anonimización queda pendiente de validar excepciones,
  responsable, plazos y alcance compartido. No borrar acuerdos ni una empresa
  por la salida de un integrante. El seguimiento mostrará el estado real.
- Recuperación pública con respuesta genérica; sin correo no se informa envío.
  Solo administración de plataforma en desarrollo puede emitir un enlace
  manual tras declarar verificación de identidad y motivo. Token aleatorio,
  hash en base, una hora, uso único; restablecer revoca sesiones y tokens.
  No habilitar ese mecanismo manual en producción.
- Reactivar miembros solo por administración empresarial vigente; no recuperar
  sesiones revocadas ni conceder nuevas funciones durante la reactivación.
- Los borradores de políticas siguen identificados como tales. Esta decisión
  implementa mecanismos técnicos, no acredita cumplimiento normativo completo.
