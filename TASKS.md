# TASKS.md — Seguimiento de Nuevo Origen

## Convenciones

- [ ] Pendiente.
- [x] Terminada y verificada.
- Para trabajo iniciado, añadir "EN PROCESO" en la descripción.
- Para bloqueos, indicar causa y decisión necesaria.
- No completar casillas por la sola existencia de una pantalla.

## Estado de partida

Frontend y backend se construirán desde cero con JavaScript/JSX,
por instrucción del responsable del proyecto del 2026-11-24 (ADR 0004).
Construcción técnica desde cero con el prototipo de AI Studio como referencia visual; sin reutilización de su código.
El prototipo es referencia visual concreta para el inicio (ADR 0006); no se
trasladará ni adaptará su código. Se permite reutilizar archivos visuales suministrados.
La base técnica no depende del prototipo. La inspección inicial no encontró
código; ahora existe la base local descrita en la evidencia de esta etapa.
La identidad real ya está implementada; catálogo, acuerdos e integraciones siguen pendientes.

## 0. Documentación

- [x] Conciliar autorización local, integraciones por etapa y marca vigente (ADR 0005; lectura y contraste documental 2026-11-24). No acredita controles implementados.

- [ ] Validar vigencia y trazabilidad del anteproyecto y libro de marca presentes en docs/referencias/.
- [x] Registrar construcción desde cero y JavaScript/JSX indicados por el responsable (ADR 0004; evidencia abajo).
- [ ] Revisar el inventario de datos.
- [ ] Resolver y aceptar ADR 0001.
- [ ] Resolver y aceptar ADR 0002.
- [ ] Resolver y aceptar ADR 0003.
- [ ] Revisar registro de riesgos y responsables.
- [ ] Revisar AGENTS.md.
- [ ] Revisar borradores de políticas.
- [ ] Vincular requisitos del anteproyecto con tareas y pruebas.

## 1. Base técnica

EN PROCESO: base implementada y verificada técnicamente por ADR 0005.
Validación manual de teclado y responsive reportada por el responsable (ver
registro abajo). Ajustes visuales pendientes. Logo PNG incorporado según ADR 0006.
Sin publicación ni proveedores externos.

- [x] Verificar versiones de Node y dependencias (evidencia técnica abajo).
- [x] Crear frontend y backend desde cero con la estructura de AGENTS.md.
- [ ] Construir página inicial y layout nuevos según el libro de marca — EN PROCESO: base provisional aceptada; ajustes visuales pendientes. Teclado reportado por el usuario abajo.
- [x] Integrar el logo PNG y recursos visuales suministrados, sin reconstrucción (identidad de archivos comprobada; apariencia en navegador pendiente).
- [x] Configurar rutas y servicios del frontend (compilación y proxy HTTP comprobados; recorrido visual pendiente).
- [x] Configurar Express, validación inicial de configuración/JSON y errores (no incluye validación de módulos futuros).
- [x] Configurar MySQL y Sequelize para desarrollo y pruebas locales separados.
- [x] Implementar roles, permisos y rol_permiso iniciales según el DER.
- [x] Crear migraciones y seeders iniciales de seis roles y permisos, sin acceso demo.
- [ ] Incorporar progresivamente el resto del DER con cada módulo de las etapas 2 a 6.
- [x] Crear .env.example por aplicación.
- [x] Verificar instalación y compilación.
- [x] Verificar salud HTTP, errores seguros y conexión a MySQL desde la API.
- [x] Probar migraciones, seeders y reversión en base desechable de pruebas.
- [x] Validación manual de navegación por teclado y responsive a 360/768/1440 px reportada por el responsable; no es prueba automatizada ni revisión independiente del agente.
- [x] Documentar contrato de salud y comandos realmente ejecutados.

## 2. Identidad y acceso

EN PROCESO: entrega local según ADR 0007. Inicio aceptado provisionalmente;
ajustes visuales pendientes. Validación manual previa reportada por el responsable;
las pantallas nuevas de equipo aún requieren su propia revisión. Sin rediseño.

