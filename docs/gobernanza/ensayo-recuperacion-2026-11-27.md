# Ensayo local de respaldo y PostgreSQL — 2026-11-27

## Alcance observado

MySQL aislado en 3307 continúa activo. No se cambió `.env`, MySQL80, datos
originales ni frontend. PostgreSQL 17.12 funciona en 127.0.0.1:5433 con binarios
locales, sin servicio Windows. Desarrollo y pruebas tienen usuarios/bases
separados. Credenciales y datos están en `.local/`, excluido de Git.
No hay conexión a Supabase ni despliegue.

Se preservaron las siete migraciones MySQL. La baseline PostgreSQL reproduce
su esquema con adaptación explícita de tipos/identificadores en una transacción.
No usa `sync`, `force` ni `alter` de modelos.

## Evidencia ejecutada

- Regresión MySQL inicial: 70/70; PostgreSQL real: 70/70. Incluye concurrencia,
  aislamiento, último administrador, cantidades, reservas, chat y permisos.
- Regresión MySQL tras añadir respaldo/adaptador Groq: **77/77**, sin omisiones.
- Regresión PostgreSQL actualizada: **77/77**, sin fallos u omisiones.
- Respaldo AES-256-GCM: 36 tablas, 248 filas y un archivo referenciado.
- Restauración en base nueva `nuevo_origen_restore_728417dac419`: conteos y
  huellas normalizadas de las 36 tablas coinciden; archivo verificado por SHA-256.
  Duración observada: 3,682 segundos.
- Copia en desarrollo PostgreSQL aislado: mismos conteos/huellas y archivo;
  0,565 segundos. Comparación anterior a revocar sesiones, tokens no usados e
  invitaciones pendientes **solo en la copia**, evitando reactivar esos accesos.
- Archivos restaurados en carpetas nuevas de `.local/restored-files/`;
  no sustituyen archivos activos. Reportes sin datos personales en
  `.local/recovery-reports/`. No se imprimieron datos del respaldo.
- Pruebas focalizadas nuevas: 7/7 (cuatro de Groq y tres de respaldo).
  Incluyen manipulación del cifrado, rutas no permitidas y destino ocupado.
  Groq usa transporte simulado exclusivamente de prueba: no acredita IA real.

## Procedimiento local

Desde `backend/`, `npm run recovery:backup` imprime la ruta del archivo cifrado.
Usar esa ruta, relativa a la raíz del proyecto, en:

```powershell
npm run recovery:restore-mysql -- ".local/backups/NOMBRE-DEL-RESPALDO.enc"
```

Siempre crea una base nueva. Nunca restaura sobre el origen.
`npm run recovery:copy-postgres -- "..."` exige baseline aplicada y tablas de
destino vacías: la copia actual ya contiene datos y una segunda importación
será rechazada. No vaciarla para eludir ese control.

`npm run postgres:resume` y `npm run postgres:stop` controlan solo esta instancia.
`npm run test:postgres` usa exclusivamente la base de pruebas PostgreSQL.
Los binarios oficiales y checksum verificado se conservan localmente; en otra
máquina hay que provisionarlos antes de `postgres:setup`.

## Límites y pendientes

Límite: 256 MiB de JSON en memoria. Conservar la clave de cifrado aparte del
respaldo: perderla impide recuperarlo. Tener ambos en el mismo equipo no protege
contra su pérdida. No se configuró programación diaria, custodia externa,
rotación, retención ni alertas. Estos tiempos no acreditan RPO/RTO productivos.

No hubo cambio del motor activo. Para el corte real: detener escrituras,
respaldar de nuevo, importar en destino nuevo, comparar, asociar almacenamiento
privado y verificar permisos/archivos/acceso. El retorno a MySQL es directo
solo mientras PostgreSQL no reciba nuevas escrituras; después exige conciliación.

Pendientes: diferencias de collation/ordenación y unicidad, ensayo Supabase
con TLS/permisos reales, respaldo nativo PostgreSQL, tratamiento de supresiones
en restauraciones y prueba del corte completo. RF-22 y producción siguen abiertos.
