# ADR 0008 — Equipo, invitaciones y último administrador

Fecha: 2026-11-24
Estado: ACEPTADO EN ALCANCE por instrucción del responsable; controles sujetos a pruebas

Amplía ADR 0007 a equipo e invitaciones sin reescribir ADR aceptados. Se conserva
el diseño y se registra por separado la validación manual reportada del usuario.
No incorpora proveedor de correo, catálogo, IA ni servicios externos.

## Datos y decisiones

Migración aditiva: tokens_accion del DER (usuario_id identifica al administrador
emisor para invitaciones), invitaciones, invitacion_roles y auditoria.
La invitación mantiene empresa, correo y funciones; no crea una cuenta pendiente
ni reserva una contraseña. No se transfieren cuentas existentes entre empresas
ni se restablecen credenciales mediante invitación. Para un correo ya registrado
se devuelve un conflicto genérico. Reactivación de miembros queda pendiente.

Token aleatorio de 256 bits, SHA-256 persistido, uso único y vencimiento de una
hora conforme al anteproyecto. Revocación explícita. Nunca se devuelve en
listados, auditoría ni logs. El enlace usa fragmento de URL, no query ni ruta;
el navegador lo retira al abrir y envía el token por cuerpo JSON protegido por
CSRF. No se consume al consultar: solo al aceptar dentro de la transacción.
Aceptación crea usuario, funciones, aceptaciones de borradores y sesión reales.

Entrega manual exclusivamente en desarrollo: enlace mostrado una sola vez
al administrador autorizado tras crear la invitación. Aviso inequívoco de que
no se envió correo. Fuera de desarrollo no se crea una invitación sin mecanismo
de entrega habilitado. Las pruebas simulan explícitamente esa configuración
de desarrollo con datos y conexiones exclusivos de pruebas.

## Autorización y concurrencia

Solo administrador_empresa activo con equipo.gestionar administra su empresa.
Se permiten las cuatro funciones empresariales, nunca roles globales.
Todas las mutaciones del equipo bloquean primero la fila de empresa (FOR UPDATE,
READ COMMITTED), revalidan al actor y luego bloquean integrante/invitación.
El conteo de administradores activos se verifica bajo el mismo bloqueo antes
de retirar la función de administrador o desactivar al miembro. Esto evita
write skew entre operaciones simultáneas y uso de autorización anterior al bloqueo.
No hay baja automática de empresa por desactivar un integrante.

Cambios de funciones se reflejan en la siguiente petición de sesiones abiertas,
reutilizando la consulta vigente de permisos. Desactivar revoca todas las sesiones
del miembro en la misma transacción. Retirar administración o desactivar al emisor
revoca además sus invitaciones pendientes: no conserva delegaciones después de
perder autoridad. La aceptación también revalida esa autoridad.

Auditoría transaccional con actor, empresa, acción, recurso, fecha, requestId,
motivo y detalle mínimo de funciones/estados anteriores y posteriores; sin
contraseñas, tokens ni hashes. Solo administración de la propia empresa consulta
su registro. Rechazos no se presentan como cambios ejecutados.

Referencias técnicas: [transacciones Sequelize 6](https://sequelize.org/docs/v6/other-topics/transactions/)
y [propiedades de tokens de un solo uso de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Impacto y recuperación

No borra datos existentes ni reinicia bases. Revertir el esquema perdería el
historial nuevo y requiere respaldo y autorización específica; no se ejecuta en
las pruebas. La limpieza a 30 días del anteproyecto sigue pendiente y debe
preservar evidencia mínima de auditoría según la política que se apruebe.