- [x] Registro empresarial y administrador por API en una transacción, con reversión probada.
- [x] Aceptaciones versionadas de dos borradores locales y preferencia opcional separada.
- [x] Contraseñas bcrypt 12 y sesión JWT HttpOnly persistida y verificada en MySQL.
- [x] Cierre y revocación de sesión; rechazo de cookie revocada y sesión expirada.
- [x] CSRF en mutaciones, comprobación de origen, validación estricta y límites locales de intentos.
- [ ] Recuperación con tokens de uso único y vencimiento.
- [x] API de integrantes, invitaciones y auditoría; entrega manual solo en desarrollo sin simular correo. Pruebas en evidencia de equipo abajo.
- [x] Pantallas de equipo y aceptación integradas al espacio privado/público existente; compilación verificada. Recorrido manual nuevo pendiente por separado.
- [x] Unión de permisos de funciones empresariales combinadas y lectura vigente en cada petición; probado con fixtures en base de pruebas.
- [x] Gestión de funciones combinables, desactivación y protección transaccional del último administrador; pruebas de concurrencia y revalidación del actor ejecutadas.
- [x] Permisos por empresa y recurso en perfiles implementados; sin IDs/roles confiados al navegador.
- [x] Pruebas API de acceso y edición entre dos empresas independientes.
- [x] Formularios de registro/acceso, espacio privado, carga, errores, cierre y rutas protegidas implementados; compilación verificada.
- [x] Perfil personal (nombre) y empresarial (campos autorizados) persistidos y consultados de nuevo por API.
- [x] Retorno público validado sin redirección externa ni ejecución automática de acciones.
- [x] Registro, acceso, edición y persistencia de perfiles: validación manual reportada por el responsable.
- [x] Teclado y responsive a 360/768/1440 px: validación manual reportada por el responsable para la versión previa a equipo.
- [ ] Revisión manual de las nuevas pantallas de equipo e invitaciones y su regresión visual; ajustes visuales siguen pendientes.

### Validación manual reportada por el responsable — 2026-11-24

Fuente: mensaje en esta conversación: «Confirmé manualmente que funcionan
registro, acceso, edición y persistencia de perfiles, navegación con teclado
y responsive a 360, 768 y 1440 px».
Se registra como evidencia reportada por el usuario, no ejecutada ni observada
por el agente y no como prueba automatizada. No se aportaron capturas ni
versiones de navegador. No certifica accesibilidad completa ni las pantallas
de equipo añadidas posteriormente. Los ajustes visuales permanecen pendientes.

### Evidencia de equipo e invitaciones — 2026-11-24

- ADR 0008 nuevo; ADR aceptados anteriores conservados. API 0.3.0, README,
  PLAN y AGENTS actualizados. Sin rediseño del inicio ni dependencias nuevas
  añadidas a la aplicación; sin proveedor externo ni publicación.
- Migración aditiva `20261124000300-equipo-invitaciones-auditoria.js` aplicada
  en desarrollo y pruebas: `tokens_accion`, `invitaciones`, `invitacion_roles`,
  `auditoria`, con FK y unicidad del hash/token por invitación y de funciones.
  No se ejecutaron undo, DROP, TRUNCATE ni reinicio de bases. MySQL80 no modificado.
- Implementados modelo, esquema estricto, controlador, servicio y rutas de
  equipo. Cuatro funciones empresariales reutilizan los roles/permisos existentes.
  Empresa y autoridad se resuelven desde sesión; mutaciones bloquean la empresa
  y vuelven a comprobar al actor bajo la transacción READ COMMITTED.
- Tokens aleatorios de 256 bits; solo SHA-256 persistido, una hora, uso único,
  revocación. No aparecen en listados ni auditoría; enlace visible una sola vez
  al administrador autorizado en desarrollo. Aviso explícito de que no se envió
  correo; creación fuera de desarrollo devuelve 503 sin simular entrega.
- Aceptación persiste usuario, funciones, dos aceptaciones de borradores,
  preferencia opcional, sesión y auditoría en una transacción. No transfiere
  cuentas existentes. Pérdida de administración revoca invitaciones del emisor.
- Desactivación revoca todas las sesiones; retirada de funciones efectiva en
  la siguiente petición de una sesión abierta. Sesión devuelve solo id/nombre
  de empresa; campos privados siguen sujetos a permiso `perfil.leer`.
