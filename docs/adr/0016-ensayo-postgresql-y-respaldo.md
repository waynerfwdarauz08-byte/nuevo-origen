# ADR 0016 — Ensayo PostgreSQL y recuperación local

Fecha: 2026-11-27
Estado: IMPLEMENTACIÓN AUTORIZADA; validación pendiente de resultados

ADR 0010 autorizó PostgreSQL/Supabase y la consigna permite SQL relacional.
El responsable solicita completar la implementación. Se prepara PostgreSQL
aislado en loopback, puerto 5433, sin servicios Windows ni uso de MySQL80.

- Mantener MySQL actual y sus credenciales/configuración sin sobrescribirlas.
- Añadir dialecto PostgreSQL explícito y perfiles de desarrollo/pruebas separados.
- Conservar migraciones MySQL aplicadas; baseline PostgreSQL independiente que
  reproduce ese esquema mediante adaptación de tipos/identificadores y CHECK.
- Preservar IDs, DECIMAL, FK, índices, fechas, JSON, cantidades y archivos.
- Respaldo cifrado local, importación solo en bases nuevas exclusivas y comparación
  de conteos/huellas. No cambiar el servicio en ejecución antes del ensayo.
- Verificar reglas con motor real, incluida concurrencia. No sustituir PostgreSQL
  por un mock ni afirmar migración por ejecutar solamente creación de tablas.
- Restauración ensayada y procedimiento de reversión antes del corte real.
- Producción requiere configuración/credenciales, almacenamiento, regiones y
  responsables; no se crean servicios pagos ni proyectos por suposición.
