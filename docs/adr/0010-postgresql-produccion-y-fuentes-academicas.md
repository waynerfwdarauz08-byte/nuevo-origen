# ADR 0010 — PostgreSQL objetivo y fuentes académicas verificadas

Fecha: 2026-11-26
Estado: DECISIÓN AUTORIZADA; migración y despliegue pendientes de evidencia

El responsable solicita Render, Vercel y Supabase y autoriza PostgreSQL si la
consigna lo permite. `Proyecto_Final_FullStack_FWD (1).pdf` en Descargas,
página física 6, sección 3, acepta explícitamente PostgreSQL además de MySQL.
Por tanto la condición se satisface. No se modifica el PDF histórico.

PostgreSQL en Supabase es el objetivo de producción, Express en Render y React
en Vercel. Sustituye la exclusividad de MySQL como destino final en ADR 0004/0005,
sin reescribir ADR aceptados. MySQL local y sus datos se conservan hasta verificar
una migración separada hacia base nueva: conteos, relaciones, CHECK, decimales,
fechas, concurrencia, pruebas PostgreSQL exclusivas, respaldo y reversión.
La construcción local continúa sobre el entorno verificado; no afirmar conexión
a Supabase ni despliegue antes de disponer de configuración y evidencia.

`Plan_de_Produccion_FWD.pdf` (Descargas, páginas físicas 2–5) exige URL pública,
comparación de alternativas, costos, seguridad, respaldos, reversión y pruebas
públicas; no impone estos tres proveedores, elegidos por el responsable.
Regiones, tratamiento de datos y límites se verificarán antes de conectar.

`Taller CRM y plataforma de FWD (1).pdf` (Descargas, páginas físicas 23–26)
es un taller/miniproyecto de admisiones, no una orden de conectar un CRM comercial.
Se aplica su patrón de etapas, historial, atención y métricas al flujo de Nuevo
Origen. No se añaden admisiones, personas de FWD ni nueve etapas ajenas al dominio.
Un CRM externo posterior requiere proveedor/contrato explícitos.

La consigna confirma ramas/PR, ocho agentes, tres workflows, APIs reales y
gobernanza. IA, RAG/Drive y otras conexiones se difieren por instrucción actual;
no se simulan como realizadas. Los PDF consultados no se copian al Git público.

Referencias oficiales: [Supabase](https://supabase.com/docs/guides/database/overview),
[Render/discos](https://render.com/docs/disks),
[Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite).
