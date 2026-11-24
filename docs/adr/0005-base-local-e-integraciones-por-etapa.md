# ADR 0005 — Base local e integraciones por etapa

Fecha: 2026-11-24
Estado: ACEPTADO POR INSTRUCCIÓN DEL RESPONSABLE

## Contexto y conciliación

El anteproyecto v1.2, sección 8 (p. 22), exige registrar proveedor y modelo
antes del desarrollo; la sección 18.4 (p. 54) también anticipa decisiones de
alojamiento e implementación. El responsable autoriza expresamente iniciar
la base técnica local sin esas integraciones. Esta decisión precisa la secuencia,
sin eliminar requisitos funcionales ni elegir proveedores por suposición.

Las consignas académicas originales citadas en la sección 18.3 no están
adjuntas en docs/referencias/. No se afirma haber verificado sus exigencias.
Si se aporta una consigna con condiciones previas más estrictas, identificar
el requisito concreto y conciliarlo con el responsable antes de apartarse de él.

## Decisión y alcance autorizado

Construir desde cero React + Vite + JavaScript/JSX + React Router, Express
y MySQL + Sequelize. Se autorizan estructura, página inicial, navegación,
configuración, endpoints de salud, migraciones y persistencia inicial de
roles y permisos, instalación de dependencias y verificaciones locales necesarias.
No se autorizan integraciones de proveedores externos ni publicación.

La base local puede comenzar. Antes de cada integración deben cerrarse su
proveedor/modelo cuando corresponda, tratamiento y ubicación de datos,
permisos, credenciales y configuración, con evidencia y decisión documentada.
El alojamiento productivo se decidirá antes del despliegue, que requiere
autorización. Desarrollo y pruebas usarán bases separadas, datos ficticios
y configuración independiente; las pruebas nunca apuntarán a producción.

## Referencia visual vigente

Libro_de_Marca_Nuevo_Origen.pdf v1.0 es la referencia visual vigente.
Las menciones del anteproyecto a logo y tipografías pendientes en portada,
secciones 17.5 y 18.2–18.4 están desactualizadas respecto al manual entregado.
No se altera el PDF histórico ni se cambian colores, tipografías o logo.
Los recursos maestros separados siguen sujetos a disponibilidad; no recrear el logo.

## Relación con decisiones anteriores

Se conserva ADR 0004 íntegro: su restricción a documentación correspondía
a la tarea anterior. Este nuevo ADR amplía la autorización a construcción local.
No se reescriben ni se aceptan retroactivamente ADR 0001–0003. Sus decisiones
pendientes siguen siendo necesarias en la etapa de integración correspondiente.

## Evidencia y consecuencias

Aceptado por el responsable mediante el mensaje «Antes de programar, realiza
una última conciliación documental» del 2026-11-24. Documentar una medida no
acredita implementación. TASKS.md registrará resultados y limitaciones reales.
