# TASKS.md — Seguimiento de Nuevo Origen

## Convenciones

- [ ] Pendiente.
- [x] Terminada y verificada.
- Para trabajo iniciado, añadir "EN PROCESO" en la descripción.
- Para bloqueos, indicar causa y decisión necesaria.
- No completar casillas por la sola existencia de una pantalla.

## Estado de partida

Actualización 2026-11-27: mensajería independiente y marco privado común
implementados según ADR 0014. Evidencia y pendientes al final de este documento;
la revisión manual previa no se extiende al marco nuevo.

Frontend y backend se construirán desde cero con JavaScript/JSX,
por instrucción del responsable del proyecto del 2026-11-24 (ADR 0004).
Construcción técnica desde cero con el prototipo de AI Studio como referencia visual; sin reutilización de su código.
El prototipo es referencia visual concreta para el inicio (ADR 0006); no se
trasladará ni adaptará su código. Se permite reutilizar archivos visuales suministrados.
La base técnica no depende del prototipo. La inspección inicial no encontró
código; ahora existe la base local descrita en la evidencia de esta etapa.
Identidad, catálogo y operación local implementados con evidencia API/MySQL.
Gobernanza parcialmente implementada; conexiones externas, migración PostgreSQL
y despliegue pendientes. La revisión manual previa no cubre pantallas nuevas.

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
las pantallas nuevas de recuperación y plataforma aún requieren su revisión. Sin rediseño.

- [x] Registro empresarial y administrador por API en una transacción, con reversión probada.
- [x] Aceptaciones versionadas de dos borradores locales y preferencia opcional separada.
- [x] Contraseñas bcrypt 12 y sesión JWT HttpOnly persistida y verificada en MySQL.
- [x] Cierre y revocación de sesión; rechazo de cookie revocada y sesión expirada.
- [x] CSRF en mutaciones, comprobación de origen, validación estricta y límites locales de intentos.
- [x] Recuperación local por token seguro, de uso único y con vencimiento; emisión manual de plataforma en desarrollo, sin correo. Pruebas en evidencia de operación.
- [ ] Recuperación productiva mediante canal de entrega autorizado y comprobado.
- [x] API de integrantes, invitaciones y auditoría; entrega manual solo en desarrollo sin simular correo. Pruebas en evidencia de equipo abajo.
- [x] Pantallas de equipo y aceptación integradas; compilación verificada y recorrido manual reportado por el responsable el 2026-11-26.
- [x] Unión de permisos de funciones empresariales combinadas y lectura vigente en cada petición; probado con fixtures en base de pruebas.
- [x] Gestión de funciones combinables, desactivación y protección transaccional del último administrador; pruebas de concurrencia y revalidación del actor ejecutadas.
- [x] Permisos por empresa y recurso en perfiles implementados; sin IDs/roles confiados al navegador.
- [x] Pruebas API de acceso y edición entre dos empresas independientes.
- [x] Formularios de registro/acceso, espacio privado, carga, errores, cierre y rutas protegidas implementados; compilación verificada.
- [x] Perfil personal (nombre) y empresarial (campos autorizados) persistidos y consultados de nuevo por API.
- [x] Retorno público validado sin redirección externa ni ejecución automática de acciones.
- [x] Registro, acceso, edición y persistencia de perfiles: validación manual reportada por el responsable.
- [x] Teclado y responsive a 360/768/1440 px: validación manual reportada por el responsable para la versión previa a equipo.
- [x] Recorrido de equipo/invitaciones y teclado/responsive reportado por el responsable el 2026-11-26 («listo, todo funciona» tras la lista de comprobaciones). Validación manual reportada, no automatizada ni observada por el agente. No cubre materiales añadidos después; ajustes visuales siguen pendientes.

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
- [x] Recorrido de invitación/aceptación, funciones, desactivación y auditoría: validación manual reportada por el responsable el 2026-11-26.
- [x] Teclado y responsive 360/768/1440 px de equipo: validación manual reportada por el responsable; no acredita fidelidad visual final ni materiales posteriores.
- [ ] Ajustes visuales previamente pendientes.
- [ ] Elegir proveedor de correo, tratamiento de datos y configuración antes de integrarlo.
- [x] Reactivación local probada por API; conserva funciones, sin reabrir sesiones ni invitaciones revocadas.
- [ ] Invitación de cuentas ya registradas/a otra empresa; sin transferencias implícitas.
- [x] Herramienta local de revisión/purga de metadatos terminales a 30 días, con auditoría y prueba en base exclusiva.
- [ ] Programación productiva de limpieza y plazos definitivos de auditoría.
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

