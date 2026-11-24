# Nuevo Origen

Plataforma B2B para aprovechar materiales sobrantes mediante
ofertas, necesidades, solicitudes, acuerdos y entregas trazables.

## Estado del proyecto

Base técnica local construida desde cero. Incluye inicio, navegación básica,
consulta de salud API/MySQL y persistencia inicial de roles y permisos.
El responsable reportó validación manual de registro, acceso, perfiles,
teclado y responsive a 360/768/1440 px en la versión previa a equipo.
Los ajustes visuales y la revisión de las pantallas nuevas siguen pendientes; ver TASKS.md.
Hay registro empresarial, sesión real y perfiles privados propios (ADR 0007).
Hay gestión de equipo e invitaciones con entrega manual exclusiva de desarrollo
(ADR 0008). No hay catálogo operativo, recuperación por correo ni integraciones.

Construcción técnica desde cero con el prototipo de AI Studio como referencia visual; sin reutilización de su código.
El prototipo disponible en docs/referencias/prototipo-ai-studio/ es la referencia
visual concreta para la página inicial (ADR 0006). No se trasladará ni adaptará
su código, configuración o dependencias. La base técnica no depende de él;
su comparación visual sí requiere disponer de la referencia.
Sus pantallas no acreditan funciones implementadas en esta aplicación.

## Problema que atiende

Empresas con materiales aprovechables pueden tener dificultades
para encontrar otras empresas que los necesiten.

Nuevo Origen conecta oferta y demanda considerando propiedades,
cantidades, condiciones, ubicación y uso previsto.

## Flujo principal

Oferta → búsqueda → solicitud → acuerdo → entrega →
confirmación de aprovechamiento.

## Arquitectura objetivo

- React, Vite y JavaScript/JSX.
- React Router.
- Node.js y Express.
- MySQL y Sequelize.
- IA desde backend.
- RAG e integraciones según el anteproyecto.
- Automatizaciones n8n.

Construcción desde cero y JavaScript/JSX indicados por el responsable del
proyecto el 2026-11-24; decisión registrada en ADR 0004.
Proveedor y modelo de IA siguen pendientes.
ADR 0005 autoriza la base local: cada integración requiere cerrar previamente
proveedor, tratamiento de datos y configuración. El alojamiento productivo se
definirá antes del despliegue. No hay autorización de publicación.
ADR 0007 autoriza identidad sobre esa base. El inicio es una base provisional
aceptada; los ajustes visuales, responsive y teclado no se dan por verificados.
El libro de marca v1.0 es la referencia visual vigente; las menciones del
anteproyecto a identidad pendiente son antecedentes desactualizados.

## Documentación

- AGENTS.md: instrucciones para agentes de programación.
- PLAN.md: etapas de implementación.
- TASKS.md: tareas y evidencia.
- docs/referencias/: anteproyecto y libro de marca.
- docs/adr/: decisiones de arquitectura.
- docs/gobernanza/: inventario y riesgos.
- docs/politicas/: borradores y versiones de políticas.
- docs/agentes/: contratos y pruebas de agentes.
- docs/api/: documentación de endpoints.
- workflows/: exportaciones de n8n sin secretos.

## Ejecución

Verificado en Windows con Node 24.13.0, npm 11.6.2 y MySQL 8.0.46.
Usar Node >=22.12.0. Las versiones exactas instaladas están en los lockfiles.

Instalación desde cada carpeta:

```powershell
cd backend
npm ci --ignore-scripts
cd ../frontend
npm ci --ignore-scripts
npm run build
```

Detener Vite antes de repetir npm ci en Windows: esbuild.exe puede quedar en uso.
La compilación genera frontend/dist/; no publica el sistema.

### MySQL aislado para esta etapa

En backend/, `npm run mysql:start` crea una instancia local en .local/mysql-data,
puerto 3307, sin instalar servicios ni modificar MySQL80. Requiere MySQL ya
instalado; MYSQLD_PATH permite indicar otra ruta del ejecutable. Mantener abierta
esa terminal. El comando no borra ni reinicializa directorios existentes.

