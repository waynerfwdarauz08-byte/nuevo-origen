# ADR 0009 — Materiales, catálogo y fotografías locales

Fecha: 2026-11-26
Estado: ALCANCE AUTORIZADO por instrucción del responsable; implementación sujeta a evidencia

Continúa RF-05 a RF-08, sobre ADR 0005–0008. Se conservan diseño, identidad,
JavaScript/JSX, cuentas y datos existentes. Construcción técnica desde cero con
el prototipo de AI Studio como referencia visual; sin reutilización de su código.

- Categorías, unidades, propiedades y categoría/propiedad administrables solo
  por administrador de plataforma con `categorias.gestionar`. Sin alta pública
  de ese rol. Bootstrap local interactivo y explícito; sin cuenta global demo.
- Catálogo inicial reproducible: ocho categorías orientativas, unidades y
  dimensiones opcionales. No hay límite fijo de categorías ni ofertas ficticias.
- Ofertas y necesidades pertenecen a la empresa de sesión. Lectura privada con
  `materiales.leer`; mutaciones con `materiales.gestionar`. Actor y empresa se
  revalidan bajo bloqueo transaccional; se auditan cambios.
- Ofertas: borrador → publicada ↔ pausada → archivada (también se puede archivar
  un borrador o publicada). Archivada terminal. Agotada se reserva a la etapa de
  cantidades/entregas, no se acepta desde el navegador. Edición de publicada
  debe seguir satisfaciendo todas las reglas de publicación. Acumuladores de
  reserva/entrega no son editables y la disponibilidad se calcula en decimal exacto.
- Publicar exige ficha, cantidad positiva, propiedades requeridas, al menos una
  fotografía y declaración expresa de material aprovechable y no peligroso.
  La declaración no es certificación. Composición desconocida se indica como tal.
- Propiedades numéricas exactas y propiedades de texto, con unidad de medida
  cuando corresponda. Tipo y unidad de una definición son inmutables; se crea otra
  definición si cambia su significado. Desconocidos opcionales se omiten. Las
  propiedades requeridas deben completarse para publicar/activar. Cambios en la
  plantilla se aplican a nuevas publicaciones y próximas ediciones, sin reescribir
  las fichas históricas existentes silenciosamente.
- Necesidades: borrador, activa, pausada, cerrada y archivada. Son privadas de la
  empresa en esta etapa; RF-08 publica ofertas. La visibilidad externa de necesidades
  y coincidencias se resolverá al implementar esos recorridos, sin exponerlas ahora.
- Público: solo ofertas publicadas con disponibilidad positiva y empresa activa,
  datos técnicos, fotografías normalizadas y perfil empresarial reducido (nombre,
  sector, descripción y ubicación aproximada). Nunca contactos internos, autor,
  dirección privada, borradores, necesidades ni rutas físicas de almacenamiento.
- Filtros paginados por texto, categoría, ubicación aproximada, modalidad, estado
  material, frecuencia y cantidad mínima vinculada obligatoriamente a una unidad.
  No hay conversiones implícitas ni suma de magnitudes incompatibles.
- Fotografías locales: JPEG/PNG/WebP, máximo 5 MiB por archivo y 16 megapíxeles,
  seis por oferta. Verificación por firma y decodificación; rechazo de SVG,
  animación y contenido falso. Reencodificación WebP hasta 1600 px sin EXIF.
  Nombre aleatorio, hash y tamaño en MySQL; originales no se conservan.
  Almacenamiento ignorado `.local/uploads` o `.local/test-uploads` según entorno.
  Descarga pública verifica publicación; borradores y pausadas exigen sesión y
  pertenencia. No hay directorio estático abierto ni integración de proveedor.
  Solo se pueden retirar fotos de borradores/pausadas; el registro se conserva
  privado como retirado y no se sirve, evitando purgas de evidencia en esta etapa.
- Catálogos se desactivan, no se borran. Desactivar impide usos nuevos, conserva
  relaciones existentes y no convierte automáticamente publicaciones en privadas.
- Inicio conserva composición y ejemplos editoriales identificados; búsqueda y
  acciones conectan al catálogo real. No se presentan imágenes ilustrativas como
  ofertas persistidas. Solicitar material informa pendiente y no crea solicitudes.

No incluye solicitudes, reservas, acuerdos, métricas, IA, correo, Drive, n8n ni
despliegue. Proveedores y alojamiento no se eligen. Fuera de desarrollo/pruebas
se mantiene el bloqueo de producción. Migración aditiva; no ejecutar undo sobre
datos reales sin respaldo y autorización. Los archivos locales requieren respaldo
junto con MySQL; la restauración y limpieza de archivos retirados quedan pendientes.

Referencias: [Multer](https://expressjs.com/en/resources/middleware/multer/),
[Sharp: límites](https://sharp.pixelplumbing.com/api-constructor/) y
[Sharp: salida sin metadatos por defecto](https://sharp.pixelplumbing.com/api-output/).