- [x] Categorías, unidades, propiedades y plantillas administrables por plataforma; ocho categorías iniciales sin límite fijo.
- [x] Crear, editar y consultar ofertas propias persistidas; permisos vigentes y campos estrictos.
- [x] Necesidades privadas, propiedades/intervalos, fecha opcional y estados; sin exposición pública.
- [x] Publicación, pausa, reanudación y archivo con validación, declaraciones y auditoría transaccional.
- [x] Fotografías JPEG/PNG/WebP verificadas y normalizadas; descargas públicas condicionadas y privadas autorizadas. No incluye documentos privados ni RAG.
- [x] Catálogo público paginado y filtros conectados a API; decimales exactos y unidad obligatoria al filtrar cantidad.
- [x] Perfil empresarial público con proyección explícita sin contactos ni dirección privada.
- [x] Pantallas nuevas compiladas e integradas; inicio conservado y acciones conectadas al catálogo real.
- [x] Recorrido funcional de materiales, persistencia, pausa/reanudación, aislamiento y necesidad privada: validación manual reportada por el responsable el 2026-11-26 tras su lista de pruebas.
- [x] Teclado y responsive 360/768/1440 px de ese recorrido: validación manual reportada, no automatizada ni observada por el agente.
- [ ] Ajustes visuales de materiales y comparación de capturas equivalentes; host de navegador del agente no disponible.
- [ ] Ejecutar manualmente el bootstrap interactivo de plataforma con credenciales elegidas por el responsable. No se creó cuenta global en desarrollo automáticamente.
- [ ] Respaldar y restaurar conjuntamente MySQL y fotografías; política de limpieza de archivos retirados.
- [x] Moderación local de casos asignados, pausa de oferta y resolución de entrega disputada con auditoría, probada por API.
- [ ] Revisión manual de moderación.

### Evidencia de materiales — 2026-11-26

- ADR 0009 registra el alcance autorizado, la visibilidad, los estados y el
  almacenamiento local; conserva ADR previos. Sin proveedores externos ni despliegue.
- Migración aditiva `20261126000100-materiales-catalogo.js` aplicada en desarrollo
  y pruebas: diez tablas (`categorias`, `unidades`, `propiedades`,
  `categoria_propiedad`, `ofertas`, `oferta_propiedad`, `archivos`,
  `oferta_archivo`, `necesidades`, `necesidad_propiedad`), FK, unicidad,
  índices y CHECK de cantidades, precios, estados y tipos de valor.
  No se ejecutaron DROP, TRUNCATE, undo, reinicios ni modificaciones de MySQL80.
- Seeder `20261126000100-catalogos-materiales.js`: ocho categorías, diez unidades,
  tres dimensiones opcionales. Sin ofertas ficticias ni cuentas de acceso demo;
  su ejecución queda registrada para no duplicarse.
- Roles/permisos reutilizados; registro/invitaciones empresariales no conceden
  rol global. Bootstrap local interactivo aislado del alta pública, con contraseña
  oculta y rechazo de correos existentes; sintaxis comprobada, ejecución manual pendiente.
