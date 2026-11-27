# PLAN.md — Plan de implementación

Fecha base: 2026-11-24
Estado: base, identidad, equipo, materiales y operación locales con evidencia API/MySQL en TASKS.md. Revisión manual nueva y ajustes visuales pendientes.
Autorización vigente: ADR 0007–0009 para etapas previas; ADR 0010–0013 para destino PostgreSQL, operación y gobernanza local.
Sin integración de proveedores externos ni publicación.

## Objetivo

Construir desde cero frontend y backend de una aplicación full stack
con persistencia, permisos, operaciones empresariales e IA real,
conforme al anteproyecto.

## Reglas de ejecución

- Desarrollar con React + Vite + JavaScript/JSX + React Router y
  Node.js + Express + Sequelize, respetando AGENTS.md. MySQL aislado sigue
  operativo; PostgreSQL/Supabase es el destino autorizado, pendiente de migración verificada.
- No trasladar, reutilizar ni adaptar código, configuración o dependencias
  del prototipo de AI Studio; inspeccionarlo como referencia visual concreta
  según ADR 0006. Se permite reutilizar sus archivos visuales PNG/JPG.
- La ausencia del prototipo no bloquea la base técnica; la fidelidad visual
  requiere la referencia disponible y evidencia de comparación.
- No dar por implementada una función por tener una pantalla.
- No empezar integraciones antes de definir permisos y datos.
- Mantener trazabilidad entre requisitos, tareas y evidencia.
- Las fechas del anteproyecto son una propuesta histórica;
  comprobar el calendario real antes de prometer entregas.
- No recortar requisitos obligatorios sin decisión del responsable.

## Etapa 0 — Documentación y decisiones

Preparar:
- Governance Pack.
- PLAN.md, TASKS.md y README.md.
- Borradores de políticas.
- Referencias del anteproyecto y marca.

Decisión indicada por el responsable el 2026-11-24:
- Construcción desde cero con JavaScript/JSX; ver ADR 0004 aceptado.
- ADR 0005 aceptado concilia la secuencia del anteproyecto: la base local
  puede comenzar; proveedor, tratamiento de datos y configuración se cierran
  antes de cada integración. Alojamiento productivo antes del despliegue.
- Libro de marca v1.0 vigente; referencias a identidad pendiente en las
  secciones 17.5 y 18.2–18.4 del anteproyecto quedan como antecedentes desactualizados.
- Consignas originales localizadas y consultadas el 2026-11-26; PostgreSQL está
  permitido. ADR 0010 concilia motor, alojamiento y alcance del taller CRM.
  Comparación de proveedores, costos y pruebas públicas siguen pendientes.

Resolver según la etapa que lo requiera:
- Entorno MySQL exclusivo de desarrollo y pruebas antes de verificar la base técnica.
- Proveedor y modelo de IA antes de integrar IA real.
- Para toda integración: tratamiento de datos, ubicación, permisos y configuración
  cerrados antes de conectarla, según ADR 0005.
- Alojamiento, regiones, responsables y canal de privacidad antes de publicación.
- Almacenamiento privado e índice antes de integrar documentos y RAG reales.

Salida:
Documentación coherente; decisiones pendientes identificadas.
No se exige contratar infraestructura para completar esta etapa.

## Etapa 1 — Base técnica

- Seleccionar y verificar versiones de Node y dependencias propias del proyecto.
- Crear frontend y backend desde cero con la estructura de AGENTS.md.
- Construir una página inicial y navegación mínima según el libro de marca.
- Incorporar React Router y capa de servicios.
- Configurar Express y manejo de errores.
- Preparar conexión MySQL.
- Preparar migraciones iniciales de roles, permisos y rol_permiso;
  seeders de los seis roles y su matriz, sin cuentas de acceso de demostración.
- Incorporar las restantes entidades del DER con su módulo en etapas posteriores.
- Configurar variables de entorno.

Salida:
Frontend compilable, API verificable y base de datos inicializable
con instrucciones reproducibles.

### Archivos previstos

- frontend/package.json, package-lock.json, vite.config.js, index.html y .env.example.
- frontend/src/main.jsx, App.jsx, routes/AppRouter.jsx, services/api.js,
  pages/Inicio.jsx, components/LayoutPublico.jsx y styles/global.css.
- frontend/public/ y src/assets/ para recursos oficiales disponibles;
  no reconstruir el logo ni presentar variantes no entregadas como aprobadas.
- backend/package.json, package-lock.json, .env.example y .sequelizerc.
- backend/src/app.js, server.js, config/env.js, config/database.js,
  config/sequelize-cli.cjs, models/index.js, models/Rol.js, models/Permiso.js,
  models/RolPermiso.js, routes/health.routes.js, controllers/health.controller.js,
  services/health.service.js, middlewares/requestId.js, middlewares/notFound.js
  y middlewares/errorHandler.js.
