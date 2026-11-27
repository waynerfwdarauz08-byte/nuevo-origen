const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
module.exports = async (m, { materials, operations, source }, auth, input) => {
  let sources = [],
    extra = {};

  if (!input.solicitud_id)
    fail(400, "AI_CONTEXT_REQUIRED", "Indicá la solicitud que querés revisar.");
  const r = await operations.requestAccess(auth, input.solicitud_id);
  const history = await m.HistorialEstado.findAll({
    where: { solicitud_id: r.id },
    attributes: ["estado_anterior", "estado_nuevo", "fecha"],
    order: [["id", "DESC"]],
    limit: 15,
  });
  sources = [
    source(
      "solicitud:" + r.id,
      "Solicitud " + r.id,
      "/mi-espacio/solicitudes/" + r.id,
      {
        id: String(r.id),
        estado: r.estado,
        cantidad: r.cantidad,
        version: r.version,
        condiciones: r.condiciones_json,
        historial: history.map((r) => r.toJSON()),
      },
    ),
  ];
  const agreement = await m.Acuerdo.findOne({
    where: { solicitud_id: r.id },
    attributes: ["id", "estado", "fecha_prevista", "version_aceptada"],
  });
  if (agreement) {
    const deliveries = await m.Entrega.findAll({
      where: { acuerdo_id: agreement.id },
      attributes: ["id", "estado", "fecha"],
      order: [["id", "DESC"]],
      limit: 20,
    });
    const events = await m.HistorialEstado.findAll({
      where: { acuerdo_id: agreement.id },
      attributes: ["estado_anterior", "estado_nuevo", "fecha"],
      order: [["id", "DESC"]],
      limit: 15,
    });
    sources.push(
      source(
        "acuerdo:" + agreement.id,
        "Acuerdo " + agreement.id,
        "/mi-espacio/acuerdos/" + agreement.id,
        {
          ...agreement.toJSON(),
          entregas: deliveries.map((d) => d.toJSON()),
          historial: events.map((e) => e.toJSON()),
          historial_acotado: true,
        },
      ),
    );
  }

  return { sources, extra };
};
