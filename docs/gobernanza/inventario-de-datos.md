# Inventario de datos — Nuevo Origen

Fecha: 2026-11-24
Estado: inventario inicial de diseño
Responsable de revisión: responsable del proyecto

Este documento describe el sistema previsto.
No acredita que sus controles estén implementados.

## Convenciones

- Público: visible sin sesión cuando corresponda.
- Privado: acceso limitado por cuenta, empresa y función.
- Restringido: credenciales, seguridad o información administrativa.
- Toda transferencia externa requiere necesidad y autorización.
- Los plazos se detallan en la política de conservación.

## Inventario

| Grupo | Datos y origen | Finalidad | Acceso | Destino externo | Conservación |
|---|---|---|---|---|---|
| Empresas | Nombre, sector, descripción y ubicación declarados | Identificar organizaciones y operar | Perfil público limitado; resto privado | IA solo si es necesario | Relación activa y resolución de baja |
| Usuarios | Nombre, correo y pertenencia empresarial | Identidad, equipo y comunicación | Titular y administración autorizada | Correo; IA sin identificadores innecesarios | Relación activa y tratamiento de baja |
| Credenciales | Hashes, sesiones y tokens generados | Autenticación y recuperación | Servicios de identidad autorizados | No enviar a IA | Según vencimiento y revocación |
| Roles y permisos | Asignaciones y delegaciones | Autorizar operaciones | Administración autorizada | No necesario por defecto | Vigencia y auditoría mínima |
| Aceptaciones | Usuario, versión de política y fecha | Evidenciar aceptación | Titular y responsables autorizados | No enviar a IA por defecto | Propuesta: 12 meses tras baja, por validar |
| Preferencias opcionales | Consentimientos revocables | Gestionar finalidades opcionales | Titular y servicio correspondiente | Solo destino declarado | Hasta revocación y evidencia mínima |
| Ofertas | Composición, medidas, cantidad, fotos y condiciones | Publicar materiales | Público si están publicadas; borradores privados | IA con campos necesarios | Vigencia y tratamiento posterior |
| Necesidades | Propiedades, cantidad, uso y condiciones | Buscar compatibilidades | Según visibilidad definida | IA autorizada | Vigencia y tratamiento posterior |
| Solicitudes | Partes, material, cantidades y estado | Gestionar interés | Empresas participantes | IA de seguimiento cuando proceda | Relación y resolución de baja |
| Conversaciones | Mensajes y referencias operativas | Coordinar solicitudes y acuerdos | Participantes autorizados | IA con contexto mínimo | Según relación y excepciones justificadas |
| Acuerdos | Condiciones, cantidades y estados | Registrar compromisos | Partes y supervisión autorizada | IA para consulta o borrador | Evaluar obligaciones compartidas |
| Entregas | Cantidades, fechas, evidencias y confirmaciones | Trazabilidad y aprovechamiento | Partes y supervisión autorizada | IA con minimización | Vinculada al acuerdo |
| Discrepancias | Reportes y resoluciones | Corregir conflictos | Partes y moderación autorizada | Solo contexto necesario | Según resolución y necesidad |
| Documentos | Archivos aportados por empresas | Consulta documental | Empresa y funciones autorizadas | Índice y proveedor IA autorizado | Hasta retiro o baja |
| Fragmentos RAG | Texto extraído y referencias | Recuperar evidencia | Mismos permisos del original | Proveedor IA autorizado | Invalidar al retirar original |
| Ejecuciones IA | Agente, estado, consumo y referencias | Calidad, trazabilidad y costos | Usuario y administración según función | Proveedor seleccionado | Metadatos 90 días; muestras depuradas 7 |
| Notificaciones | Destino, tipo, estado y envío | Seguimiento operativo | Destinatario y servicio | Proveedor de correo | Plazo específico pendiente |
| Auditoría | Actor, acción, recurso y fecha | Investigar y verificar operaciones | Responsables autorizados | No por defecto | Plazo específico pendiente |
| Logs técnicos | Errores y metadatos depurados | Diagnóstico y seguridad | Personal técnico autorizado | Servicio elegido, si aplica | 30 días |
| Derechos y bajas | Solicitud, verificación y resolución | Atender al titular | Titular y responsables | Solo si es necesario | Propuesta de 12 meses, por validar |
| Respaldos | Copias controladas | Recuperación | Administración técnica | Almacenamiento elegido | 7 diarias y 4 semanales |

## Ubicación

