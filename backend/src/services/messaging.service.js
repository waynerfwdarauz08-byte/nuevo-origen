const { Op } = require("sequelize");
function createMessagingService(m) {
  const operations = require("./operations.service").createOperationsService(m);
  async function messageDtos(rows) {
    const users = await m.Usuario.findAll({
      where: { id: [...new Set(rows.map((r) => r.autor_id))] },
      attributes: ["id", "nombre", "empresa_id"],
    });
    return rows.map((row) => {
      const u = users.find((u) => String(u.id) === String(row.autor_id));
      return {
        id: String(row.id),
        autor_id: String(row.autor_id),
        nombre: u?.nombre || "Integrante",
        empresa_id: u?.empresa_id ? String(u.empresa_id) : null,
        contenido: row.contenido,
        enviado_en: row.enviado_en,
      };
    });
  }
  return {
    async conversations(auth, page) {
      operations.permission(auth);
      const { rows, count } = await m.Solicitud.findAndCountAll({
        where: {
          [Op.or]: [
            { solicitante_empresa_id: auth.company.id },
            { "$oferta.empresa_id$": auth.company.id },
          ],
        },
        attributes: [
          "id",
          "oferta_id",
          "solicitante_empresa_id",
          "estado",
          "updated_at",
        ],
        include: [
          {
            model: m.Oferta,
            as: "oferta",
            attributes: ["id", "empresa_id", "titulo"],
          },
          { model: m.Acuerdo, as: "acuerdo", attributes: ["id", "estado"] },
        ],
        order: [
          ["updated_at", "DESC"],
          ["id", "DESC"],
        ],
        limit: 20,
        offset: (page - 1) * 20,
        subQuery: false,
        distinct: true,
      });
      const companies = await m.Empresa.findAll({
        where: {
          id: [
            ...new Set(
              rows.flatMap((r) => [
                r.solicitante_empresa_id,
                r.oferta.empresa_id,
              ]),
            ),
          ],
        },
        attributes: ["id", "nombre"],
      });
      const latest = rows.length
        ? (
            await m.sequelize.query(
              "SELECT m.id,m.solicitud_id,m.autor_id,m.contenido,m.enviado_en FROM mensajes m JOIN (SELECT solicitud_id,MAX(id) AS id FROM mensajes WHERE solicitud_id IN (:ids) GROUP BY solicitud_id) ultimo ON ultimo.id=m.id",
              { replacements: { ids: rows.map((r) => r.id) } },
            )
          )[0]
        : [];
      return {
        conversaciones: rows.map((r) => {
          const other =
            String(r.solicitante_empresa_id) === String(auth.company.id)
              ? r.oferta.empresa_id
              : r.solicitante_empresa_id;
          const last = latest.find(
            (l) => String(l.solicitud_id) === String(r.id),
          );
          return {
            id: String(r.id),
            titulo: r.oferta.titulo,
            oferta_id: String(r.oferta_id),
            empresa: {
              id: String(other),
              nombre:
                companies.find((c) => String(c.id) === String(other))?.nombre ||
                "Empresa participante",
            },
            estado: r.estado,
            acuerdo: r.acuerdo
              ? { id: String(r.acuerdo.id), estado: r.acuerdo.estado }
              : null,
            ultimo_mensaje: last
              ? {
                  id: String(last.id),
                  autor_id: String(last.autor_id),
                  resumen: [...last.contenido].slice(0, 120).join(""),
                  enviado_en: last.enviado_en,
                }
              : null,
            actualizada_en: r.updated_at,
          };
        }),
        pagina: page,
        total: count,
        paginas: Math.max(1, Math.ceil(count / 20)),
      };
    },
    async context(auth, id) {
      await operations.requestAccess(auth, id);
      const r = await operations.requestDto(id);
      const otherId =
        String(r.solicitante.id) === String(auth.company.id)
          ? r.empresa_oferente_id
          : r.solicitante.id;
      const other = await m.Empresa.findByPk(otherId, {
        attributes: ["id", "nombre"],
      });
      r.contraparte = { id: String(other.id), nombre: other.nombre };
      // DTO already contains only the participating companies and business context.
      return r;
    },
    async messages(auth, id, cursors) {
      await operations.requestAccess(auth, id);
      const forward = Boolean(cursors.despues_de),
        where = { solicitud_id: id };
      if (cursors.antes_de) where.id = { [Op.lt]: cursors.antes_de };
      if (cursors.despues_de) where.id = { [Op.gt]: cursors.despues_de };
      const rows = await m.Mensaje.findAll({
        where,
        order: [["id", forward ? "ASC" : "DESC"]],
        limit: 51,
      });
      const more = rows.length > 50,
        selected = rows.slice(0, 50);
      if (!forward) selected.reverse();
      return {
        mensajes: await messageDtos(selected),
        hay_mas: more,
        direccion: forward ? "nuevos" : "anteriores",
      };
    },
    async send(auth, id, data, rid) {
      const msg = await operations.message(auth, id, data, rid);
      return { ...msg, empresa_id: String(auth.company.id) };
    },
  };
}
module.exports = { createMessagingService };
