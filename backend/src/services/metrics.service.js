const { IdentityError } = require("./identity.service");
const { scaled, format } = require("./decimal");
function createMetricsService(m) {
  function permit(auth, exporting = false) {
    if (
      !auth.company ||
      !(exporting
        ? auth.permissions.includes("reportes.exportar")
        : auth.permissions.some((p) =>
            ["reportes.exportar", "indicadores.operativos"].includes(p),
          ))
    )
      throw new IdentityError(
        403,
        "FORBIDDEN",
        "No tenés permiso para consultar estos indicadores.",
      );
  }
  async function indicators(auth, period) {
    permit(auth);
    const start = new Date(period.desde + "T06:00:00Z"),
      end = new Date(period.hasta + "T06:00:00Z");
    end.setUTCDate(end.getUTCDate() + 1);
    const [rows] = await m.sequelize.query(
      `SELECT al.empresa_oferente_id,al.empresa_receptora_id,al.unidad_id,u.codigo,el.cantidad,el.masa_kg,el.metodo_masa,e.fecha,e.id AS entrega_id,a.id AS acuerdo_id FROM entrega_lineas el JOIN entregas e ON e.id=el.entrega_id JOIN acuerdo_lineas al ON al.id=el.acuerdo_linea_id JOIN acuerdos a ON a.id=al.acuerdo_id JOIN unidades u ON u.id=al.unidad_id WHERE e.estado=:estado AND e.fecha >= :start AND e.fecha < :end AND (al.empresa_oferente_id=:empresa OR al.empresa_receptora_id=:empresa)`,
      {
        replacements: {
          estado: "aprovechamiento_confirmado",
          start,
          end,
          empresa: auth.company.id,
        },
      },
    );
    const groups = new Map(),
      daily = new Map(),
      deliveries = new Set(),
      agreements = new Set();
    for (const r of rows) {
      const direction =
          String(r.empresa_oferente_id) === String(auth.company.id)
            ? "ofrecido"
            : "recibido",
        key = direction + ":" + r.unidad_id,
        item = groups.get(key) || {
          direccion: direction,
          unidad_id: String(r.unidad_id),
          unidad: r.codigo,
          cantidad: 0n,
          masa_medida_kg: 0n,
          masa_estimada_kg: 0n,
          lineas_sin_masa: 0,
        };
      item.cantidad += scaled(r.cantidad);
      if (r.metodo_masa === "medido") item.masa_medida_kg += scaled(r.masa_kg);
      else if (r.metodo_masa === "estimado")
        item.masa_estimada_kg += scaled(r.masa_kg);
      else item.lineas_sin_masa++;
      groups.set(key, item);
      const day = new Date(new Date(r.fecha).getTime() - 6 * 3600000)
          .toISOString()
          .slice(0, 10),
        dailyKey = day + ":" + key;
      const point = daily.get(dailyKey) || {
        fecha: day,
        direccion: direction,
        unidad_id: String(r.unidad_id),
        unidad: r.codigo,
        cantidad: 0n,
        masa_medida_kg: 0n,
        masa_estimada_kg: 0n,
      };
      point.cantidad += scaled(r.cantidad);
      if (r.metodo_masa === "medido") point.masa_medida_kg += scaled(r.masa_kg);
      if (r.metodo_masa === "estimado")
        point.masa_estimada_kg += scaled(r.masa_kg);
      daily.set(dailyKey, point);
      deliveries.add(String(r.entrega_id));
      agreements.add(String(r.acuerdo_id));
    }
    return {
      periodo: { ...period, zona: "America/Costa_Rica" },
      tendencia_diaria: [...daily.values()]
        .sort(
          (a, b) =>
            a.fecha.localeCompare(b.fecha) ||
            a.unidad.localeCompare(b.unidad) ||
            a.direccion.localeCompare(b.direccion),
        )
        .map((p) => ({
          ...p,
          cantidad: format(p.cantidad),
          masa_medida_kg: format(p.masa_medida_kg),
          masa_estimada_kg: format(p.masa_estimada_kg),
        })),
      entregas_con_uso_confirmado: deliveries.size,
      acuerdos_con_uso_confirmado: agreements.size,
      grupos: [...groups.values()].map((r) => ({
        ...r,
        cantidad: format(r.cantidad),
        masa_medida_kg: format(r.masa_medida_kg),
        masa_estimada_kg: format(r.masa_estimada_kg),
      })),
      criterio:
        "Solo uso confirmado por ambas empresas. Cantidades por unidad y dirección; sin CO2 ni conversiones implícitas.",
    };
  }
  async function funnel(auth) {
    permit(auth);
    const [rows] = await m.sequelize.query(
      `SELECT s.id,s.estado,a.id AS acuerdo_id,a.estado AS acuerdo_estado FROM solicitudes s JOIN ofertas o ON o.id=s.oferta_id LEFT JOIN acuerdos a ON a.solicitud_id=s.id WHERE s.solicitante_empresa_id=:empresa OR o.empresa_id=:empresa`,
      { replacements: { empresa: auth.company.id } },
    );
    const counts = {
      solicitudes: rows.length,
      aceptadas: rows.filter((r) => r.acuerdo_id).length,
      entregadas: rows.filter((r) =>
        ["entregado", "aprovechamiento_confirmado"].includes(r.acuerdo_estado),
      ).length,
      aprovechadas: rows.filter(
        (r) => r.acuerdo_estado === "aprovechamiento_confirmado",
      ).length,
      cerradas_sin_acuerdo: rows.filter((r) =>
        ["rechazada", "cancelada"].includes(r.estado),
      ).length,
    };
    return {
      conteos: counts,
      conversion_solicitud_acuerdo_pct: counts.solicitudes
        ? Number(((100 * counts.aceptadas) / counts.solicitudes).toFixed(2))
        : null,
      criterio:
        "Todas las solicitudes propias/recibidas, sin filtro de periodo. Etapas de acuerdo según estado actual, no hitos históricos. Conversión = solicitudes con acuerdo / solicitudes. Pendiente no equivale a pérdida. Sin metas inventadas.",
    };
  }
  async function attention(auth, days) {
    if (!auth.company || !auth.permissions.includes("acuerdos.gestionar"))
      throw new IdentityError(
        403,
        "FORBIDDEN",
        "No tenés permiso para consultar seguimiento privado.",
      );
    const [rows] = await m.sequelize.query(
      `SELECT s.id,s.estado,s.updated_at,o.titulo FROM solicitudes s JOIN ofertas o ON o.id=s.oferta_id WHERE (s.solicitante_empresa_id=:empresa OR o.empresa_id=:empresa) AND s.estado IN (:estados) AND s.updated_at <= :cutoff ORDER BY s.updated_at ASC LIMIT 100`,
      {
        replacements: {
          empresa: auth.company.id,
          estados: ["enviada", "en_negociacion"],
          cutoff: new Date(Date.now() - days * 86400000),
        },
      },
    );
    return {
      dias: days,
      pendientes: rows.map((r) => ({
        id: String(r.id),
        titulo: r.titulo,
        estado: r.estado,
        ultimo_movimiento: r.updated_at,
      })),
      limite: 100,
      criterio: "Sin propuesta o mensaje nuevo durante los días indicados.",
    };
  }
  function csv(data) {
    const safe = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return (
      "\uFEFF" +
      [
        [
          "direccion",
          "unidad",
          "cantidad",
          "masa_medida_kg",
          "masa_estimada_kg",
          "lineas_sin_masa",
        ],
        ...data.grupos.map((r) => [
          r.direccion,
          r.unidad,
          r.cantidad,
          r.masa_medida_kg,
          r.masa_estimada_kg,
          r.lineas_sin_masa,
        ]),
      ]
        .map((row) => row.map(safe).join(","))
        .join("\r\n")
    );
  }
  return { permit, indicators, funnel, attention, csv };
}
module.exports = { createMetricsService };