Crea nuevo_origen_development y nuevo_origen_test, con usuarios distintos y
privilegios limitados a su propia base. Genera contraseñas aleatorias en
backend/.env y credenciales administrativas de esa instancia en .local/;
ambos están ignorados. No copiar esos archivos a Git ni compartirlos.
No crea cuentas humanas de la aplicación. El script no sobrescribe un .env existente.

Si la instancia ya fue creada y está detenida, ejecutar `npm run mysql:resume`
en una terminal dedicada. Para detenerla desde otra terminal, ejecutar
`npm run mysql:stop`. Los datos permanecen para el siguiente arranque.
En el ejecutor de Codex el servidor debe permanecer en una sesión activa.

Alternativamente configurar backend/.env desde .env.example con bases y usuarios
locales exclusivos. Desarrollo usa DB_* y pruebas TEST_DB_*; las pruebas exigen
exactamente nuevo_origen_test y un host de loopback. No utilizar producción.

En otra terminal, desde backend/:

```powershell
npm run db:migrate
npm run db:seed
npm run auth:configure
npm start
```

Si ya tenías un backend abierto, detenelo con Ctrl+C en su propia terminal y
volvé a ejecutar npm start para cargar las rutas nuevas. No reiniciar MySQL80.
auth:configure genera JWT_SECRET si falta o es el valor ficticio de ejemplo,
sin mostrarlo; conserva una clave real ya configurada. El secreto permanece en .env ignorado.

API: http://127.0.0.1:3001. GET /api/health comprueba el proceso;
GET /api/health/ready autentica una conexión real a MySQL y responde 200 o 503.
No expone roles ni credenciales. La API escucha exclusivamente en loopback.

En otra terminal, desde frontend/:

```powershell
npm run dev
```

Abrir http://127.0.0.1:5173. Vite redirige /api al backend local; no se requiere
CORS abierto. /estado muestra carga, resultado o error y permite reintentar.
La consulta tiene límite de 6 segundos. No existe persistencia en localStorage.

### Pruebas y migraciones

Desde backend/, `npm test` verifica HTTP y configuración; omite explícitamente
MySQL. Con la instancia aislada disponible, `npm run test:mysql` ejecuta las
23 casos (incluidos subcasos y agrupación) de backend, incluyendo migraciones
aditivas, seed repetido, restricciones, registro, reversión transaccional y aislamiento.
Solo usa nuevo_origen_test. No revierte esquemas ni purga datos existentes;
añade fixtures ficticios con identificadores únicos. La prueba anterior que
revertía el catálogo inicial fue sustituida para conservar los datos actuales.
En frontend/, npm test ejecuta dos casos de retorno seguro y npm run build compila.

La migración inicial crea roles, permisos y rol_permiso, con PK, FK y unicidad.
El seed crea seis roles (visitante no es un rol persistido), 36 permisos y 68
relaciones. Esto no implementa autenticación, asignación a usuarios ni autorización
operativa. Los permisos excepcionales siguen requiriendo motivo y recurso
autorizado cuando se implementen esos módulos.

SequelizeMeta y SequelizeData registran migraciones y seeders ejecutados.
Repetir db:migrate/db:seed no duplica registros. No ejecutar undo de migraciones
ni seeders sobre las bases actuales con usuarios. La migración 20261124000200
añade empresas, usuarios, usuario_roles, sesiones, politicas, aceptaciones y
consentimientos; revertirla eliminaría esos datos y exige revisión y respaldo.
La reversión de borradores con posibles aceptaciones se bloquea explícitamente.
MySQL no hace atómico un conjunto de DDL: ante fallo parcial, revisar tablas y
metadatos, respaldar si corresponde y conciliar manualmente antes de reintentar.
No usar sync({ force: true }).

### Marca y dependencias

Fraunces Variable 600 (opsz 48, SOFT 70, WONK 1) y DM Sans 400/600 se sirven desde los paquetes locales Fontsource,
sin consultas a Google Fonts en tiempo de ejecución. Licencias conservadas en
frontend/src/assets/licenses/. El logo PNG suministrado en el prototipo ya está
integrado como archivo visual, sin reconstrucción tipográfica ni modificación.
Hero y seis imágenes ilustrativas también proceden de los archivos suministrados.
La búsqueda y tarjetas son presentación identificada: no hay catálogo operativo.
Las acciones de catálogo/publicación pendientes abren una explicación; registro
y acceso ahora conectan a la API real. No se publican materiales desde el inicio.
/estado y su conexión permanecen separados. Sin controles del inspector.
Comparación de archivos y diferencias deliberadas documentadas en ADR 0006;
fidelidad y responsive siguen sujetos a comprobación visual.

