# ADR 0003 — Dónde viven los datos

Fecha: 2026-11-24
Estado: PROPUESTO

## Contexto

El prototipo guarda datos en memoria.
El sistema real necesita persistencia, aislamiento empresarial,
documentos privados y una política reproducible de eliminación.

## Decisión propuesta

- MySQL será la fuente de verdad de datos estructurados.
- Sequelize gestionará modelos y migraciones.
- Los documentos vivirán en almacenamiento privado.
- El índice RAG contendrá fragmentos y referencias autorizadas.
- Las credenciales vivirán en configuración segura del servidor.
- El navegador no será la fuente de verdad.

## Ubicaciones

| Componente | Decisión |
|---|---|
| MySQL de desarrollo | Local o remoto exclusivo de desarrollo |
| MySQL de producción | Proveedor y región pendientes |
| Archivos privados | Servicio y región pendientes |
| Índice RAG | Tecnología y ubicación pendientes |
| Proveedor de IA | ADR 0001 |
| Copias de respaldo | Destino y responsable pendientes |
| Google Drive | Carpetas autorizadas explícitamente |
| n8n | Instancia y alojamiento pendientes |

No afirmar que datos permanecen en Costa Rica sin verificarlo.

## Aislamiento empresarial

- Resolver empresa desde la sesión.
- Filtrar cada recurso privado por su pertenencia.
- Revalidar permisos en documentos e índice.
- Proteger referencias indirectas y descargas.
- No confiar en un company_id suministrado por el navegador.

## Acceso público

Solo publicar campos expresamente definidos como públicos:
materiales autorizados, información empresarial pública
y ubicación aproximada según el anteproyecto.

Contactos privados, documentos y conversaciones no se vuelven
públicos por pertenecer a una empresa con perfil público.

## Entornos

Separar desarrollo, pruebas y producción.
Usar datos ficticios fuera de producción.
Las pruebas no pueden limpiar ni modificar producción.

## Conservación

Aplicar los plazos propuestos en:
docs/politicas/conservacion-y-eliminacion.md.

Los plazos pendientes de validación no se presentan
como obligaciones legales confirmadas.

## Eliminación

La baja debe contemplar:
- Base relacional.
- Archivos.
- Índice.
- Cachés.
- Sesiones.
- Integraciones.
- Respaldos y restauraciones.

No borrar registros empresariales compartidos sin evaluar
acuerdos, terceros y necesidad de anonimización.

## Respaldos

Propuesta del anteproyecto:
- Siete copias diarias.
- Cuatro copias semanales.

Validar costos, cifrado, acceso y restauración.
Reaplicar supresiones al restaurar una copia.

## Criterios para aceptar

- Elegir servicios y regiones.
- Documentar quién administra cada componente.
- Verificar acceso privado.
- Probar aislamiento entre empresas.
- Probar respaldo y restauración.
- Definir procedimiento de eliminación.

Aceptado por: PENDIENTE.
Fecha: PENDIENTE.