# Preparación de producción — estado y condiciones

2026-11-26. Documento de preparación; no acredita despliegue ni migración.

## Decisión y fuentes

El responsable eligió frontend en Vercel, backend en Render y PostgreSQL en
Supabase si la consigna lo permite. La consigna original
`Proyecto_Final_FullStack_FWD (1).pdf`, página física 6 (impresa 5), acepta
PostgreSQL como alternativa SQL. ADR 0010 registra la autorización condicionada
ya conciliada. No hace falta volver a decidir el motor.

El anteproyecto, sección 18.3, caracteriza el taller de CRM como seguimiento por
etapas y medición. El taller, páginas físicas 23–26, propone otro ejercicio:
admisiones con nueve etapas. No exige un proveedor externo para Nuevo Origen.
Se implementó seguimiento local de solicitudes/acuerdos; conectar otro CRM
requiere identificar sistema, finalidad, campos y permisos. No copiar datos ni
etapas de admisiones al dominio B2B.

## Estado observado

- Desarrollo y pruebas siguen en MySQL aislado 3307, bases separadas.
- No hay controlador PostgreSQL, migraciones PostgreSQL verificadas ni cambio
  de configuración de base en ejecución. No se han transferido datos.
- No se encontraron `psql`, `pg_dump` ni Docker en PATH durante la inspección.
- La configuración actual rechaza producción y bases remotas deliberadamente.
- Archivos privados locales y evidencias se guardan en `.local/`, ignorado por Git.
- No se han creado recursos ni publicado la aplicación en los tres proveedores.

## Migración necesaria antes del despliegue

1. Crear un entorno PostgreSQL exclusivo de ensayo, separado de producción.
2. Generar y verificar respaldo de MySQL y archivos; conservar la base original.
3. Crear un baseline PostgreSQL independiente, sin reescribir las migraciones
   MySQL aplicadas ni ejecutar `sync(force)` o `alter` automático.
4. Revisar BIGINT sin unsigned, límites de IDs, DECIMAL exactos, JSON/JSONB,
   checks, FK, unicidad, índices, fechas UTC, booleanos y orden de bloqueos.
   Comprobar equivalencia de correos normalizados y su unicidad: las
   comparaciones de texto MySQL y PostgreSQL pueden diferir.
5. Importar en una base nueva conservando IDs y relaciones; ajustar secuencias.
   Revocar sesiones y enlaces de acción durante el cambio de entorno; no
   trasladar credenciales de desarrollo como secretos productivos.
6. Comparar conteos, cantidades/reservas/entregas, referencias, hashes de archivos
   y huellas de datos autorizados, sin imprimir datos personales o secretos.
7. Ejecutar toda la suite adaptada contra PostgreSQL exclusivo de pruebas,
   incluidas carreras, rollback, aislamiento, decimales, CSRF e idempotencia.
8. Ensayar restauración y reversión a MySQL antes de decidir el cambio real.
   Documentar ventana de corte y evitar escrituras en ambos motores a la vez.

## Configuración que habrá que implementar y comprobar

- Driver `pg` y dialecto/configuración de Sequelize; TLS verificado para conexión
  remota. Revisar conexión directa/pooler y compatibilidad de migraciones.
- Backend con puerto del proveedor y escucha apropiada, cookies Secure/HttpOnly,
  secreto JWT nuevo, origen exacto, proxy confiable y protección CSRF.
- Frontend compilado, recarga de rutas SPA y proxy `/api` al backend. Verificar
  cookies en el dominio público real; no asumir que servirán cookies entre sitios.
- Persistencia de imágenes y evidencia: elegir y autorizar disco persistente o
  almacenamiento privado. El directorio efímero de una instancia no basta.
- Límites de intentos persistentes/compartidos según número de instancias;
  no presentar el almacén local en memoria como control distribuido.
- Migraciones previas al arranque, salud de proceso y disponibilidad separadas,
  logs depurados, alertas y procedimiento de recuperación.
- Ejemplos con nombres de variables, nunca valores reales ni claves `VITE_*`.

## Condiciones pendientes para publicar

- Proyectos/cuenta de destino y accesos autorizados en Render, Vercel y Supabase.
- Regiones, tratamiento de datos, presupuesto y comparación de al menos dos
  alternativas por componente, requerida por el Plan de Producción académico.
  Consultar precios y condiciones vigentes al preparar esa entrega.
- Políticas definitivas, responsable/canal de privacidad, plazos y excepciones de
  conservación; procedimiento de bajas y tratamiento de respaldos.
- Almacenamiento privado, respaldo y restauración comprobados.
- Pruebas PostgreSQL, recorridos locales nuevos y pruebas de la URL pública.

La elección de proveedores no sustituye estas verificaciones. IA/modelo,
correo, Drive/RAG, n8n y cualquier CRM externo se conectan al final, después de
cerrar proveedor, finalidad, permisos, datos y configuración de cada integración.

## Referencias técnicas consultadas

[Supabase: base PostgreSQL](https://supabase.com/docs/guides/database/overview),
[Render: persistencia de archivos](https://render.com/docs/disks) y
[Vercel: reescrituras de rutas](https://vercel.com/docs/routing/rewrites).
Son referencias para preparar y comprobar la configuración; no acreditan que
los proyectos de esta aplicación estén creados o conectados.