### Identidad local y prueba manual

Usar siempre http://127.0.0.1:5173 (no mezclar localhost con 127.0.0.1).
APP_ORIGINS define orígenes exactos permitidos para CSRF; no hay CORS abierto.
La sesión dura ocho horas por defecto y se revoca al cerrar. HttpOnly/SameSite=Lax
en local; Secure y prefijo __Host- previstos para HTTPS. Producción sigue bloqueada
por configuración y no se ha probado ni publicado. No hay tokens en localStorage.

1. Mantener MySQL aislado en una terminal con npm run mysql:resume desde backend/.
2. En otra terminal backend/: npm run db:migrate, npm run db:seed,
   npm run auth:configure y npm start. Si existe un proceso anterior en 3001,
   reiniciarlo desde su terminal para evitar 404 en /api/politicas.
3. En frontend/: npm run dev (o conservar Vite ya abierto con recarga).
4. Abrir /registro. Usar datos ficticios, correo único y contraseña de al menos
   12 caracteres y como máximo 72 bytes. Leer los dos borradores y marcar
   cada aceptación por separado; la opción de comunicaciones es voluntaria.
5. El registro directo lleva a /mi-espacio. Si se inició desde un enlace público
   con retorno, vuelve a ese contexto; abrir Mi espacio para consultar el perfil.
6. Editar nombre propio y campos empresariales, guardar y recargar. El correo
   de acceso es de solo lectura. No se pueden modificar empresa_id, roles o estado.
7. Registrar otra empresa con otro correo en ventana privada u otro perfil de
   navegador. No usar dos pestañas normales para dos identidades: comparten cookies.
8. Cerrar sesión y volver a /mi-espacio debe solicitar acceso. Probar /acceso con
   contraseña incorrecta y después correcta. El límite es cinco intentos por
   IP/correo y treinta por IP cada 15 minutos; registro, cinco por IP/15 minutos.

Las pruebas API demuestran aislamiento; no se proporciona interfaz para consultar
otras empresas privadas. GET/PATCH /api/empresas/:id rechazan IDs ajenos con 404.
Los recorridos anteriores son pasos manuales pendientes de evidencia en navegador,
no pruebas manuales ya realizadas. El host del navegador de verificación estuvo
inaccesible en esta entrega.

Registro persiste dos aceptaciones con fecha y versión local-borrador-0.1-20261124.
Estas versiones son instantáneas locales de documentación, no políticas definitivas
publicadas. Un cambio de texto requiere nueva versión/seeder, no sobreescritura.
El algoritmo bcrypt rechaza más de 72 bytes para evitar truncamiento.
Las cuentas de pruebas conservadas son ficticias; no son accesos de demostración.
La gestión de equipo permite cambiar funciones y desactivar integrantes con
protección transaccional del último administrador activo, incluso bajo concurrencia.

Contrato actualizado: docs/api/openapi.yaml (0.3.0). Decisiones: ADR 0007 y 0008.
Recuperación por correo, cambio verificado de correo, reactivación de miembros,
revocación de preferencias opcionales y renovación de sesión quedan pendientes.

## Probar equipo e invitaciones localmente

No hace falta instalar dependencias nuevas para esta entrega. Con la instancia
aislada en 3307 disponible, desde la carpeta `backend` ejecutar:

```powershell
npm run db:migrate
npm start
```

La migración `20261124000300-equipo-invitaciones-auditoria.js` ya fue aplicada
en desarrollo y pruebas en esta entrega. Volver a ejecutar `db:migrate` omite
migraciones aplicadas; no usar undo, reset ni inicializar de nuevo la base.
Si el backend estaba abierto, detener **esa terminal** con Ctrl+C y volver a
ejecutar `npm start` para cargar las rutas nuevas. No detener MySQL80.
Desde otra terminal en `frontend`, ejecutar `npm run dev`.

