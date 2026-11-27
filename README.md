# Nuevo Origen

Plataforma B2B para aprovechar materiales sobrantes mediante
ofertas, necesidades, solicitudes, acuerdos y entregas trazables.

## Estado del proyecto

Aplicación local construida desde cero con identidad, equipo, materiales y
catálogo reales. Se añadieron solicitudes, negociación versionada, acuerdos,
reservas, entregas, aprovechamiento bilateral, indicadores y revisión de casos.
Gobernanza local parcial: recuperación manual segura, consentimientos,
exportación propia acotada, solicitudes de derechos y administración global.

El responsable reportó validación manual de identidad, equipo y materiales.
Las pantallas nuevas de operación, moderación, derechos y plataforma requieren
revisión manual; ajustes visuales pendientes. Ver TASKS.md y trazabilidad local.

La base en ejecución sigue siendo MySQL aislado 3307. PostgreSQL en Supabase,
Express en Render y frontend en Vercel son destinos autorizados por el responsable,
pendientes de migración verificada y despliegue (ADR 0010). La consigna original
permite PostgreSQL. No se han transferido datos ni publicado el sistema.

IA, RAG/Drive, n8n, correo y conexiones externas quedan al final. No hay proveedor
de IA/modelo ni CRM externo elegido. El taller CRM aporta seguimiento por etapas;
no exige trasladar el sistema de admisiones a Nuevo Origen.

Construcción técnica desde cero con el prototipo de AI Studio como referencia visual; sin reutilización de su código.

## Mensajería y mejoras del espacio privado — 2026-11-27

Abrir http://127.0.0.1:5173/mi-espacio/mensajes con administración empresarial o
gestión de acuerdos. También desde **Abrir chat** en solicitud o acuerdo.
Bandeja independiente, historial cronológico y acceso al contexto de negocio.
Los mensajes previos se conservan; el chat no acepta acuerdos automáticamente.

Actualización cada 15 segundos con pestaña visible, carga de anteriores y envío
idempotente para reintentar sin duplicar. No hay presencia/lectura ficticias.
Texto no enviado en memoria al cambiar de conversación dentro del módulo;
recargar o cerrar no garantiza conservar ese borrador.

Menú privado común, botones/estados uniformes, reintento de avisos y confirmación
según etapa de entrega. Error de conexión SQL más comprensible, sin cambiar
contraseñas. Portada, logo y tipografías conservados.

Migración aditiva `20261127000100-mensajeria-idempotente.js` aplicada en desarrollo
y pruebas, sin reiniciar bases. En otra instalación, ejecutar `npm run db:migrate`
desde `backend`. El backend quedó reiniciado con `npm run dev`, que recarga cambios
de código; no abrir otro si ya está escuchando en 3001.

Verificación: backend **70/70**, frontend **4/4**, compilación correcta y OpenAPI
**0.6.0** válido, con `docs/api/mensajeria.yaml`. Revisión manual y responsive del
nuevo marco pendientes: [guía](docs/api/pruebas-manuales-operacion.md).
[Revisión y límites](docs/gobernanza/revision-experiencia-2026-11-27.md).

## Operación y gobernanza locales

ADR 0011–0013. Desde la carpeta `backend`, con la instancia aislada disponible:

```powershell
npm run db:migrate
npm run db:seed
npm start
```

Si estaba abierto el backend anterior, detenerlo con Ctrl+C en su terminal y
volver a iniciarlo para cargar las nuevas rutas. No reinicializar bases.
Las migraciones de operación y solicitudes de derechos ya se aplicaron en
esta máquina a desarrollo y pruebas. Repetir omite las registradas.

Desde `frontend`, en otra terminal:

```powershell
npm run dev
```

- Inicio: http://127.0.0.1:5173
- Solicitudes y acuerdos: http://127.0.0.1:5173/mi-espacio/solicitudes
- Indicadores y seguimiento: http://127.0.0.1:5173/mi-espacio/indicadores
- Avisos propios: http://127.0.0.1:5173/mi-espacio/avisos
- Privacidad y derechos: http://127.0.0.1:5173/mi-espacio/derechos
- Casos asignados de moderación: http://127.0.0.1:5173/mi-espacio/incidencias
- Cuentas globales, borradores y auditoría: http://127.0.0.1:5173/mi-espacio/plataforma
- Recuperación: http://127.0.0.1:5173/recuperacion