- backend/migrations/ y seeders/: catálogos iniciales de roles y permisos.
- backend/tests/: salud HTTP, errores seguros y migraciones contra MySQL de pruebas.
- Crear y mantener las carpetas controllers/, schemas/, services/agents/ y prompts/,
  así como docs/agentes/, docs/api/ y workflows/, según la estructura objetivo;
  no crear implementaciones ficticias para llenarlas.
- README.md, TASKS.md y docs/api/openapi.yaml: comandos, evidencia y contrato de salud.

### Alcance y criterios de aceptación

- Instalación limpia y compilación del frontend comprobadas con versiones documentadas.
- React Router permite navegación y recarga de rutas; el frontend consulta la API propia.
- Base visual nueva conforme al libro de marca; comprobar 360, 768 y 1440 px,
  teclado, etiquetas y foco. Integrar el logo solo si está disponible el recurso aprobado.
- Salud de proceso y disponibilidad de MySQL distinguibles; errores HTTP seguros,
  sin SQL, secretos ni stack trace y con requestId.
- Migraciones y seeders inicializan una base vacía de desarrollo/pruebas;
  repetición y reversión documentadas y verificadas solo en base desechable.
- Variables ficticias por aplicación; ningún secreto en frontend ni repositorio.
- Pruebas HTTP e integración MySQL ejecutadas con resultados registrados en TASKS.md.
- No incluye todavía registro, sesión, catálogo operativo, IA ni integraciones;
  todas esas funciones permanecen pendientes.

### Dependencias y decisiones

No hay decisión de lenguaje ni disponibilidad del prototipo pendiente.
Puede iniciarse la estructura sin elegir proveedores externos. Para completar
la verificación de esta etapa se necesita una instancia MySQL de desarrollo
y otra base exclusiva de pruebas, credenciales locales y permisos de migración.
Las versiones y compatibilidad se verificarán al iniciar la construcción.
La falta de recursos gráficos oficiales limita su integración, no la base técnica.
IA, alojamiento productivo, correo, almacenamiento, índice y n8n se decidirán
antes de sus respectivas integraciones o publicación; no se eligen por suposición.

### Resultado observado — 2026-11-24

Implementada la base local. Instalaciones limpias, compilación, siete pruebas
backend con MySQL real, HTTP, proxy, caída 503 y persistencia tras reinicio
verificados; evidencia y versiones en TASKS.md y README.md.
La revisión visual 360/768/1440 px y teclado no pudo ejecutarse porque el
host de navegador de verificación no estuvo disponible. La etapa no se declara
íntegramente aceptada hasta completar esa revisión. En esa verificación el
logo estaba pendiente; posteriormente se incorporó el PNG suministrado (ADR 0006).

## Etapa 2 — Empresas, usuarios y permisos

Entrega actual: registro transaccional, borradores versionados, login, sesión,
logout, perfil propio/empresarial, permisos vigentes y aislamiento entre dos empresas.
Inicio aceptado como base provisional: sin rediseño; no cerrar tareas visuales
ni responsive por esa aceptación. Ver ADR 0007 y evidencia de pruebas en TASKS.md.
Equipo e invitaciones implementados según ADR 0008: entrega manual exclusiva
de desarrollo, sin envío de correo; funciones combinables, desactivación,
auditoría y protección concurrente del último administrador verificadas por API/MySQL.
Recuperación manual segura de desarrollo añadida en ADR 0012; proveedor de correo
y recuperación productiva siguen pendientes. Reactivación conserva funciones
y exige nuevo login, sin recuperar sesiones revocadas.
No reiniciar bases: migraciones aditivas y pruebas solo en nuevo_origen_test.

- Registro de empresa y administrador.
- Aceptaciones de políticas versionadas.
- Inicio y cierre de sesión.
- Recuperación segura de acceso.
- Equipo, invitaciones y funciones combinables.
- Autorización por rol, empresa y recurso.
- Perfiles públicos y privados.

Salida:
Dos empresas independientes con datos y permisos aislados.
La salida se verificó por API y MySQL. El responsable reportó registro, acceso,
edición/persistencia, teclado y responsive 360/768/1440 px de la versión previa
a equipo. Es validación manual reportada, no automatizada ni observada por el agente.
Recorrido manual de las pantallas nuevas y ajustes visuales pendientes.

## Etapa 3 — Materiales y catálogo

Entrega local implementada según ADR 0009. Ofertas y necesidades propias con
propiedades, cantidades exactas, estados, fotografías autorizadas y auditoría.
Catálogos administrables por plataforma; catálogo y perfil empresarial públicos
con proyección de datos. Pruebas API/MySQL y compilación documentadas; revisión
manual reportada por el responsable en materiales. Moderación local añadida
en la etapa de operación; su revisión manual nueva sigue pendiente.
El inicio conserva el diseño provisional. Solicitudes y acuerdos se implementan
en la etapa 4; sin IA ni publicación.