1. Abrir http://127.0.0.1:5173/acceso e ingresar con una cuenta administradora
   propia. Ir a **Mi espacio → Gestionar equipo**.
2. Revisar integrantes. En **Invitaciones**, indicar un correo ficticio nuevo y
   seleccionar una o varias funciones empresariales. Crear la invitación.
3. La pantalla indica **No se envió correo**. Copiar el enlace privado que solo
   aparece en esa respuesta. Vence en una hora. No pegarlo en logs o documentación.
4. Abrirlo en una ventana privada sin sesión. Revisar empresa/correo/funciones,
   ingresar nombre y contraseña y aceptar los dos borradores locales.
   La preferencia opcional empieza sin marcar. Aceptar crea una sesión real.
5. Recargar el espacio privado del invitado. Volver al administrador y actualizar
   integrantes. Cambiar funciones con motivo; la siguiente petición del invitado
   debe usar sus permisos nuevos. Solo administración empresarial gestiona equipo.
6. Probar otra invitación y revocarla antes de aceptarla. Reabrir una usada o
   revocada debe mostrar un error. Para vencimiento manual esperar una hora;
   las pruebas automatizadas verifican ese estado sin tocar la base de desarrollo.
7. Desactivar un integrante de prueba con motivo y confirmación: sus sesiones
   deben dejar de autorizar. No se elimina su usuario ni la empresa.
8. Intentar retirar o desactivar al único administrador: debe rechazarse.
   Para sustituirlo, primero aceptar una invitación con administración empresarial.
9. Revisar **Auditoría**. Usar otra cuenta administradora de otra empresa en
   otra ventana/perfil y comprobar que sus integrantes y eventos son distintos.

La entrega manual se habilita exclusivamente con `NODE_ENV=development`
(valor local por defecto). Fuera de desarrollo la creación devuelve 503;
no se simula correo ni se elige proveedor. El token viaja en fragmento de enlace,
se retira de la barra al abrir y se envía en JSON con CSRF; solo se guarda su hash.
Recargar la aceptación requiere reabrir el enlace original. Un correo ya registrado
no se transfiere a otra empresa ni recupera contraseña por esta vía.

Verificaciones ejecutadas: en `backend`, `npm run test:mysql` (**36/36**, base
`nuevo_origen_test` exclusiva); en `frontend`, `npm test` (**2/2**) y
`npm run build` correctos; OpenAPI validado. Los tests de equipo prueban API/MySQL,
no son una prueba visual ni automatización del navegador. Revisión manual nueva
de teclado, errores y responsive 360/768/1440 px pendiente, así como ajustes visuales.
También quedan pendientes proveedor de correo, reactivación, limpieza de tokens
a 30 días según gobernanza y publicación. No se contrataron servicios.

Backend fija overrides uuid 11.1.1, glob 14.0.6 y minimatch 11.0.9 para corregir
avisos transitivos de Sequelize/CLI. Instalación limpia, CLI y pruebas MySQL se
verificaron con esos overrides. No se degradó Sequelize ni se usó audit fix --force.
Al actualizar dependencias, repetir auditoría y pruebas.

Referencias técnicas consultadas: [Vite](https://vite.dev/guide/),
[Express 5](https://expressjs.com/guide/migrating-5/) y
[migraciones Sequelize 6](https://sequelize.org/docs/v6/other-topics/migrations/).

No asumir que las instrucciones genéricas de AI Studio describen
la arquitectura final.

## Variables y credenciales

Las claves reales pertenecen a archivos de entorno no versionados
o a la configuración segura del servidor.

No enviar secretos al frontend.
No incluir credenciales en workflows exportados.
No agregar archivos .env reales a Git.

## Datos de demostración

Los seeders deben utilizar datos ficticios.
Los datos de demostración deben estar identificados.
Ninguna simulación debe confundirse con una integración real.

## Calidad

Una función se considera implementada cuando cumple
los criterios de AGENTS.md y tiene evidencia en TASKS.md.

## Publicación

Pendiente de infraestructura, verificación funcional,
políticas finales y autorización del responsable.