- `backend: npm run test:mysql`: **36 pruebas, 36 correctas, 0 fallos, 0 omitidas**,
  incluida identidad previa. Conexión exclusiva `nuevo_origen_test` en instancia
  aislada 3307 y fixtures ficticios nuevos; no se purgaron datos de desarrollo.
  Los 12 subcasos de equipo cubren token válido/vencido/usado/revocado/desconocido,
  duplicados, persistencia, roles combinados, campos prohibidos, acceso sin sesión,
  aislamiento, retirada de permisos, desactivación, auditoría y rollback ante fallo,
  doble aceptación concurrente y tres carreras del último administrador.
  Las carreras encolan ambos pedidos detrás de una fila bloqueada antes de liberarla:
  retiro propio y desactivación propia dan 200/409; retiro cruzado da 200/403;
  queda exactamente un administrador activo. No es una prueba de carga general.
- `frontend: npm test`: **2/2** pruebas de retorno seguro correctas.
  `npm run build`: correcto. Contrato validado con swagger-cli 4.0.4.
  Herramientas temporales de formato/validación no se añadieron a dependencias.
- Pantallas nuevas: `/mi-espacio/equipo` y `/aceptar-invitacion` integradas con
  sesión real, carga/errores, motivos de cambio y confirmación de desactivación.
  Compilación verificada; no se ejecutó comparación visual ni recorrido de
  navegador de estas pantallas. La confirmación manual previa del usuario
  no se extiende a ellas.

Pendientes específicos:
- [ ] Recorrido manual nuevo de invitación/aceptación, funciones, desactivación y auditoría.
- [ ] Teclado y responsive 360/768/1440 px en pantallas nuevas y regresión visual.
- [ ] Ajustes visuales previamente pendientes.
- [ ] Elegir proveedor de correo, tratamiento de datos y configuración antes de integrarlo.
- [ ] Reactivación y tratamiento de cuentas ya registradas/invitación a otra empresa, sin transferencias implícitas.
- [ ] Limpieza de tokens a 30 días y conservación mínima de auditoría según gobernanza.
- [ ] Recuperación por correo, invitaciones productivas y pruebas de entrega real.

### Evidencia de identidad — 2026-11-24

- Decisión y alcance: ADR 0007. Inicio provisional conservado; solo se conectaron
  acciones de acceso/registro y se corrigió el aviso que decía que registro no existía.
  Los estilos nuevos de identidad están separados en identity.css; no se rediseñó el inicio.
- Migración aditiva aplicada en desarrollo y pruebas:
  20261124000200-identidad-empresas.js. Estado `up` comprobado en ambos entornos;
  20261124000100-roles-permisos.js permanece aplicada.
- Seeder 20261124000200-politicas-locales.js aplicado en ambas bases; dos borradores
  versionados. Catálogo de seis roles y permisos existente reutilizado, sin borrado.
- Modelos: empresas, usuarios, usuario_roles, sesiones, politicas, aceptaciones,
  consentimientos. PK/FK, correo único, pares usuario/rol y usuario/política únicos.
- npm run test:mysql: 23 casos, todos aprobados, cero omitidos. Incluye transacción
  de registro y rollback por fallo de aceptación, duplicados sin empresa huérfana,
  validaciones, bcrypt, dos empresas independientes, sesión vigente, vencimiento
  MySQL y JWT, token manipulado, logout y reproducción de cookie revocada.
- También: CSRF sin token/origen permitido, rechazo del token previo al login,
  acceso sin sesión, lectura/edición cruzada 404, edición propia persistida,
  campos y roles prohibidos 400, permisos insuficientes 403, funciones combinadas,
  revocación de función reflejada de inmediato y límite de intentos 429.
- Las pruebas solo usan nuevo_origen_test, con fixtures ficticios únicos. No usan
  DROP, TRUNCATE, sync(force) ni reinician bases. La antigua reversión de esquema
  del test inicial fue retirada; el rollback probado es transaccional de negocio.