Las herramientas exigen permisos en backend. Las cuentas globales no pertenecen
a empresas; el administrador empresarial no puede conceder esas funciones.
Bootstrap interactivo de la primera cuenta global: `npm run platform:bootstrap`
desde `backend`; elegir credenciales propias. No se creó una cuenta automática
en desarrollo ni se reutilizan usuarios del prototipo.

Prueba manual paso a paso y pendientes de teclado/responsive:
[operación local](docs/api/pruebas-manuales-operacion.md).
Contrato: [OpenAPI](docs/api/openapi.yaml), con módulos de materiales y operación.
Alcance por RF: [trazabilidad](docs/referencias/trazabilidad-local.md).
Antes de migrar o publicar: [preparación productiva](docs/gobernanza/preparacion-produccion.md).

Límites explícitos:

- Una solicitud no reserva; la contraparte acepta la versión revisada y reserva
  todas las líneas en una transacción. Intercambio requiere contraprestación.
- Recepción no equivale a uso. Solo aprovechamiento confirmado por ambas
  empresas suma indicadores; masas medidas y estimadas se separan.
- Moderación no confirma entregas por las empresas. Puede devolver una entrega
  disputada a revisión o anular su registro conservando evidencia y auditoría.
- Recuperación manual solo en desarrollo, por plataforma que verificó identidad;
  enlace de una hora y uso único. Restablecer revoca sesiones y enlaces anteriores.
  Nunca se informa correo enviado.
- Exportación JSON acotada a perfil, aceptaciones, consentimientos e historial de
  derechos propios. Supresión efectiva y exportación exhaustiva quedan pendientes.
- Solicitudes de baja solo se reciben/revisan. No se eliminan cuentas ni empresas
  hasta validar excepciones, conservación compartida y procedimiento del responsable.
- Borradores de políticas versionados siguen siendo borradores locales.
- Historial de solicitud limitado a 200 eventos; listados globales de cuentas y
  derechos limitados a 100. Ampliación de paginación pendiente.

Limpieza de tokens locales, revisión sin cambios desde `backend`:

```powershell
node --env-file-if-exists=.env scripts/retain-tokens.js
```

Para aplicar el procedimiento local después de revisar el resumen se añade
`--apply`. Solo elimina metadatos terminales con antigüedad suficiente de
30 días; conserva auditoría. No hay limpieza productiva programada. No ejecutar
purgas contra servicios o bases ajenas; la herramienta rechaza producción.

Verificaciones de esta entrega: backend `npm run test:mysql`, 68/68 correctas;
frontend `npm test`, 2/2; `npm run build`, correcto; OpenAPI 0.5.0 validado.
Los tests usan exclusivamente `nuevo_origen_test`; no son pruebas de navegador.

## Materiales y catálogo local

Entrega del 2026-11-26, ADR 0009. Se conserva la identidad visual; el catálogo
real comienza vacío hasta publicar ofertas propias. Las tarjetas editoriales del
inicio siguen identificadas como ejemplos y no se convierten en datos reales.

Desde `backend`, con MySQL aislado disponible, ejecutar:

```powershell
npm run db:migrate
npm run db:seed
npm start
```

La migración y el seeder de materiales ya se aplicaron en esta máquina en
desarrollo y pruebas. Repetir los comandos omite los ya registrados; no ejecutar
undo ni reinicializar MySQL. Si había backend abierto, Ctrl+C **en su terminal**
y volver a ejecutar `npm start` para cargar las nuevas rutas. Desde `frontend`:

```powershell
npm run dev
```

- Catálogo: http://127.0.0.1:5173/catalogo
- Ofertas propias: http://127.0.0.1:5173/mi-espacio/ofertas
- Necesidades propias: http://127.0.0.1:5173/mi-espacio/necesidades
- Administración de catálogos: http://127.0.0.1:5173/mi-espacio/catalogos
  (solo administrador de plataforma; no usar cuenta empresarial para ese ámbito).

Recorrido de materiales reportado como probado por el responsable el 2026-11-26;
se conserva como guía reproducible, sin atribuirlo a automatización:

1. Iniciar sesión como administración empresarial o gestor de materiales.
2. **Mi espacio → Mis ofertas → Crear oferta**. Elegir categoría, unidad,
   cantidad positiva, composición, estado, ubicación aproximada, modalidad y
   frecuencia. En venta indicar precio por unidad y moneda. Usar punto decimal.
3. Guardar borrador. No aparece en el catálogo público. Agregar fotografía real
   JPEG/PNG/WebP (hasta 5 MiB y 16 megapíxeles). No subir datos personales.
4. Completar propiedades requeridas y ambas declaraciones sobre material
   aprovechable/no peligroso. Volver a Mis ofertas y confirmar **Publicar** con motivo.
5. Abrir catálogo sin sesión, filtrar y abrir detalle y perfil público. No deben
   aparecer dirección privada, contactos internos ni borradores. Una cantidad
   mínima requiere unidad: no se convierten kilos, piezas o metros.
6. Con otra empresa, comprobar que puede ver la oferta pública y no editarla ni
   consultar la ficha privada. Como analista/gestor de acuerdos, lectura propia
   sin botones de modificación y rechazo de mutaciones por API.
7. Pausar: oferta y fotos dejan de ser públicas. Reanudar vuelve a validar la ficha.
   Para cambiar fotos hay que pausar. Archivar es terminal; no borra la ficha.
8. Crear una necesidad con cantidad, ubicación, descripción, propiedades o
   intervalos y fecha opcional. Activar, pausar o cerrar. Solo la empresa ve sus
   necesidades; no se publican en el catálogo de ofertas.
9. Recargar, comprobar persistencia, errores y estados vacíos. Revisar teclado,
   etiquetas, foco y tamaños 360/768/1440 px. No darlo por probado automáticamente.

Catálogos: inicialmente ocho categorías, diez unidades y tres dimensiones
opcionales. No hay límite fijo de categorías. Para crear una **cuenta global nueva**
de plataforma elegida explícitamente por el responsable, desde una terminal
interactiva en `backend`, con MySQL disponible:

```powershell
npm run platform:bootstrap
```

Pide nombre, correo nuevo y contraseña oculta con confirmación. No imprime ni
guarda contraseña en claro, no envía correos y no convierte cuentas existentes.
Solo admite la base local de desarrollo en 3307. No se ejecutó automáticamente
ni se creó una cuenta global de demostración. Después iniciar sesión con esa
cuenta para crear/editar/desactivar categorías, unidades, propiedades y plantillas.
Tipo/unidad de propiedad y código/magnitud de unidad son inmutables; para cambiar
su significado crear otra definición. Los cambios de plantilla se verifican al
publicar y editar, sin reescribir fichas históricas de forma automática.

Persistencia: migración `20261126000100-materiales-catalogo.js` y seeder
`20261126000100-catalogos-materiales.js`, ambos aditivos, sin purgar datos.
Fotos normalizadas en `.local/uploads`; pruebas en `.local/test-uploads`, ignoradas
por Git. Solo WebP reencodificado, clave aleatoria, hash/tamaño en MySQL; no se
conserva EXIF ni el original. Las fotos retiradas dejan de servirse y conservan
registro privado hasta definir limpieza y conservación. Respaldar fotografías
junto con MySQL; no basta con clonar Git para recuperar archivos subidos.

La entrega inicial de materiales usó API 0.4.0; la versión vigente es 0.6.0:
`docs/api/openapi.yaml` referencia `materiales.yaml` y `operaciones.json`.
Pruebas: `backend: npm run test:mysql`, `frontend: npm test` y `npm run build`.
Resultado de esa entrega inicial: **50/50 pruebas backend correctas, cero omitidas; 2/2 frontend y
compilación Vite correctas; OpenAPI válido**. Las pruebas MySQL usan
exclusivamente `nuevo_origen_test`; no reinician bases ni tocan MySQL80.
La compilación y API no sustituyen la revisión visual: CUA no pudo abrir navegador
por indisponibilidad del host. El responsable posteriormente reportó el recorrido
manual de materiales; el recorrido de operación añadido después sigue pendiente.