- APIs y pantallas de catálogos, ofertas, necesidades, fotos, catálogo y perfil
  público. Controladores, esquemas, modelos y servicios propios. Filtros de
  texto parametrizados, paginación de doce, sin suma ni conversión de unidades.
- Fotos: 5 MiB, 16 megapíxeles, seis activas por oferta; firma/tipo/decodificación,
  WebP hasta 1600 px sin EXIF; clave aleatoria, hash y tamaño persistidos.
  CSRF/origen también en multipart. No hay directorio estático de descargas.
  Datos de pruebas en `.local/test-uploads`, desarrollo en `.local/uploads`.
- Solicitar material informa pendiente: no crea solicitudes ni reservas. La
  presentación editorial del inicio conserva sus imágenes identificadas como ejemplos.
- `npm run test:mysql` incluye identidad y equipo para detectar regresiones.
  **50 pruebas correctas, cero fallos, cero omitidas**. Incluye paginación,
  definiciones inmutables y transiciones concurrentes. Resultado y comandos: ver README, sección
  «Materiales y catálogo local». Solo usa `nuevo_origen_test`; fixtures ficticios
  nuevos y sin purgar datos previos.
- `frontend: npm test` correcto (dos pruebas, ampliadas con retornos a catálogo,
  detalle y publicación y rechazo de rutas ambiguas). Compilación Vite correcta.
- OpenAPI 0.4.0 (`openapi.yaml` + `materiales.yaml`) validado con swagger-cli.
  Multer 2.5.0 y Sharp 0.35.5 instalados; auditoría de instalación sin avisos.
- Incidencias encontradas y corregidas antes de entregar: descarga privada faltante,
  protección de rutas bajo `.local`, patrones decimales del formulario y una
  descripción YAML que se interpretaba como campos extra.
- Navegador: intento CUA devuelve «The browser access host is unavailable».
  No se acreditan capturas, responsive ni recorrido visual de materiales.
  La validación manual anterior del usuario no se extiende a esta etapa.

## 4. Solicitudes y acuerdos

- [x] Solicitudes y transiciones válidas por API; rechazo de empresa propia y campos prohibidos.
- [x] Propuestas versionadas y aceptación por contraparte; conversación privada y seguimiento SQL.
- [x] Acuerdos con reservas atómicas, venta/donación/intercambio; snapshots históricos.
- [x] Entregas parciales e idempotentes, recepción y aprovechamiento bilaterales por API.
- [x] Discrepancias, asignación concurrente y resolución humana sin sustituir a las empresas.
- [x] Cancelación libera solo reserva restante y conserva entregas históricas.
- [x] Cantidades pendientes exactas, reserva concurrente y fallo bilateral sin reserva huérfana.
- [x] Auditoría transaccional y rollback ante fallo de registro.
- [x] Flujo completo entre empresas ficticias verificado por API/MySQL exclusivo.
- [x] Indicadores SQL, tendencia diaria, unidades/direcciones y masas separadas; exportación CSV autorizada.
- [ ] Recorrido manual de solicitudes, conversación, acuerdos, entregas, indicadores y casos.
- [ ] Teclado y responsive 360/768/1440 px de estas pantallas nuevas.
- [ ] Paginación del historial de solicitud más allá de 200 eventos.

## 5. IA

Conexiones diferidas expresamente por el responsable. Sin proveedor/modelo elegido
ni servicios simulados presentados como reales. El taller CRM no impone un
proveedor: seguimiento local implementado; eventual CRM externo aún sin identificar.

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
- [x] Avisos de interfaz propios y deduplicados; no se envía correo.
- [ ] Correo real, recordatorios y coincidencias automáticas.
- [x] Exportación acotada de perfil, aceptaciones, consentimientos e historial de derechos propios, con reautenticación.
- [x] Consentimientos opcionales revocables con historial y solicitudes verificadas por contraseña; revisión pendiente visible.
- [ ] Exportación exhaustiva de conversaciones/documentos y resolución integral de derechos.
- [ ] Ejecución de baja/anonimización personal y empresarial, conservación compartida y notificación final.
- [x] Revisión/purga local controlada de tokens terminales a 30 días, con auditoría.
- [ ] Limpieza programada productiva y políticas de conservación definitivas.
- [ ] Restauración con reaplicación de supresiones.
- [x] Indicadores y CSV empresariales desde uso confirmado en SQL.
- [ ] Vistas globales de impacto, resúmenes IA y reportes automáticos.