- Frontend: npm test, 2 casos de retorno seguro aprobados; npm run build correcto
  (66 módulos). Render de React del acceso y la guardia privada comprobado en
  servidor, sin sustituir navegador. Sin credenciales ni tokens en localStorage.
- Contrato docs/api/openapi.yaml 0.2.0 validado con swagger-cli validate.
  Se corrigieron dos descripciones YAML antes de pasar la validación.
- Auditorías finales de ambas aplicaciones sin vulnerabilidades reportadas.
- Lecturas HTTP: nueva API temporal en 3002 con NODE_ENV=test respondió salud 200,
  políticas 200 y sesión anónima 401. Vite existente en 5173 sirvió /registro,
  /acceso y /mi-espacio con HTTP 200 (servir HTML no acredita el recorrido visual).
- El backend preexistente en 3001 sigue con la versión anterior y devuelve 404 en
  rutas nuevas. No se cerró ese proceso: reiniciar desde su terminal antes de la
  prueba manual. El proxy de Vite conserva su destino original en 3001.
- Incidencia de pruebas corregida: el cliente Supertest construía una mutación
  antes de obtener la cookie CSRF. Al respetar primero el desafío, pasaron los casos.
- Límites: host de navegador inaccesible; recarga F5, recorrido visual, cookies
  observadas en DevTools, responsive y teclado no se dan por comprobados.
- Cookies Secure/__Host- para HTTPS y separación de clave de pruebas verificadas
  por configuración automatizada; no se probó ni autorizó producción.
- No hay operación implementada para retirar administradores. Se probó rechazo
  de roles/estado/empresa_id y ausencia de ruta de baja; no se declara completada
  la protección transaccional de la futura gestión de equipo.
- Persistencia después de nuevas consultas API comprobada; recarga real en navegador
  pendiente. No se enviaron correos, no se conectaron proveedores y no se publicó.
- MySQL80 y bases ajenas no se modificaron. Los datos de desarrollo no se purgaron.
- Cierre de verificación: API temporal de pruebas en 3002 e instancia aislada
  detenidas, datos conservados. Servidores preexistentes en 3001/5173 no se cerraron.
  Para revisar manualmente, reanudar MySQL aislado y reiniciar el backend anterior.

## 3. Catálogo y materiales

- [ ] Categorías, unidades y propiedades.
- [ ] Crear, editar y consultar ofertas.
- [ ] Necesidades de materiales.
- [ ] Validación y estados de publicación.
- [ ] Imágenes y archivos autorizados.
- [ ] Catálogo y filtros conectados a API.
- [ ] Perfil empresarial público.
- [ ] Moderación.

## 4. Solicitudes y acuerdos

- [ ] Solicitudes y transiciones válidas.
- [ ] Conversación y seguimiento.
- [ ] Acuerdos y reservas consistentes.
- [ ] Entregas y confirmaciones.
- [ ] Discrepancias y cancelaciones.
- [ ] Cantidades pendientes y concurrencia.
- [ ] Auditoría.
- [ ] Flujo completo entre dos empresas.

## 5. IA

- [ ] Integración de proveedor desde backend.
- [ ] Contratos de entrada y salida.
- [ ] AG-01: enrutamiento y orientación.
- [ ] AG-02: asistencia de clasificación.
- [ ] AG-03: compatibilidad explicada.
- [ ] AG-04: sugerencias de aprovechamiento.
- [ ] AG-05: consulta documental RAG.
- [ ] AG-06: borradores de seguimiento.
- [ ] AG-07: explicación de indicadores.
- [ ] AG-08: asistencia de revisión.
- [ ] Contrastar nombres y contratos con el anteproyecto.
- [ ] Permisos y límites por agente.
- [ ] Fuentes verificables.
- [ ] Pruebas sin evidencia y con documentos maliciosos.
- [ ] Límites de consumo y fallos del proveedor.

## 6. Integraciones y derechos

- [ ] Documentos privados e índice RAG.
- [ ] Retiro de documentos e invalidación del índice.
- [ ] Google Drive autorizado.
- [ ] Tres workflows n8n definidos por el anteproyecto.
- [ ] Correo y notificaciones.
- [ ] Evitar notificaciones duplicadas.
- [ ] Exportación de datos propios.
- [ ] Rectificación y baja verificadas.
- [ ] Conservación y limpieza programada.
- [ ] Restauración con reaplicación de supresiones.
- [ ] Reportes y exportaciones reales.

