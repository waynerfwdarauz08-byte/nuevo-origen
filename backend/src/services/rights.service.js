const { randomBytes, createHash } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { IdentityError } = require("./identity.service");
const fail = (status, message) => {
  throw new IdentityError(status, "ACCOUNT_OPERATION", message);
};
const hash = (v) => createHash("sha256").update(v).digest("hex");
function createRightsService(m, config) {
  const ops = require("./operations.service").createOperationsService(m);
  const withUser = (id, work) =>
    ops.tx(async (t) => {
      const initial = await m.Usuario.findByPk(id, { transaction: t });
      if (!initial) fail(404, "No encontramos esta cuenta.");
      if (initial.empresa_id) await ops.companies([initial.empresa_id], t);
      const user = await m.Usuario.unscoped().findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (user.estado !== "activo") fail(403, "La cuenta no está activa.");
      return work(user, t);
    });
  const audit = (auth, action, id, detail, t, rid) =>
    m.Auditoria.create(
      {
        actor_id: auth.user.id,
        empresa_id: auth.company?.id || null,
        accion: action,
        recurso_tipo: "usuario",
        recurso_id: id,
        request_id: rid,
        fecha: new Date(),
        motivo: detail.motivo || "Operación propia confirmada",
        detalle: detail,
      },
      { transaction: t },
    );
  async function password(user, value) {
    if (!(await bcrypt.compare(value, user.password_hash)))
      fail(400, "No pudimos confirmar la operación. Revisá la contraseña.");
  }
  async function platform(auth, t) {
    if (auth.company || !auth.permissions.includes("derechos.procesar"))
      fail(403, "Tu función no permite esta operación.");
    const u = await m.Usuario.findOne({
      where: { id: auth.user.id, empresa_id: null, estado: "activo" },
      include: [{ model: m.Rol, as: "roles", include: [m.Permiso] }],
      transaction: t,
    });
    if (
      !u?.roles.some(
        (r) =>
          r.alcance === "plataforma" &&
          r.Permisos.some((p) => p.codigo === "derechos.procesar"),
      )
    )
      fail(403, "Tu acceso cambió.");
  }
  return {
    async preferences(auth) {
      const row = await m.Consentimiento.findOne({
        where: {
          usuario_id: auth.user.id,
          finalidad: "comunicaciones_opcionales",
        },
        order: [["id", "DESC"]],
      });
      return {
        comunicaciones_opcionales: row?.otorgado === true,
        version_aviso: "local-0.1",
        estado_politicas: "borrador",
      };
    },
    async consent(auth, value, rid) {
      return withUser(auth.user.id, async (user, t) => {
        await m.Consentimiento.create(
          {
            usuario_id: user.id,
            finalidad: "comunicaciones_opcionales",
            otorgado: value,
            version_aviso: "local-0.1",
            fecha: new Date(),
          },
          { transaction: t },
        );
        await audit(
          auth,
          "consentimiento.actualizado",
          user.id,
          { otorgado: value },
          t,
          rid,
        );
        return { comunicaciones_opcionales: value, correo_enviado: false };
      });
    },
    async export(auth, value, rid) {
      return withUser(auth.user.id, async (user, t) => {
        await password(user, value);
        const acceptances = await m.Aceptacion.findAll({
          where: { usuario_id: user.id },
          include: [
            { model: m.Politica, attributes: ["tipo", "version", "estado"] },
          ],
          transaction: t,
        });
        const consents = await m.Consentimiento.findAll({
          where: { usuario_id: user.id },
          transaction: t,
        });
        const rights = await m.SolicitudDerecho.findAll({
          where: { usuario_id: user.id },
          transaction: t,
        });
        await audit(
          auth,
          "datos.exportados",
          user.id,
          { motivo: "Exportación solicitada y contraseña confirmada" },
          t,
          rid,
        );
        return {
          generado_en: new Date(),
          alcance:
            "Perfil propio, aceptaciones, consentimientos e historial de derechos. No incluye conversaciones ni datos de terceros.",
          perfil: {
            id: String(user.id),
            nombre: user.nombre,
            correo: user.correo,
            estado: user.estado,
            empresa_id: user.empresa_id && String(user.empresa_id),
          },
          aceptaciones: acceptances,
          consentimientos: consents,
          solicitudes: rights,
        };
      });
    },
    async request(auth, data, rid) {
      return withUser(auth.user.id, async (user, t) => {
        await password(user, data.password);
        if (data.tipo === "baja_empresa") {
          if (!auth.company)
            fail(
              403,
              "La baja empresarial requiere administración empresarial.",
            );
          await ops.actor(auth, t, "empresa.baja");
        }
        const row = await m.SolicitudDerecho.create(
          {
            usuario_id: user.id,
            empresa_id: user.empresa_id,
            tipo: data.tipo,
            estado: "recibida",
            detalle: data.detalle,
            verificada_en: new Date(),
            creada_en: new Date(),
          },
          { transaction: t },
        );
        await audit(
          auth,
          "derecho.solicitado",
          user.id,
          { solicitud_id: String(row.id), tipo: data.tipo },
          t,
          rid,
        );
        return {
          solicitud: row,
          aviso:
            "Solicitud recibida. No se ha eliminado ni dado de baja ningún dato. Su resolución requiere revisión del responsable.",
          correo_enviado: false,
        };
      });
    },
    async own(auth) {
      return {
        solicitudes: await m.SolicitudDerecho.findAll({
          where: { usuario_id: auth.user.id },
          order: [["id", "DESC"]],
        }),
      };
    },
    async queue(auth) {
      await platform(auth);
      return {
        solicitudes: await m.SolicitudDerecho.findAll({
          where: { estado: { [Op.ne]: "resuelta" } },
          order: [["id", "ASC"]],
          limit: 100,
        }),
        ejecucion_baja_habilitada: false,
      };
    },
    async review(auth, id, data, rid) {
      return ops.tx(async (t) => {
        await platform(auth, t);
        const row = await m.SolicitudDerecho.findByPk(id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!row) fail(404, "No encontramos esta solicitud.");
        await row.update(
          { estado: "en_revision", resolucion: data.motivo },
          { transaction: t },
        );
        await audit(
          auth,
          "derecho.en_revision",
          row.usuario_id,
          { solicitud_id: String(row.id), motivo: data.motivo },
          t,
          rid,
        );
        return row;
      });
    },
    async recovery(auth, data, rid) {
      await platform(auth);
      if (!config.manualInvitations)
        fail(403, "La recuperación manual solo está habilitada en desarrollo.");
      return withUser(data.usuario_id, async (user, t) => {
        await platform(auth, t);
        await m.TokenAccion.update(
          { revocado_en: new Date() },
          {
            where: {
              usuario_id: user.id,
              tipo: "recuperacion",
              usado_en: null,
              revocado_en: null,
            },
            transaction: t,
          },
        );
        const token = randomBytes(32).toString("hex");
        await m.TokenAccion.create(
          {
            usuario_id: user.id,
            tipo: "recuperacion",
            token_hash: hash(token),
            vence_en: new Date(Date.now() + 3600000),
          },
          { transaction: t },
        );
        await audit(
          auth,
          "recuperacion.emitida",
          user.id,
          { motivo: data.motivo, identidad_verificada: true },
          t,
          rid,
        );
        return {
          entrega: {
            modo: "manual_desarrollo",
            correo_enviado: false,
            aviso:
              "No se envió correo. Compartí el enlace únicamente con la persona cuya identidad verificaste. Se muestra una sola vez.",
            enlace: config.invitationOrigin + "/restablecer#token=" + token,
          },
        };
      });
    },
    async reset(data, rid) {
      const record = await m.TokenAccion.unscoped().findOne({
        where: { token_hash: hash(data.token), tipo: "recuperacion" },
      });
      const invalid = () =>
        fail(410, "El enlace no es válido, venció o ya no está disponible.");
      if (
        !record ||
        record.usado_en ||
        record.revocado_en ||
        new Date(record.vence_en) <= new Date()
      )
        invalid();
      const encoded = await bcrypt.hash(data.password, 12);
      return withUser(record.usuario_id, async (user, t) => {
        const locked = await m.TokenAccion.unscoped().findByPk(record.id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (
          locked.usado_en ||
          locked.revocado_en ||
          new Date(locked.vence_en) <= new Date()
        )
          invalid();
        await user.update({ password_hash: encoded }, { transaction: t });
        await locked.update({ usado_en: new Date() }, { transaction: t });
        await m.Sesion.update(
          { revocada_en: new Date() },
          { where: { usuario_id: user.id, revocada_en: null }, transaction: t },
        );
        await m.TokenAccion.update(
          { revocado_en: new Date() },
          {
            where: { usuario_id: user.id, usado_en: null, revocado_en: null },
            transaction: t,
          },
        );
        await m.Invitacion.update(
          { estado: "revocada" },
          {
            where: { creador_id: user.id, estado: "pendiente" },
            transaction: t,
          },
        );
        await audit(
          { user, company: user.empresa_id ? { id: user.empresa_id } : null },
          "password.restablecida",
          user.id,
          { motivo: "Token de recuperación de uso único confirmado" },
          t,
          rid,
        );
        return {
          restablecida: true,
          sesiones_revocadas: true,
          correo_enviado: false,
        };
      });
    },
  };
}
module.exports = { createRightsService };