## 7. Entrega

- [ ] Matriz de requisitos y evidencia.
- [ ] Pruebas de seguridad y permisos.
- [ ] Revisión responsive y accesibilidad.
- [ ] Documentación de API.
- [ ] README con comandos comprobados.
- [ ] Políticas coherentes con el comportamiento real.
- [x] Destinos autorizados y compatibilidad PostgreSQL con consigna verificada (ADR 0010).
- [ ] Ensayo y migración PostgreSQL, cuentas/proyectos, configuración segura y publicación verificadas.
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

## Validación manual de materiales reportada — 2026-11-26

El responsable confirmó que probó el recorrido pendiente y que funciona:
búsqueda/detalle público, recarga, pausa/reanudación, aislamiento entre empresas,
necesidad privada y revisión final de errores/teclado/tamaños de su lista.
Es validación manual reportada por él; no observación del agente, automatización,
comparación de capturas ni aceptación visual final. No se extiende a operación,
moderación, recuperación, derechos o plataforma incorporados posteriormente.

## Evidencia de operación y gobernanza local — 2026-11-26

- Rama de trabajo: `feature/operacion-empresarial`. Se conservaron cambios y
  datos anteriores; sin push, publicación ni conexión de proveedores en esta tarea.
- Fuentes: anteproyecto vigente, ADR aceptados e instrucciones; consignas
  originales de Proyecto Final, Plan de Producción y taller CRM consultadas en
  Downloads. PostgreSQL permitido expresamente, página física 6 del Proyecto
  Final. ADR 0010 registra el destino autorizado sin reescribir ADR anteriores.
- Migraciones aditivas `20261126000200-operacion-empresarial.js` y
  `20261126000300-solicitudes-derechos.js` aplicadas y registradas en desarrollo
  y pruebas. Metadatos consultados en ambas bases: seis migraciones, **36 tablas
  de dominio y dos internas de Sequelize**. Sin undo, DROP, TRUNCATE ni reinicio;
  MySQL80 no utilizado ni modificado.
- Modelos, validación estricta, servicios, controladores y rutas de solicitudes,
  mensajes, acuerdos, líneas, entregas, confirmaciones, evidencias privadas,
  incidencias, avisos y derechos. Decimales exactos y permisos vigentes bajo
  bloqueos de empresa ordenados; unidad inmutable al tener reserva/entrega.
- `backend: npm run test:mysql`: **68/68 aprobadas, cero fallos y cero omitidas**.
  Incluye identidad, equipo y materiales previos. Exclusivamente
  `nuevo_origen_test`, instancia aislada 3307, fixtures ficticios y sin reiniciar
  datos. Pruebas nuevas en `backend/tests/operations.test.js`.
- Verificado por API: solicitudes sin reserva, versión/proponente, privacidad de
  conversación, cantidades insuficientes, aceptación repetida/concurrente,
  intercambio bilateral y rollback de segunda reserva, cancelación parcial,
  idempotencia de entrega y huella incompatible, confirmaciones de ambas partes,
  uso posterior a recepción, masas medidas/estimadas y fuente, indicadores
  propios, CSV autorizado, evidencia ajena/sin sesión denegada y auditoría.
- Moderación: asignación concurrente con un ganador, caso ajeno denegado,
  acciones prohibidas rechazadas, pausa pública y anulación sin mover existencias.
  Reapertura conserva decisiones previas en auditoría y exige reconfirmar;
  reconfirmación no colisiona con avisos anteriores. Sin decisión en nombre de
  una empresa ni cambio de las condiciones del acuerdo.