## 7. Entrega

- [ ] Matriz de requisitos y evidencia.
- [ ] Pruebas de seguridad y permisos.
- [ ] Revisión responsive y accesibilidad.
- [ ] Documentación de API.
- [ ] README con comandos comprobados.
- [ ] Políticas coherentes con el comportamiento real.
- [ ] Infraestructura y despliegue autorizados.
- [ ] Demostración reproducible.

## Evidencia por tarea terminada

Registrar:
- Tarea:
- Fecha:
- Archivos o commit:
- Verificación ejecutada:
- Resultado:
- Limitaciones:

## Decisiones pendientes

- Proveedor y modelo de IA.
- Alojamiento y región.
- Almacenamiento de documentos e índice.
- Responsables y contacto.
- Validación final de plazos y políticas.

La elección de IA, alojamiento productivo y demás servicios externos no bloquea
la estructura inicial; debe resolverse antes de integrar cada servicio o publicar.
El prototipo no es dependencia técnica; es referencia para la comparación visual.
JavaScript/JSX ya fue indicado por el responsable.

## Ajuste visual de inicio — ADR 0006

- [x] Inspeccionar inicio, cabecera, pie, tarjetas, imágenes y reglas visuales del prototipo.
- [x] Documentar diferencias por composición, tipografía, medidas, espaciado, colores, imágenes, botones y secciones en ADR 0006.
- [x] Incorporar PNG del logo, hero y seis imágenes como recursos visuales; no copiar código.
- [ ] EN PROCESO: reproducir la apariencia con componentes y estilos propios;
  implementación y compilación listas, aceptación visual pendiente.
- [ ] Comparar capturas equivalentes del prototipo y de la aplicación a 360 px.
- [ ] Comparar capturas equivalentes del prototipo y de la aplicación a 768 px.
- [ ] Comparar capturas equivalentes del prototipo y de la aplicación a 1440 px.
- [ ] Verificar menú móvil, foco, teclado, diálogos y carga de fuentes en navegador.

La disponibilidad anterior del logo y las versiones tipográficas consignadas en
la evidencia inicial se conservan como antecedentes; este ajuste las actualiza.
El host de navegador respondió «The browser access host is unavailable».
No hay capturas equivalentes ni validación visual de los tres anchos.
Se implementaron media queries para esos tamaños, sin presentarlas como prueba.
No se modificaron backend, API, rutas ni conexión; /estado sigue separado.
Las seis tarjetas contienen ejemplos ficticios identificados, no stock ni ofertas
persistidas. Búsqueda, acceso, registro y publicación siguen sin implementar.
Los controles pendientes explican la limitación. No hay inspector de demostración.

Evidencia técnica del ajuste:
- npm run build: compilación correcta con 57 módulos transformados.
- Render de React en servidor: inicio con ocho categorías, seis tarjetas y logo;
  /estado renderizado aparte, sin tarjetas. Es comprobación estructural, no visual.
- HTTP 200 en /, /estado, logo PNG, hero JPG y Fraunces Variable WOFF2 local.
- SHA-256 del logo idéntico al recurso suministrado:
  B8031E32C08A69AD7BB2A4BBB22EBA990578E81C96E88E41606F715589FCDA09.
- Siete JPG incorporados (hero y seis materiales) idénticos a los originales.
- Sustituida Fraunces estática por @fontsource-variable/fraunces 5.3.0;
  licencia conservada. Instalación reportó cero vulnerabilidades.
- No se ejecutó ni se instaló el prototipo; solo se inspeccionaron sus archivos.
- Los intentos iniciales de formateo/compilación dentro del sandbox fallaron
  por caché/acceso de esbuild; repetidos con permisos de ejecución, finalizaron bien.
- La primera comprobación SSR se corrigió por escapado del comando y se repitió
  sin escaneo de dependencias; pasó sin errores. No modifica configuración de la aplicación.
- No se ejecutaron pruebas backend/MySQL en esta tarea porque no se modificaron.

