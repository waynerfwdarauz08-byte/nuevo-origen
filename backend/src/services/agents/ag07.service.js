const { period } = require("../../schemas/operations");
const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
module.exports = async (m, { materials, operations, source }, auth, input) => {
  let sources = [],
    extra = {};

  const parsed = period.safeParse({ desde: input.desde, hasta: input.hasta });
  if (!parsed.success)
    fail(400, "AI_PERIOD_INVALID", "Indicá un periodo válido (desde y hasta).");
  let data;
  if (auth.company) {
    data = await require("../metrics.service")
      .createMetricsService(m)
      .indicators(auth, parsed.data);
  } else {
    if (!auth.permissions.includes("ag07.global"))
      fail(403, "AI_FORBIDDEN", "Tu función no permite agregados globales.");
    const start = new Date(parsed.data.desde + "T06:00:00Z"),
      end = new Date(parsed.data.hasta + "T06:00:00Z");
    end.setUTCDate(end.getUTCDate() + 1);
    const [rows] = await m.sequelize.query(
      "SELECT u.codigo AS unidad, SUM(el.cantidad) AS cantidad, SUM(CASE WHEN el.metodo_masa='medido' THEN el.masa_kg ELSE 0 END) AS masa_medida_kg, SUM(CASE WHEN el.metodo_masa='estimado' THEN el.masa_kg ELSE 0 END) AS masa_estimada_kg FROM entrega_lineas el JOIN entregas e ON e.id=el.entrega_id JOIN acuerdo_lineas al ON al.id=el.acuerdo_linea_id JOIN unidades u ON u.id=al.unidad_id WHERE e.estado = :estado AND e.fecha >= :start AND e.fecha < :end GROUP BY u.codigo ORDER BY u.codigo",
      { replacements: { estado: "aprovechamiento_confirmado", start, end } },
    );
    data = {
      periodo: parsed.data,
      alcance: "agregados_globales_sin_empresas",
      grupos: rows,
    };
  }
  sources = [
    source(
      "indicadores",
      "Indicadores SQL del periodo",
      "/mi-espacio/ia",
      data,
    ),
  ];
  extra = { indicadores: data };

  return { sources, extra };
};