- Derechos: consentimiento con historial, exportación acotada con contraseña,
  solicitud propia y revisión sin fingir eliminación, cola global denegada a
  empresa; recuperación pública genérica y entrega manual autorizada sin correo,
  enlaces revocados/usados/vencidos y revocación de sesiones al restablecer.
  Reactivación propia autorizada y ajena denegada.
- Plataforma: cuentas globales sin conversión empresarial, funciones limitadas,
  versiones de borradores inmutables y auditoría. La carrera de última
  administración usa dos fixtures persistidos en un universo de consulta
  acotado a ellos, conservando las cuentas previas de pruebas; transacciones y
  bloqueo real de la fila de rol. Un cambio procede y otro se rechaza 409;
  permanece una administración activa. No es prueba de carga general.
- Limpieza: modo sin cambios y aplicación sobre metadatos ficticios de pruebas
  vencidos hace más de 30 días, con auditoría transaccional. En desarrollo se
  ejecutó únicamente revisión: **cero candidatos y cero eliminaciones**.
  La purga de prueba no afecta empresas, acuerdos ni auditoría.
- Tras añadir aserciones de tendencia diaria se repitió la suite focalizada:
  **18/18 aprobadas**. Campos de tendencia contrastados con cantidad y masa del
  aprovechamiento persistido; no se añadieron conversiones ambientales.
  La última repetición focalizada también pasó 18/18 tras verificar permiso
  antes de consultar cuentas de recuperación y permitir reportes públicos de
  cualquier usuario autenticado, sin dar acceso global a acuerdos empresariales.
- `frontend: npm test`: **2/2** de retorno seguro; rutas nuevas incluidas.
  `npm run build`: correcto, 86 módulos. OpenAPI **0.5.0** validado con
  swagger-cli 4.0.4; esquemas decimales contrastados con punto válido/coma inválida.
- `npm audit --omit=dev` en ambas aplicaciones: **cero vulnerabilidades reportadas**.
  No se instalaron dependencias nuevas de aplicación para operación/gobernanza;
  formato y validador se ejecutaron como herramientas temporales.
- Pantallas integradas: solicitudes/nueva/detalle, acuerdo/entregas, indicadores,
  avisos, casos, derechos, recuperación y plataforma. Inicio y recursos de marca
  conservados; no se copió código del prototipo ni se añadieron controles demo.
- Contrato y guías: `docs/api/operaciones.json`, OpenAPI raíz, README,
  `docs/api/pruebas-manuales-operacion.md`, DER y trazabilidad local.
- Limitación: host CUA de navegador no disponible en el intento de esta tarea.
  No se obtuvieron capturas ni se verificaron teclado/responsive o recorridos
  visuales de las nuevas pantallas. No extender validaciones manuales anteriores.

Pendientes que no se cierran con esta evidencia:

- [ ] Revisión manual nueva, teclado, responsive y ajustes visuales.
- [ ] Ejecución integral de RF-22, exportación exhaustiva y tratamiento de respaldos:
  requiere responsable, excepciones y conservación compartida validados.
- [ ] Proveedor/correo productivo, IA/modelo, documentos/RAG/Drive y tres workflows n8n.
- [ ] Eventual CRM externo identificado y autorizado; el taller no fija proveedor.
- [ ] Ensayo de PostgreSQL, respaldo/restauración, comparación de datos y regresión.
- [ ] Configuración productiva, proyectos/accesos, regiones, almacenamiento privado,
  comparación/costos y despliegue Render/Vercel/Supabase. No se publicó el sistema.
## Evidencia de mensajería y experiencia — 2026-11-27

ADR 0014 y revisión en `docs/gobernanza/revision-experiencia-2026-11-27.md`.