Solicitar material abre el formulario real de propuesta. No envía la solicitud
ni reserva automáticamente, tampoco al regresar del login.
No se integraron IA, Drive, correo, n8n ni alojamiento. El sistema sigue local.
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
  pruebas de backend (50 casos en la entrega de materiales), incluyendo migraciones
aditivas, seed repetido, restricciones, registro, reversión transaccional y aislamiento.
Solo usa nuevo_origen_test. No revierte esquemas ni purga datos existentes;
añade fixtures ficticios con identificadores únicos. La prueba anterior que
revertía el catálogo inicial fue sustituida para conservar los datos actuales.
En frontend/, npm test ejecuta dos casos de retorno seguro y npm run build compila.

La migración inicial crea roles, permisos y rol_permiso, con PK, FK y unicidad.
El seed crea seis roles (visitante no es un rol persistido), 36 permisos y 68
relaciones. Ese seeder por sí solo no implementa autenticación ni autorización;
la identidad se implementa en los servicios correspondientes. Los permisos excepcionales requieren motivo y recurso
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
Las tarjetas del inicio son presentación identificada; el catálogo operativo
está separado en /catalogo. Búsqueda y publicación llevan a recorridos reales;
publicar exige sesión, permiso y confirmación, nunca se ejecuta desde una tarjeta editorial.
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

Contrato actualizado: docs/api/openapi.yaml (0.4.0). Decisiones: ADR 0007–0009.
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

## Ensayo SQL y respaldo local

MySQL 3307 sigue activo. PostgreSQL 5433 se usa en paralelo para compatibilidad;
no se cambió el motor ni se conectó Supabase. Desde `backend/`:
`npm run postgres:resume`, `npm run test:postgres` y `npm run recovery:backup`.
Para restaurar, seguir el [procedimiento y límites](docs/gobernanza/ensayo-recuperacion-2026-11-27.md).
No borrar ni reutilizar bases para repetir el ensayo.

## Groq y Centro de IA local

El Centro de IA ahora es el chat de **Nori**, una plantita asistente. Conversaciones
privadas guardadas en SQL, preguntas de seguimiento y fuentes por respuesta.
Ver [guía de Nori y pruebas manuales](docs/agentes/nori.md). No compartir claves
en el chat. La mascota conserva la identidad visual y el logo oficial.

ADR 0015 registra Groq con `openai/gpt-oss-120b`. El adaptador interno tiene
validación estructural, comprobación de fuentes, límites de contexto/respuesta,
timeout de 30 s y errores depurados. Las herramientas de lectura se ejecutan
en backend con permisos; el modelo no elige ni ejecuta acciones libremente.
Centro privado: `/mi-espacio/ia`. AG-01/02/03/06/07/08 conectados a Groq;
AG-04/05 pendientes de corpus autorizado y RAG. No hay visión ni Drive conectados.

Configurar `GROQ_API_KEY` exclusivamente en el entorno privado del backend.
No enviarla por chat ni guardarla en Git. `GROQ_ZDR_CONFIRMED=true` solo registra
confirmación humana de los controles reales en la cuenta de Groq; no configura
al proveedor. Sin confirmación, el adaptador bloquea contexto privado.
Se verificaron llamadas reales con datos ficticios en la base de pruebas;
la evaluación semántica de 40 casos sigue pendiente.

Primera configuración: desde `backend/`, ejecutar `npm run groq:configure`
(clave oculta) y después `npm run groq:check` (solicitud con datos ficticios).
Ver [pasos completos y límites](docs/agentes/configuracion-groq.md).
No enviar la clave por chat. Reiniciar backend tras modificar su entorno.

Guía de [funciones, evidencia y prueba manual](docs/agentes/entrega-local-2026-11-27.md).
API: `GET /api/ia`, `GET/POST /api/ia/ejecuciones`. Cuotas persistidas de desarrollo:
20 consultas/usuario y 100/empresa por día UTC; Groq puede imponer límites menores.
`npm run groq:evaluate -- AG-06` verifica un agente con fixtures nuevos y consumo
real de Groq, exclusivamente en SQL de pruebas. No ejecutar repetidamente para
eludir límites; no equivale al banco de calidad. Sin argumento intenta seis casos.
