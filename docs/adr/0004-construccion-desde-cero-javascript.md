# ADR 0004 — Construcción desde cero con JavaScript/JSX

Fecha: 2026-11-24
Estado: ACEPTADO POR INSTRUCCIÓN DEL RESPONSABLE
Responsable de decisión: responsable del proyecto

## Contexto

La documentación inicial planteaba transformar un prototipo de Google AI Studio
y evaluar conservar TypeScript. El responsable aclaró explícitamente que desea
construir la aplicación desde cero y utilizar JavaScript/JSX.

## Decisión

- Frontend nuevo: React + Vite + JavaScript/JSX + React Router.
- Backend nuevo: Node.js + Express en JavaScript.
- Persistencia: MySQL + Sequelize, con migraciones y seeders reproducibles.
- Respetar la estructura documentada en AGENTS.md.
- No trasladar, reutilizar ni adaptar código, configuración ni dependencias del prototipo.
- El prototipo es referencia opcional exclusivamente visual y de recorridos.
  Su ausencia no bloquea el trabajo.
- Usar el anteproyecto para requisitos, roles, reglas, entidades, relaciones,
  agentes e integraciones; el libro de marca para identidad visual; y los
  documentos de gobernanza, ADR, políticas y planificación para sus ámbitos.
- Integrar IA desde backend; proveedor y modelo siguen pendientes de elección.

## Consecuencias

No hay migración TSX a JSX ni traslado de componentes. Los componentes y servicios
se escribirán desde cero. La decisión de lenguaje queda resuelta por instrucción
del responsable, sin afirmar una validación independiente de la consigna académica.
No se modifican requisitos funcionales, decisiones de marca ni estados de
implementación por esta decisión documental.

Esta decisión reemplaza el enfoque anterior de transformación del prototipo y
la evaluación pendiente de TypeScript en la planificación. No sustituye ni acepta
los ADR 0001, 0002 o 0003, que mantienen sus estados y pendientes.

## Alcance de la autorización actual

Actualizar únicamente documentación. No instalar dependencias ni implementar
la aplicación en esta tarea. La primera etapa de construcción queda descrita
en PLAN.md y pendiente en TASKS.md.

## Evidencia y aceptación

Aceptado por: responsable del proyecto mediante instrucción explícita en esta conversación.
Fecha: 2026-11-24.
Evidencia: mensaje «ACLARACIÓN DEL ENFOQUE DE NUEVO ORIGEN».
La aceptación acredita la decisión, no la implementación ni pruebas de aplicación.
