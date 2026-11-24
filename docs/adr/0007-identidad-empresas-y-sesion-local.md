# ADR 0007 — Identidad, empresas y sesión local

Fecha: 2026-11-24
Estado: ACEPTADO EN ALCANCE; controles sujetos a evidencia en TASKS.md
Fuente: instrucción explícita del responsable para la etapa de identidad.

Se conserva el diseño provisional y se mantienen pendientes sus ajustes,
responsive y revisión de teclado. Los ADR aceptados anteriores no se reescriben.
Se amplía el alcance local de ADR 0005 a identidad; sin publicación ni proveedores.

## Datos y permisos

Se sigue el DER: usuarios.empresa_id vincula a una empresa; usuario_roles N:M
permite funciones combinables sin cuentas duplicadas. No se introduce un modelo
multiempresa no requerido. Se añaden empresas, usuarios, usuario_roles, sesiones,
políticas, aceptaciones y consentimientos mediante migración aditiva.
No se reinician bases ni se alteran los catálogos existentes.
Registro transaccional asigna exclusivamente administrador_empresa desde backend.
Roles y permisos se resuelven de nuevo desde MySQL en cada petición privada.
Las actualizaciones usan listas explícitas de campos; no hay ruta para retirar,
desactivar o cambiar roles de administradores. Esos campos se rechazan: ninguna
operación de esta entrega puede retirar al último administrador. La transferencia
y gestión de equipo con bloqueo transaccional quedan pendientes.

## Sesión y protección de peticiones

JWT HS256 con sub y sid mínimos, jti aleatorio, issuer/audience, expiración absoluta de ocho
horas por defecto (configurable 60–86400 segundos) y sin renovación automática.
Cookie HttpOnly, SameSite=Lax, Path=/, sin Domain; Secure y prefijo __Host- en
producción HTTPS. El servidor local continúa limitado a loopback y rechaza
producción en su configuración de datos; preparar cookies no autoriza despliegue.
La tabla sesiones conserva SHA-256 del token en refresh_hash (nombre del DER),
vencimiento y revocación; no se implementa todavía flujo de refresh.
Logout revoca en MySQL y elimina la cookie. No se usan tokens en localStorage.
En modo test la clave de firma se deriva con separación de dominio para no
aceptar firmas del entorno de desarrollo; el hash persistido añade la comprobación
de pertenencia a una sesión concreta de la base correspondiente.

CSRF: nonce aleatorio en cookie HttpOnly, token HMAC ligado a nonce y cookie de
sesión, entregado en JSON por GET /auth/csrf. Mutaciones requieren encabezado
X-CSRF-Token, JSON y Origin exactamente autorizado; se rechaza cross-site.
Incluye login y registro; el token previo no sirve tras cambiar la sesión.
Sin CORS abierto: frontend usa proxy de mismo origen. Token CSRF solo en memoria.
Referencias: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Bcrypt con costo 12; contraseñas de registro de 12 caracteres mínimo y 72 bytes
UTF-8 máximo, rechazando truncamiento. [Documentación bcryptjs](https://www.npmjs.com/package/bcryptjs).
Login con mensaje genérico y comparación con hash ficticio si la cuenta no existe.
Límites en memoria para una instancia local: cinco intentos por IP/correo y
treinta por IP cada 15 minutos; cinco registros por IP cada 15 minutos.
Un despliegue distribuido requerirá almacenamiento compartido de límites.

## Políticas locales y campos editables

Instantáneas de términos y privacidad identificadas como BORRADORES LOCALES,
versión local-borrador-0.1-20261124, sin fecha de publicación. Vigente significa
seleccionada para pruebas locales, no texto definitivo. Registro exige dos
aceptaciones separadas, sin premarcar, con versión y fecha persistidas.
Preferencia opcional de comunicaciones separada; no hay envíos implementados.
No se sobreescriben versiones existentes al cambiar archivos de documentación.

Perfil personal: nombre editable; correo de identidad de solo lectura hasta
implementar verificación. Perfil empresarial: nombre, sector, descripción,
correo de contacto, teléfono, ubicación pública aproximada y dirección privada,
solo con perfil.gestionar y pertenencia propia. No se expone una vista pública
de esos datos privados. El frontend conserva retorno público seguro sin ejecutar
automáticamente solicitudes ni publicaciones.

## Fuera de esta entrega

Recuperación por correo, invitaciones, gestión de equipo/roles, cambio de correo
verificado, renovación de sesión, catálogo, acuerdos, IA, Drive y despliegue.
No se afirma implementación por la existencia de este ADR; las pruebas y límites
observados se registran por separado.
