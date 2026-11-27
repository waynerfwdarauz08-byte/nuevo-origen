const { Op } = require("sequelize");
const { scaled, available } = require("../decimal");
const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
module.exports = async (m, { materials, operations, source }, auth, input) => {
  let sources = [],
    extra = {};

  if (!input.necesidad_id)
    fail(400, "AI_CONTEXT_REQUIRED", "Seleccioná una necesidad propia.");
  const n = await materials.get(auth, "necesidad", input.necesidad_id);
  if (n.estado !== "activa")
    fail(409, "AI_NEED_INACTIVE", "La búsqueda requiere una necesidad activa.");
  const rows = await m.Oferta.findAll({
    where: {
      categoria_id: n.categoria.id,
      unidad_id: n.unidad.id,
      estado: "publicada",
      empresa_id: { [Op.ne]: auth.company.id },
    },
    include: [
      {
        model: m.Empresa,
        as: "empresa",
        where: { estado: "activa" },
        attributes: ["id"],
      },
    ],
    order: [["id", "DESC"]],
    limit: 100,
  });
  const candidates = [];
  for (const row of rows) {
    if (scaled(available(row)) <= 0n) continue;
    const values = await m.OfertaPropiedad.findAll({
      where: { oferta_id: row.id },
    });
    let rejected = false,
      unknown = [];
    for (const restriction of n.propiedades) {
      const v = values.find(
        (v) => String(v.propiedad_id) === restriction.propiedad_id,
      );
      if (!v) {
        unknown.push(restriction.propiedad_id);
        continue;
      }
      if (
        restriction.valor_texto != null &&
        v.valor_texto != null &&
        restriction.valor_texto.trim().toLowerCase() !==
          v.valor_texto.trim().toLowerCase()
      )
        rejected = true;
      if (restriction.valor_texto != null && v.valor_texto == null)
        unknown.push(restriction.propiedad_id);
      if (restriction.minimo != null || restriction.maximo != null) {
        if (v.valor_numero == null) unknown.push(restriction.propiedad_id);
        else {
          const x = scaled(v.valor_numero, 4);
          if (restriction.minimo != null && x < scaled(restriction.minimo, 4))
            rejected = true;
          if (restriction.maximo != null && x > scaled(restriction.maximo, 4))
            rejected = true;
        }
      }
    }
    if (rejected) continue;
    const o = await materials.publicGet(row.id).catch((error) => {
      if (error.status === 404) return null;
      throw error;
    });
    if (!o) continue;
    const { fotos, empresa, ...ficha } = o;
    candidates.push(
      source("oferta:" + o.id, o.titulo, "/materiales/" + o.id, {
        ...ficha,
        propiedades_por_validar: [...new Set(unknown)],
        cantidad_suficiente:
          scaled(o.cantidad_disponible) >= scaled(n.cantidad),
      }),
    );
    if (candidates.length === 6) break;
  }
  sources = [
    source("necesidad:" + n.id, n.titulo, "/mi-espacio/necesidades/" + n.id, n),
    ...candidates,
  ];
  extra = {
    candidatos: candidates.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      ruta: s.ruta,
    })),
    busqueda_acotada: true,
    limite_preseleccion: 100,
  };

  return { sources, extra };
};