Arquitectura propuesta:
- Estructurados: MySQL.
- Archivos: almacenamiento privado.
- Fragmentos: índice RAG.
- Credenciales: configuración segura.
- Regiones y proveedores: pendientes según ADR 0003.

## Datos no solicitados por diseño

No pedir por defecto:
- Salud.
- Biometría.
- Religión.
- Opiniones políticas.
- Datos financieros personales.
- Documentos de identidad completos sin necesidad justificada.

Si aparecen en archivos o mensajes, no asumir autorización
para divulgarlos, indexarlos o enviarlos a un proveedor de IA.

## Minimización

- Ubicación pública aproximada.
- Contactos privados solo cuando se necesiten.
- No enviar expedientes completos a IA por comodidad.
- No registrar contraseñas, tokens ni cuerpos completos en logs.
- Revisar fotos y documentos por datos personales innecesarios.

## Pendientes

- Confirmar campos exactos con el DER.
- Definir visibilidad de necesidades.
- Precisar conservación de auditoría y notificaciones.
- Elegir proveedores y regiones.
- Definir responsables y contacto.
- Validar finalidades y políticas antes de publicación.

## Implementación local observada — 2026-11-26

- Conversaciones restringidas a empresas participantes con acuerdos.gestionar;
  indicadores y exportaciones empresariales no incluyen sus contenidos.
- Acuerdos conservan condiciones, unidades, precios y fichas aceptadas como
  historial de negocio; no se reescriben por editar una oferta posteriormente.
- Evidencia fotográfica privada ligada a entrega. Descarga por participantes
  autorizados o revisor de caso asignado, con auditoría en este último acceso.
  Sin URLs públicas permanentes ni acceso global ordinario a conversaciones.
- Avisos de interfaz: referencia de evento/ruta y lectura propia; sin correo.
- Solicitudes de derechos: titular, tipo, detalle, verificación y revisión. No se
  ejecuta eliminación ni se promete tratamiento de proveedores no conectados.
- Recuperación: solo hash del token, vencimiento y uso/revocación; enlace manual
  mostrado una vez al administrador de plataforma autorizado en desarrollo.
- Exportación propia actual acotada: perfil, aceptaciones, consentimientos e
  historial de derechos. No se declara exportación exhaustiva de comunicaciones.
- Cuentas globales y versiones de borradores separadas de empresas. Auditoría
  global de referencias; los datos de casos no aparecen en su listado general.
- Esquema actual y campos: `docs/referencias/DER-implementado-local.md`.

Necesidades ya definidas como privadas en ADR 0009. Proveedores externos,
regiones, acceso de responsables, conservación de negocio y resolución integral
de bajas continúan pendientes; los controles locales no cierran esos riesgos.

## Integración IA local — 2026-11-27

Groq recibe pregunta, ficha/contexto autorizado mínimo y fuentes referenciadas,
para generar recomendaciones/borradores. No se envían contraseñas, hashes de
sesión ni claves como parte del contexto de las herramientas. No introducir
secretos en la pregunta. Sin confirmación humana de ZDR se bloquean consultas.

Persistencia: agentes/versiones y ejecuciones del titular, empresa, modelo,
estado, duración, tokens, referencias y hashes de entrada/contexto. Sin prompts
o preguntas completas. Respuesta validada privada para reintentos; listados solo
metadatos propios. Auditoría de referencia, sin contenido completo. Proveedor
y límites: ADR 0015/0017. Costos sin tarifa confirmada quedan nulos.

Plazos/purga y exportación exhaustiva de esta categoría siguen pendientes para
producción; la entrega local no resuelve RF-22. Los respaldos cifrados incluyen
estas tablas. No existe autorización de despliegue o transferencia productiva
por el mero éxito de la prueba técnica.

### Chat Nori — historial privado, ADR 0018

El chat solicitado guarda preguntas en `turnos_ia`, enlazadas con conversación,
titular, empresa y ejecución. Finalidad: recuperar y continuar chats propios.
El endpoint de consultas aisladas conserva el criterio de no persistir preguntas.
Logs y auditoría no reciben el texto. Historial acotado recuperado en backend
se envía a Groq con ZDR confirmado; no constituye fuente nueva de hechos.
Aviso de guardado visible junto al cuadro de mensaje. Sin localStorage.
Plazos/purga, exportación integral y supresiones en respaldos siguen pendientes
antes de producción. Nori no habilita nuevos destinatarios.
