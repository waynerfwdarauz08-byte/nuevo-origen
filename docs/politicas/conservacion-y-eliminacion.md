# Conservación y eliminación — Nuevo Origen

Versión: 0.1
Estado: PROPUESTA OPERATIVA
Fecha: 2026-11-24

## 1. Alcance

Definir conservación y eliminación en base de datos,
archivos, índice RAG, cachés y respaldos.

Estos plazos provienen de la propuesta del anteproyecto.
No se presentan como plazos legales obligatorios.

## 2. Plazos propuestos

| Categoría | Plazo o condición |
|---|---|
| Tokens de invitación y recuperación | Vencimiento de 1 hora |
| Metadatos de invitación y recuperación | Purga en 30 días |
| Logs técnicos depurados | 30 días |
| Metadatos de ejecuciones IA | 90 días |
| Muestras depuradas de diagnóstico IA | Hasta 7 días |
| Documentos privados | Hasta retiro o baja |
| Índice RAG | Invalidación inmediata al retirar el documento |
| Perfiles y comunicaciones | Durante la relación; objetivo de tratamiento de baja verificada en 30 días |
| Aceptaciones e historial de derechos | Propuesta de 12 meses tras baja, sujeta a validación |
| Respaldos | Siete copias diarias y cuatro semanales |
| Auditoría de negocio | Plazo específico pendiente |
| Acuerdos y entregas | Evaluación de necesidades compartidas y base aplicable |
| Notificaciones | Plazo específico pendiente |

El vencimiento de tokens debe combinarse con uso único
y revocación cuando corresponda.

## 3. Solicitud de eliminación

1. Recibir la solicitud.
2. Verificar identidad y facultades.
3. Identificar datos propios, empresariales y de terceros.
4. Revisar acuerdos abiertos y excepciones justificadas.
5. Resolver eliminación, anonimización o conservación restringida.
6. Revocar sesiones y accesos cuando corresponda.
7. Aplicar cambios en base, archivos, índice y cachés.
8. Registrar evidencia mínima.
9. Informar el resultado.

No eliminar automáticamente una empresa por la baja de un miembro.

## 4. Documentos e índice

Retirar un documento debe impedir nuevas recuperaciones.
Revisar:
- Fragmentos.
- Embeddings o representaciones.
- Metadatos.
- Cachés.
- Vínculos de descarga.
- Copias de trabajo de integraciones.

No prometer eliminar datos del proveedor externo sin verificar
su capacidad y condiciones de conservación.

## 5. Respaldos

Los respaldos tendrán acceso restringido.
No se utilizarán para consulta ordinaria.

Mantener un mecanismo mínimo para reaplicar supresiones
si una copia se restaura.

Verificar:
- Cifrado y permisos.
- Rotación.
- Recuperación.
- Tratamiento de solicitudes de eliminación.

## 6. Excepciones

Toda conservación excepcional debe documentar:
- Datos afectados.
- Necesidad.
- Base aplicable validada.
- Responsable.
- Acceso permitido.
- Fecha de revisión.
- Explicación al solicitante cuando corresponda.

No conservar indefinidamente por comodidad técnica.

## 7. Implementación

Crear procesos controlados de limpieza.
Registrar ejecuciones sin exponer datos eliminados.
Probar en entornos separados.
No ejecutar purgas productivas sin procedimiento autorizado.

## 8. Pendientes

- Validación normativa.
- Plazos de auditoría, acuerdos y notificaciones.
- Capacidades de proveedores.
- Responsables.
- Evidencia de eliminación y restauración.