## Evidencia documental — 2026-11-24

- Tarea: registrar construcción desde cero y elección de JavaScript/JSX.
- Fuente: aclaración explícita del responsable del proyecto en esta conversación.
- Archivos: AGENTS.md, PLAN.md, TASKS.md, README.md y ADR 0004.
- Verificación: lectura y búsqueda de instrucciones incompatibles; comprobación
  de que las tareas funcionales permanecen pendientes.
- Resultado: decisión documental registrada; no acredita implementación.
- Limitaciones: no se instalaron dependencias ni se ejecutaron compilación,
  migraciones o pruebas de aplicación.

## Evidencia técnica de etapa 1 — 2026-11-24

Este registro es posterior a la evidencia documental anterior, que se conserva
como antecedente. No completa tareas de identidad, negocio ni gobernanza futura.

- Archivos: frontend/, backend/, docs/api/openapi.yaml, .gitignore, README.md,
  PLAN.md y ADR 0005. ADR 0004 y los ADR 0001–0003 no fueron reescritos.
- Entorno: Windows; Node 24.13.0; npm 11.6.2; MySQL 8.0.46 aislado en 3307.
  MySQL80 original permaneció activo y no se usó para las pruebas.
- Versiones: React/React DOM 19.3.1, Router 7.18.6, Vite 7.3.8,
  plugin React 5.2.0, fuentes 5.3.0; Express 5.3.0, Sequelize 6.37.8,
  CLI 6.6.5, mysql2 3.24.6, dotenv 17.4.2, supertest 7.3.2.
- Instalación: npm ci --ignore-scripts ejecutado en ambas aplicaciones.
  npm run build en frontend finalizó correctamente después de la instalación limpia.
- Backend: npm run test:mysql, 7 pruebas aprobadas, 0 fallos, 0 omitidas.
  Incluye configuración local, rechazo de producción y host externo, HTTP 404,
  JSON inválido 400, cuerpo excesivo 413, salud 200 y fallo MySQL 503 sin detalles.
- MySQL real: migrar, seed dos veces sin duplicación, seis roles sin visitante,
  límites de capacidades empresariales/globales, unicidad, FK, denegación de
  acceso desde usuario de pruebas a desarrollo, reversión y reconstrucción.
- Desarrollo: db:migrate y db:seed aplicados; SQL confirmó 6 roles, 36 permisos,
  68 relaciones. Tras reiniciar la instancia aislada, los datos permanecieron
  y /api/health/ready volvió a responder 200.
  También se verificó una lectura real con Rol.findOne incluyendo Permiso,
  comprobando la asociación N:M y el permiso de acuerdos del administrador empresarial.
- HTTP real: 200 en /api/health y /api/health/ready, inicio y /estado desde Vite,
  y /api/health/ready a través del proxy. Con MySQL detenido: proceso 200,
  disponibilidad 503. Ningún endpoint expone el catálogo de permisos.
- Dependencias: auditorías finales sin vulnerabilidades en ambas aplicaciones.
  Overrides transitivos documentados en README; no se usó degradación forzada.
- Incidencias resueltas: proceso MySQL desprendido cerrado por el ejecutor;
  se mantuvo en sesión activa. npm ci inicialmente bloqueado por esbuild en uso;
  se detuvo Vite y se repitieron instalación y compilación con éxito.
- Limitaciones: host del navegador inaccesible; no se ejecutaron recorridos
  visuales, pruebas a 360/768/1440 px, teclado ni lector. CSS y semántica están
  implementados pero no se presentan como accesibilidad comprobada.
- Logo maestro separado no disponible; no se recreó. Fuentes y licencias locales.
- Los roles persistidos son un catálogo: autenticación y autorización por usuario,
  empresa y recurso siguen pendientes. Tampoco se cerraron riesgos por documentarlos.
- No se conectaron proveedores externos ni se publicó el sistema. Bases de datos
  y secretos locales quedan en .local/ y backend/.env, ignorados por Git.
- Cierre: Vite, API e instancia MySQL aislada detenidos; sin listeners en
  5173, 3001 o 3307. Datos conservados; MySQL80 original sigue activo.
