# ADR 0011 — Operación empresarial y seguimiento local

Fecha: 2026-11-26
Estado: ALCANCE AUTORIZADO; controles sujetos a pruebas

RF-10 a RF-14 y seguimiento del proceso antes de conexiones externas. Conservar
datos, estructura y diseño. Validación manual anterior no cubre pantallas nuevas.

- Solicitud enviada no reserva. Propuesta versionada con emisor, condiciones,
  cantidades y fichas/precios/unidades históricos. Solo la contraparte acepta
  la versión revisada. Una modificación invalida la versión anterior.
- Aceptar crea acuerdo y reserva todas las líneas atómicamente. Intercambio
  requiere oferta propia publicada y reserva bilateral. Bloquear empresas por
  ID y luego solicitud/acuerdo/ofertas por ID; revalidar permisos bajo transacción.
- Unidad de oferta con reserva/entrega inmutable. Cancelar libera solo reserva
  restante; no borra entregas. Con entrega pendiente/disputada resolver primero.
- Entregas parciales idempotentes por acuerdo y huella de entrada. Repetición
  equivalente devuelve recurso existente; distinta entrada con igual clave falla.
- Recepción conforme de ambas partes mueve reservado a entregado una sola vez.
  Discrepancia conserva reserva/evidencia y abre incidencia, sin sumar impacto.
- Aprovechamiento requiere recepción y confirmación de ambas empresas; en una
  dirección declara uso primero el receptor. No utilizado permanece entregado;
  su declaración puede actualizarse posteriormente con auditoría.
- Masa medida separada de estimada. Estimada exige factor kg/unidad y fuente;
  cálculo exacto con redondeo a 0,001 kg. No inferir masa de piezas ni CO2.
- Evidencias fotográficas privadas y autorizadas, con validación existente.
- Indicadores SQL por unidad y dirección; solo uso confirmado. No sumar ofrecido
  y recibido como si fueran cantidades diferentes del mismo intercambio.
- Seguimiento por etapas y atención pendiente aplica patrón CRM del taller;
  fórmulas explícitas, sin proveedores ni IA simulada.
- Mensajes solo para participantes con acuerdos.gestionar. Analistas/materiales
  no heredan conversaciones. Avisos de interfaz son eventos reales en la
  transacción, sin afirmar envío de correo. Historial no editable desde cliente.
