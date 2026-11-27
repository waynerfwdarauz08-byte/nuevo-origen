# Revisión de experiencia y mensajería — 2026-11-27

Alcance autorizado: revisión del proyecto y mejora de mensajería, navegación,
controles y recorridos según anteproyecto. No incorpora integraciones externas,
publicación ni funcionalidades ajenas al dominio B2B.

## Observado

- RF-11 exige conversación privada entre participantes; P-23 agrupa conversación
  e historial. La instrucción actual del responsable separa el chat como módulo,
  conservando el vínculo con solicitud/acuerdo. Conciliación registrada en ADR 0014.
- El formulario de mensajes estaba dentro del detalle de solicitud, con mensajes
  recientes primero y sin bandeja independiente ni actualización periódica.
- Un reintento de envío podía crear otro mensaje: la operación anterior no tenía
  clave idempotente. No había indicadores reales de presencia o lectura.
- El menú privado solo aparecía en la página de perfil. Varias pantallas tenían
  botones nativos, variantes mezcladas y estados con nombres internos.
- Avisos podía mantener un error tras una carga correcta y mostrar "Cargando"
  indefinidamente al fallar. Algunas acciones no indicaban que estaban pendientes.
- Crear una solicitud cargaba ofertas propias incluso en venta/donación; esa
  consulta innecesaria podía bloquear el formulario si fallaba.
- Confirmar entrega ofrecía recepción y uso sin adaptar las opciones a la etapa.
- Un fallo de conexión SQL se mostraba como error interno genérico; esto explica
  la poca claridad del mensaje que reportó el responsable al estar MySQL detenido.

## Mejoras implementadas; ver resultados en TASKS.md

- Mensajería separada: bandeja, contraparte, material, estado y accesos al acuerdo
  y a las condiciones. Mensajes anteriores conservados en las mismas tablas.
- Historial cronológico por cursor, carga de anteriores y consultas de novedades.
  Sin repetir mensajes al combinar respuestas; IDs grandes comparados con BigInt.
- Envío idempotente por autor y clave; rechazo de otra entrada con la misma clave.
  Mismos bloqueos, permisos empresariales, auditoría y avisos transaccionales.
- Actualización cada 15 segundos mientras la pestaña está visible. No reemplaza
  un servicio WebSocket ni informa estados ficticios de "en línea" o "leído".
- Texto no enviado/reintento conservado en memoria al cambiar de conversación
  dentro del módulo. No se promete conservar borradores tras recargar/cerrar.
- Navegación privada común por permisos, selección activa, controles de mínimo
  táctil, foco y estados deshabilitados, tratamiento diferenciado de cancelaciones.
- Estados/funciones legibles, botones claros en solicitudes/materiales y enlaces
  recíprocos entre chat, revisión de condiciones y entregas.
- Avisos con reintento y acción pendiente, consultas de intercambio cuando son
  necesarias y confirmación de entrega adaptada a recepción o aprovechamiento.
- Error de conexión SQL 503 comprensible sin detalles internos, claves ni consultas.
- Portada pública, logo y fuentes conservados. Estilos privados nuevos usan la
  paleta de marca; componentes escritos desde cero, sin código del prototipo.

## Límites y pendientes

- No fue posible abrir el navegador de verificación: el runtime CUA falló al
  iniciar su helper por acceso denegado. No hay capturas ni evidencia visual nueva.
- Pendiente probar 360/768/1440 px, teclado, lector de pantalla y navegadores del
  RNF-22; comprobar foco al navegar, compositor, scroll interno, etiquetas y errores.
- La navegación común cambia el marco de pantallas privadas ya existentes:
  las validaciones manuales previas son históricas y deben repetirse en este marco.
- Pendiente prueba manual de dos empresas, actualización periódica, cambio de
  conversación mientras se escribe, desconexión/reintento y retorno tras login.
- No hay adjuntos de chat, lectura/presencia ni conversaciones generales sin
  solicitud. La evidencia privada de entregas mantiene su módulo y autorización.
- No se completaron auditoría normativa, eliminación efectiva, respaldo/
  restauración, migración PostgreSQL ni pruebas de carga con 100/1.000 ofertas.
- IA, RAG/Drive, correo, n8n y eventual CRM externo siguen pendientes. El
  seguimiento comercial local permanece ligado a solicitudes y acuerdos.

La revisión no se presenta como certificación exhaustiva de todos los RF/RNF.
El corte funcional y las limitaciones previas siguen en la trazabilidad local.
