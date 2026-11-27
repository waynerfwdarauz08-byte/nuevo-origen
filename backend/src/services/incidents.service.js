const { Op } = require("sequelize");
const { IdentityError } = require("./identity.service");
const same = (a, b) => String(a) === String(b);
const fail = (status, message) => {
  throw new IdentityError(status, "INCIDENT_OPERATION", message);
};
const missing = () => fail(404, "No encontramos este caso.");
function createIncidentsService(m) {
  const operations = require("./operations.service").createOperationsService(m);
  const scopes = ["incidencias.supervisar", "incidencias.resolver_caso"];
  const supervisor = (auth) =>
    !auth.company && auth.permissions.includes(scopes[0]);
  function allowed(auth) {
    if (auth.company || !scopes.some((p) => auth.permissions.includes(p)))
      fail(403, "Tu función no permite gestionar casos.");
  }
  async function fresh(auth, t) {
    allowed(auth);
    const user = await m.Usuario.findOne({
      where: { id: auth.user.id, empresa_id: null, estado: "activo" },
      include: [{ model: m.Rol, as: "roles", include: [m.Permiso] }],
      transaction: t,
    });
    if (
      !user ||
      !user.roles.some(
        (r) =>
          r.alcance === "plataforma" &&
          r.Permisos.some((p) =>
            supervisor(auth) ? p.codigo === scopes[0] : p.codigo === scopes[1],
          ),
      )
    )
      fail(403, "Tu acceso cambió. Actualizá la sesión.");
  }
  function privatePermission(auth) {
    const code = supervisor(auth)
      ? "privados.acceso_excepcional"
      : "privados.evidencia_caso";
    if (!auth.permissions.includes(code))
      fail(403, "Tu función no permite consultar evidencia privada.");
  }
  async function audit(auth, row, action, detail, rid, t) {
    await m.Auditoria.create(
      {
        actor_id: auth.user.id,
        empresa_id: null,
        accion: action,
        recurso_tipo: "incidencia",
        recurso_id: row.id,
        request_id: rid,
        fecha: new Date(),
        motivo: detail.motivo || "Acceso autorizado al caso",
        detalle: detail,
      },
      { transaction: t },
    );
  }
  const summary = (row) => ({
    id: String(row.id),
    oferta_id: row.oferta_id && String(row.oferta_id),
    acuerdo_id: row.acuerdo_id && String(row.acuerdo_id),
    entrega_id: row.entrega_id && String(row.entrega_id),
    estado: row.estado,
    revisor_id: row.revisor_id && String(row.revisor_id),
    creado_en: row.created_at,
  });
  async function access(auth, id, t) {
    allowed(auth);
    const row = await m.Incidencia.findByPk(id, { transaction: t });
    if (!row || !same(row.revisor_id, auth.user.id)) missing();
    return row;
  }
  async function companyIds(row, t) {
    if (row.acuerdo_id) {
      const agreement = await m.Acuerdo.findByPk(row.acuerdo_id, {
        transaction: t,
      });
      const r = await m.Solicitud.findByPk(agreement.solicitud_id, {
        transaction: t,
      });
      const o = await m.Oferta.findByPk(r.oferta_id, { transaction: t });
      return [r.solicitante_empresa_id, o.empresa_id];
    }
    const o = await m.Oferta.findByPk(row.oferta_id, { transaction: t });
    return o ? [o.empresa_id] : [];
  }
  return {
    async report(auth, data, rid) {
      if (data.acuerdo_id && !auth.company)
        fail(403, "Solo una empresa participante puede reportar su acuerdo.");
      return operations.tx(async (t) => {
        if (auth.company) await operations.companies([auth.company.id], t);
        if (
          !(await m.Usuario.findOne({
            where: {
              id: auth.user.id,
              empresa_id: auth.company?.id || null,
              estado: "activo",
            },
            transaction: t,
          }))
        )
          fail(403, "Tu cuenta ya no está activa.");
        if (data.acuerdo_id) {
          await operations.actor(auth, t);
          await operations.agreementAccess(auth, data.acuerdo_id, t);
        } else {
          const o = await m.Oferta.findOne({
            where: { id: data.oferta_id, estado: "publicada" },
            transaction: t,
          });
          if (!o) missing();
        }
        const row = await m.Incidencia.create(
          { ...data, reportante_id: auth.user.id, estado: "abierta" },
          { transaction: t },
        );
        await audit(
          auth,
          row,
          "incidencia.reportada",
          { motivo: "Reporte confirmado por usuario" },
          rid,
          t,
        );
        return summary(row);
      });
    },
    async list(auth, page) {
      allowed(auth);
      const where = supervisor(auth)
        ? {}
        : {
            [Op.or]: [
              { revisor_id: auth.user.id },
              { revisor_id: null, estado: "abierta" },
            ],
          };
      const { count, rows } = await m.Incidencia.findAndCountAll({
        where,
        limit: 30,
        offset: (page - 1) * 30,
        order: [["id", "DESC"]],
      });
      return {
        casos: rows.map(summary),
        total: count,
        pagina: page,
        paginas: Math.max(1, Math.ceil(count / 30)),
      };
    },
    async claim(auth, id, rid) {
      allowed(auth);
      return operations.tx(async (t) => {
        await fresh(auth, t);
        const row = await m.Incidencia.findByPk(id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!row) missing();
        if (row.estado !== "abierta" || row.revisor_id)
          fail(409, "El caso ya está asignado o cerrado.");
        await row.update(
          { revisor_id: auth.user.id, estado: "en_revision" },
          { transaction: t },
        );
        await audit(
          auth,
          row,
          "incidencia.asignada",
          { revisor_id: String(auth.user.id) },
          rid,
          t,
        );
        return summary(row);
      });
    },
    async detail(auth, id, rid) {
      privatePermission(auth);
      return operations.tx(async (t) => {
        await fresh(auth, t);
        const row = await access(auth, id, t);
        await audit(
          auth,
          row,
          "incidencia.consultada",
          { motivo: "Revisión del caso asignado" },
          rid,
          t,
        );
        const d =
          row.entrega_id && (await operations.loadDelivery(row.entrega_id, t));
        return {
          ...summary(row),
          motivo: row.motivo,
          resolucion: row.resolucion,
          entrega: d ? operations.deliveryDto(d) : null,
        };
      });
    },
    async resolve(auth, id, data, rid) {
      const initial = await access(auth, id);
      return operations.tx(async (t) => {
        // Same company lock order as acceptance, delivery, team and cancellation.
        await operations.companies(await companyIds(initial, t), t);
        await fresh(auth, t);
        const row = await m.Incidencia.findByPk(id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!row || !same(row.revisor_id, auth.user.id)) missing();
        if (row.estado !== "en_revision")
          fail(409, "Asigná un caso abierto antes de resolverlo.");
        const detail = { motivo: data.motivo, accion: data.accion };
        if (row.entrega_id) {
          if (!["retomar_entrega", "anular_entrega"].includes(data.accion))
            fail(400, "Elegí una resolución de la entrega.");
          const a = await m.Acuerdo.findByPk(row.acuerdo_id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          const d = await m.Entrega.findByPk(row.entrega_id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (d.estado !== "disputada")
            fail(409, "La entrega ya no está disputada.");
          if (data.accion === "retomar_entrega") {
            const confirmations = await m.Confirmacion.findAll({
              where: { entrega_id: d.id },
              transaction: t,
            });
            detail.confirmaciones_reemplazadas = confirmations.map((c) => ({
              empresa_id: String(c.empresa_id),
              usuario_id: String(c.usuario_id),
              tipo: c.tipo,
              conforme: c.conforme,
              observacion: c.observacion,
              fecha: c.fecha,
            }));
            await m.Confirmacion.destroy({
              where: { entrega_id: d.id },
              transaction: t,
            });
            await d.update({ estado: "pendiente" }, { transaction: t });
          } else await d.update({ estado: "anulada" }, { transaction: t });
          await operations.refreshAgreement(a, auth, rid, t);
        } else if (row.oferta_id) {
          if (!["pausar_oferta", "sin_cambio"].includes(data.accion))
            fail(400, "Elegí una resolución de la oferta.");
          const o = await m.Oferta.findByPk(row.oferta_id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (data.accion === "pausar_oferta") {
            if (o.estado !== "publicada")
              fail(409, "La oferta ya no está publicada.");
            await o.update({ estado: "pausada" }, { transaction: t });
          }
        } else if (data.accion !== "sin_cambio")
          fail(400, "Este caso solo admite cierre documentado.");
        await row.update(
          { estado: "resuelta", resolucion: data.motivo },
          { transaction: t },
        );
        await audit(auth, row, "incidencia.resuelta", detail, rid, t);
        await operations.notify(
          await companyIds(row, t),
          "incidencia_resuelta",
          `incidencia:${row.id}:resuelta`,
          row.acuerdo_id
            ? `/mi-espacio/acuerdos/${row.acuerdo_id}`
            : "/mi-espacio/avisos",
          t,
        );
        return summary(row);
      });
    },
    async evidence(auth, id, fileId, rid) {
      privatePermission(auth);
      const row = await access(auth, id);
      if (!row.entrega_id) missing();
      const link = await m.EntregaEvidencia.findOne({
        where: { entrega_id: row.entrega_id, archivo_id: fileId },
      });
      const file =
        link &&
        (await m.Archivo.findOne({ where: { id: fileId, estado: "activo" } }));
      if (!file) missing();
      await audit(
        auth,
        row,
        "incidencia.evidencia_consultada",
        { archivo_id: String(file.id) },
        rid,
      );
      return file;
    },
  };
}
module.exports = { createIncidentsService };