- Categorías, unidades y propiedades.
- Ofertas y necesidades.
- Imágenes y archivos.
- Moderación según alcance.
- Catálogo público y filtros.
- Validación de cantidades y estados.

Salida:
Una empresa publica y otra encuentra el material.
Los cambios permanecen al recargar.

## Etapa 4 — Operación entre empresas

Mejora autorizada 2026-11-27 (ADR 0014): mensajería como módulo propio, con bandeja
y conversación por solicitud vinculada al acuerdo; idempotencia de envío,
cursores, actualización periódica y navegación privada común. No añade un chat
general ajeno a RF-11. Revisar visualmente las pantallas afectadas antes de cerrar
accesibilidad/responsive; los informes manuales anteriores no cubren este marco.

Implementada localmente por ADR 0011: pruebas API/MySQL, reservas concurrentes,
intercambio, entregas parciales/idempotentes, uso bilateral, cancelación y revisión
de casos. Indicadores por periodo y tendencias, seguimiento por etapas y avisos
de interfaz persistidos. Recorrido manual de pantallas nuevas pendiente.

- Solicitudes.
- Conversación y seguimiento.
- Acuerdos y reservas.
- Entregas parciales o completas.
- Confirmación de aprovechamiento.
- Discrepancias y cancelaciones.
- Auditoría de operaciones relevantes.

Salida:
Flujo comprobado:
oferta → solicitud → acuerdo → entrega → confirmación.

Verificar concurrencia y consistencia de cantidades.

## Etapa 5 — IA y documentos

- Implementar los ocho agentes definidos en el anteproyecto.
- Integración configurable desde backend.
- Herramientas limitadas y salidas validadas.
- Documentos e índice RAG.
- Filtros empresariales antes de recuperar contexto.
- Fuentes verificables y respuesta sin evidencia.
- Retiro e invalidación de documentos.
- Historial, costos, límites y manejo de fallos.

Salida:
Casos de prueba por agente, con permisos y fuentes comprobados.

## Etapa 6 — Automatizaciones y gobernanza funcional

Entrega local parcial (ADR 0012–0013): consentimientos, exportación acotada,
recepción/revisión de derechos, recuperación manual de desarrollo, cuentas
globales, borradores y auditoría. Eliminación efectiva, correo, programación
de limpieza, respaldo/restauración y servicios externos siguen pendientes.

- Tres workflows n8n del anteproyecto.
- Sincronización autorizada de Google Drive.
- Correo y notificaciones.
- Reintentos controlados e idempotencia.
- Exportación de datos propios.
- Rectificación y solicitudes de eliminación.
- Conservación y tratamiento de respaldos.
- Reportes derivados de operaciones reales.

Salida:
Integraciones ejecutadas y controles de gobernanza probados.

## Etapa 7 — Validación y publicación

Destino elegido: frontend Vercel, Express Render y PostgreSQL Supabase. No
publicado ni migrado. Antes del cambio: ensayo PostgreSQL separado, comparación
de datos/constraints/decimales, regresión, respaldo y reversión. Ver
`docs/gobernanza/preparacion-produccion.md` para bloqueos de configuración,
accesos, almacenamiento y tratamiento de datos. No instalar o conectar un
CRM externo sin identificarlo; el taller aporta seguimiento por etapas.

- Revisar criterios RF, RNF e historias del anteproyecto.
- Probar permisos positivos y negativos.
- Revisar accesibilidad y responsive.
- Verificar migraciones, respaldo y restauración.
- Revisar dependencias y secretos.
- Completar documentación de instalación y API.
- Validar políticas frente al sistema y normativa aplicable.
- Preparar despliegue.
- Publicar con autorización.

Salida:
URL operativa y evidencias reproducibles.
No presentar simulaciones como integraciones reales.

## Primera meta operativa

Inicio aceptado como base provisional por el responsable. Continuar las etapas
autorizadas conservando el diseño; ajustes visuales del ADR 0006 siguen pendientes.
Construcción técnica desde cero con el prototipo de AI Studio como referencia visual; sin reutilización de su código.
Comparación por archivos documentada en ADR 0006; aceptación visual pendiente
a 360/768/1440 px, navegación, menú móvil, diálogos, foco y fuentes cargadas.
No trasladar el inspector ni presentar las seis tarjetas ficticias como ofertas reales.

Registrar dos empresas.
Publicar una oferta con la primera.
Buscarla con la segunda.
Recargar y comprobar persistencia.
Verificar que ninguna accede a información privada de la otra.