- [x] Bandeja y chat propios ligados a solicitud/acuerdo, con mensajes previos conservados.
- [x] Cursores, orden cronológico, actualización periódica y envío idempotente por autor.
- [x] Permisos vigentes, pertenencia, auditoría y avisos transaccionales preservados.
- [x] Menú privado común, botones, foco y estados legibles implementados.
- [x] Reintento de avisos, consultas propias solo para intercambio y confirmaciones por etapa.
- [x] Fallo de conexión SQL 503 comprensible sin detalles internos.
- [x] Contrato OpenAPI 0.6.0 validado y guía manual actualizada.
- [x] Recorrido de los 12 pasos de revisión: validación manual reportada por el responsable el 2026-11-27 («sí, todo funciona bien»); incluye chat entre empresas, actualización, persistencia, borrador, enlaces, botones, confirmaciones y avisos.
- [x] Teclado y responsive 360/768/1440 px de ese recorrido: validación manual reportada por el responsable; no automatizada ni observada por el agente.
- [x] Navegación privada del recorrido informado: perfil, ofertas, necesidades, solicitudes, mensajes y avisos; validación manual reportada.
- [ ] Lector de pantalla, historial largo, desconexión/reintento de envío y comprobaciones manuales específicas de otros roles/pantallas no incluidas en los 12 pasos.
- [ ] Confirmación específica de la prueba opcional con una tercera empresa; no se presume disponibilidad de esa cuenta a partir del reporte general. El aislamiento sí tiene evidencia automatizada previa.
- [ ] Ajustes visuales y comparación; pendientes previos de portada/marca conservados.

Pruebas ejecutadas: `backend: npm run test:mysql`, **70/70 aprobadas**, cero
fallos/omisiones, exclusivamente `nuevo_origen_test`; focalizada de operación,
**19/19**. Incluye aislamiento, autor/campos prohibidos, CSRF, claves repetidas y
conflictivas, doble envío concurrente 200/201 con un mensaje, cursores sobre
53 registros, retirada de función en sesión abierta y rollback por auditoría.
`unavailable.test.js` comprueba 503 sin datos internos; no se detuvo MySQL para ello.

Frontend: **4/4** pruebas de fusión con IDs grandes, deduplicación y retorno seguro;
compilación correcta, **93 módulos**. OpenAPI validado con swagger-cli 4.0.4.
Contraste calculado de cuatro pares principales: 9,17:1; 8,40:1; 7,55:1; 8,85:1.
No acredita contraste exhaustivo ni conformidad WCAG.

Migración `20261127000100-mensajeria-idempotente.js` aplicada en desarrollo y
pruebas: columna nullable clave_cliente, índice único autor/clave e índice
solicitud/id. Sin traslado/borrado de mensajes, reset ni modificación de MySQL80.
Backend anterior verificado y reiniciado solo ese proceso en 3001, con
`npm run dev`; ruta nueva 401 sin sesión, proxy/disponibilidad MySQL 200.

Navegador CUA bloqueado al iniciar helper por acceso denegado: sin capturas ni
recorrido visual nuevo. La revisión manual anterior no se extiende a esta versión.
Sin dependencias nuevas de aplicación, código del prototipo, push ni despliegue.
Límites: consulta cada 15 segundos con pestaña visible, sin presencia/lectura
simuladas ni adjuntos; borrador en memoria, sin garantía tras recargar/cerrar.

### Validación manual reportada — 2026-11-27

Tras recibir la lista de 12 pasos, el responsable respondió «sí, todo funciona
bien». Se registra como su confirmación del recorrido descrito, incluido teclado
y los tres anchos indicados. No es una ejecución automatizada, observación
independiente del agente ni comparación de capturas. Los casos opcionales o no
incluidos explícitamente no se dan por probados. Ajustes visuales pendientes
conservados. En este registro solo se modificó TASKS.md, sin tocar código.
