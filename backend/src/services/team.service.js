const { randomBytes, createHash } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { Op, Transaction } = require("sequelize");
const { IdentityError } = require("./identity.service");
const { codes } = require("../schemas/team");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
const hash = (token) => createHash("sha256").update(token).digest("hex");
const forbidden = () =>
  fail(
    403,
    "TEAM_FORBIDDEN",
    "Solo la administración empresarial autorizada puede gestionar su equipo.",
  );
const invalid = () =>
  fail(
    410,
    "INVITATION_INVALID",
    "La invitación no es válida, venció o ya no está disponible.",
  );
const notFound = () => fail(404, "NOT_FOUND", "No encontramos este recurso.");
function createTeamService(m, identity, config) {
  const roleInclude = {
    model: m.Rol,
    as: "roles",
    attributes: ["id", "codigo", "nombre", "alcance"],
    through: { attributes: [] },
  };
  const inviteInclude = [
    { model: m.TokenAccion, as: "token" },
    { model: m.Rol, as: "funciones", through: { attributes: [] } },
  ];
  const memberDto = (u) => ({
    id: String(u.id),
    nombre: u.nombre,
    correo: u.correo,
    estado: u.estado,
    funciones: (u.roles || [])
      .filter((r) => r.alcance === "empresa" && codes.includes(r.codigo))
      .map((r) => r.codigo)
      .sort(),
  });
  const inviteDto = (i) => ({
    id: String(i.id),
    correo: i.correo,
    funciones: i.funciones.map((r) => r.codigo).sort(),
    estado:
      i.estado !== "pendiente"
        ? i.estado
        : new Date(i.token.vence_en) <= new Date()
          ? "vencida"
          : "pendiente",
    vence_en: i.token.vence_en,
    creada_en: i.created_at,
    correo_enviado: false,
  });
  const assertAdmin = (auth) => {
    if (
      !auth.company ||
      !auth.roles.includes("administrador_empresa") ||
      !auth.permissions.includes("equipo.gestionar")
    )
      forbidden();
  };
  async function lockCompany(id, transaction) {
    const company = await m.Empresa.findOne({
      where: { id, estado: "activa" },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!company) forbidden();
    return company;
  }
  async function activeAdmin(userId, companyId, transaction) {
    const user = await m.Usuario.findOne({
      where: { id: userId, empresa_id: companyId, estado: "activo" },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) return false;
    const role = await m.Rol.findOne({
      where: { codigo: "administrador_empresa", alcance: "empresa" },
      transaction,
    });
    if (!role) return false;
    const assignment = await m.UsuarioRol.findOne({
      where: { usuario_id: user.id, rol_id: role.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const permission = await m.Permiso.findOne({
      where: { codigo: "equipo.gestionar" },
      transaction,
    });
    return !!(
      assignment &&
      permission &&
      (await m.RolPermiso.findOne({
        where: { rol_id: role.id, permiso_id: permission.id },
        transaction,
      }))
    );
  }
  async function manage(auth, work) {
    assertAdmin(auth);
    return m.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (transaction) => {
        await lockCompany(auth.company.id, transaction);
        if (!(await activeAdmin(auth.user.id, auth.company.id, transaction)))
          forbidden();
        return work(transaction);
      },
    );
  }
  async function audit(
    actor,
    company,
    action,
    type,
    id,
    requestId,
    reason,
    detail,
    transaction,
  ) {
    await m.Auditoria.create(
      {
        actor_id: actor,
        empresa_id: company,
        accion: action,
        recurso_tipo: type,
        recurso_id: id,
        request_id: requestId,
        fecha: new Date(),
        motivo: reason,
        detalle: detail,
      },
      { transaction },
    );
  }
  async function rolesFor(functions, transaction) {
    const roles = functions.length
      ? await m.Rol.findAll({
          where: { codigo: { [Op.in]: functions }, alcance: "empresa" },
          transaction,
        })
      : [];
    if (
      roles.length !== functions.length ||
      functions.some((c) => !codes.includes(c))
    )
      fail(
        400,
        "INVALID_FUNCTIONS",
        "Las funciones empresariales indicadas no son válidas.",
      );
    return roles;
  }
  async function reloadMember(id, transaction) {
    return memberDto(
      await m.Usuario.findByPk(id, { include: [roleInclude], transaction }),
    );
  }
  async function revokeCreatedBy(user, company, actor, requestId, transaction) {
    const invitations = await m.Invitacion.findAll({
      where: { creador_id: user, empresa_id: company, estado: "pendiente" },
      transaction,
    });
    for (const i of invitations) {
      await m.TokenAccion.update(
        { revocado_en: new Date() },
        { where: { id: i.token_accion_id, usado_en: null }, transaction },
      );
      await i.update({ estado: "revocada" }, { transaction });
      await audit(
        actor,
        company,
        "invitacion.revocada",
        "invitacion",
        i.id,
        requestId,
        "El emisor perdió autorización empresarial",
        {},
        transaction,
      );
    }
  }
  async function ensureReplacement(target, removeAdmin, transaction) {
    if (target.estado !== "activo" || !removeAdmin) return;
    const role = await m.Rol.findOne({
      where: { codigo: "administrador_empresa", alcance: "empresa" },
      transaction,
    });
    const isAdmin =
      role &&
      (await m.UsuarioRol.findOne({
        where: { usuario_id: target.id, rol_id: role.id },
        transaction,
      }));
    if (!isAdmin) return;
    const admins = await m.Usuario.count({
      where: { empresa_id: target.empresa_id, estado: "activo" },
      include: [
        { model: m.Rol, as: "roles", where: { id: role.id }, required: true },
      ],
      distinct: true,
      transaction,
    });
    if (admins <= 1)
      fail(
        409,
        "LAST_ADMIN",
        "No podés retirar al último administrador activo. Designá un reemplazo primero.",
      );
  }
  async function targetMember(auth, id, transaction) {
    if (!/^\d+$/.test(String(id))) notFound();
    const member = await m.Usuario.findOne({
      where: { id, empresa_id: auth.company.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!member) notFound();
    return member;
  }
  const pageValue = (value) => {
    const page = value === undefined ? 1 : Number(value);
    if (!Number.isInteger(page) || page < 1 || page > 10000)
      fail(400, "INVALID_PAGE", "La página indicada no es válida.");
    return page;
  };
  async function findToken(token, transaction) {
    return m.TokenAccion.findOne({
      where: { token_hash: hash(token), tipo: "invitacion_equipo" },
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  }
  function validateToken(token, invite) {
    if (
      !token ||
      !invite ||
      token.usado_en ||
      token.revocado_en ||
      new Date(token.vence_en) <= new Date() ||
      invite.estado !== "pendiente"
    )
      invalid();
  }
  async function candidate(token, transaction) {
    const record = await findToken(token, transaction);
    if (!record) invalid();
    const invite = await m.Invitacion.findOne({
      where: { token_accion_id: record.id },
      include: [{ model: m.Rol, as: "funciones", through: { attributes: [] } }],
      transaction,
    });
    validateToken(record, invite);
    return { record, invite };
  }
  return {
    assertAdmin,
    async members(auth, page) {
      assertAdmin(auth);
      const pagina = pageValue(page);
      const where = { empresa_id: auth.company.id };
      const total = await m.Usuario.count({ where });
      const members = await m.Usuario.findAll({
        where,
        include: [roleInclude],
        order: [["id", "ASC"]],
        limit: 50,
        offset: (pagina - 1) * 50,
      });
      return {
        miembros: members.map(memberDto),
        pagina,
        total,
        paginas: Math.max(1, Math.ceil(total / 50)),
      };
    },
    async invitations(auth, page) {
      assertAdmin(auth);
      const pagina = pageValue(page);
      const where = { empresa_id: auth.company.id };
      const total = await m.Invitacion.count({ where });
      const invitations = await m.Invitacion.findAll({
        where,
        include: inviteInclude,
        order: [["id", "DESC"]],
        limit: 50,
        offset: (pagina - 1) * 50,
      });
      return {
        invitaciones: invitations.map(inviteDto),
        pagina,
        total,
        paginas: Math.max(1, Math.ceil(total / 50)),
      };
    },
    async create(auth, data, requestId) {
      assertAdmin(auth);
      if (!config.manualInvitations)
        fail(
          503,
          "INVITATION_DELIVERY_UNAVAILABLE",
          "El correo no está configurado. La entrega manual solo está habilitada en desarrollo.",
        );
      return manage(auth, async (transaction) => {
        if (
          await m.Usuario.findOne({
            where: { correo: data.correo },
            transaction,
          })
        )
          fail(
            409,
            "INVITATION_CONFLICT",
            "No pudimos crear una invitación con esos datos.",
          );
        const pending = await m.Invitacion.findAll({
          where: {
            empresa_id: auth.company.id,
            correo: data.correo,
            estado: "pendiente",
          },
          include: [{ model: m.TokenAccion, as: "token" }],
          transaction,
        });
        if (
          pending.some(
            (i) =>
              !i.token.revocado_en &&
              !i.token.usado_en &&
              new Date(i.token.vence_en) > new Date(),
          )
        )
          fail(
            409,
            "INVITATION_CONFLICT",
            "Ya existe una invitación pendiente para ese correo.",
          );
        const roles = await rolesFor(data.funciones, transaction);
        const token = randomBytes(32).toString("hex");
        const action = await m.TokenAccion.create(
          {
            usuario_id: auth.user.id,
            tipo: "invitacion_equipo",
            token_hash: hash(token),
            vence_en: new Date(Date.now() + 3600000),
            usado_en: null,
            revocado_en: null,
          },
          { transaction },
        );
        const invitation = await m.Invitacion.create(
          {
            empresa_id: auth.company.id,
            creador_id: auth.user.id,
            token_accion_id: action.id,
            correo: data.correo,
            estado: "pendiente",
          },
          { transaction },
        );
        await m.InvitacionRol.bulkCreate(
          roles.map((r) => ({ invitacion_id: invitation.id, rol_id: r.id })),
          { transaction },
        );
        await audit(
          auth.user.id,
          auth.company.id,
          "invitacion.creada",
          "invitacion",
          invitation.id,
          requestId,
          "Invitación creada con entrega manual de desarrollo",
          { funciones: data.funciones },
          transaction,
        );
        return {
          invitacion: inviteDto(
            await m.Invitacion.findByPk(invitation.id, {
              include: inviteInclude,
              transaction,
            }),
          ),
          entrega: {
            modo: "manual_desarrollo",
            correo_enviado: false,
            aviso:
              "No se envió correo. Compartí este enlace de forma privada; solo se muestra ahora.",
            enlace:
              config.invitationOrigin + "/aceptar-invitacion#token=" + token,
          },
        };
      });
    },
    async revoke(auth, id, data, requestId) {
      return manage(auth, async (transaction) => {
        if (!/^\d+$/.test(String(id))) notFound();
        const invite = await m.Invitacion.findOne({
          where: { id, empresa_id: auth.company.id },
          include: inviteInclude,
          transaction,
        });
        if (!invite) notFound();
        if (invite.estado === "aceptada")
          fail(409, "INVITATION_USED", "La invitación ya fue aceptada.");
        if (invite.estado !== "revocada") {
          await invite.token.update(
            { revocado_en: new Date() },
            { transaction },
          );
          await invite.update({ estado: "revocada" }, { transaction });
          await audit(
            auth.user.id,
            auth.company.id,
            "invitacion.revocada",
            "invitacion",
            invite.id,
            requestId,
            data.motivo,
            {},
            transaction,
          );
        }
        return inviteDto(invite);
      });
    },
    async functions(auth, id, data, requestId) {
      return manage(auth, async (transaction) => {
        const member = await targetMember(auth, id, transaction);
        if (member.estado !== "activo")
          fail(409, "MEMBER_INACTIVE", "El integrante está desactivado.");
        const roles = await rolesFor(data.funciones, transaction);
        const previous = await reloadMember(member.id, transaction);
        await ensureReplacement(
          member,
          !data.funciones.includes("administrador_empresa"),
          transaction,
        );
        if (
          JSON.stringify(previous.funciones) !==
          JSON.stringify([...data.funciones].sort())
        ) {
          await m.UsuarioRol.destroy({
            where: { usuario_id: member.id },
            transaction,
          });
          if (roles.length)
            await m.UsuarioRol.bulkCreate(
              roles.map((r) => ({
                usuario_id: member.id,
                rol_id: r.id,
                asignado_por: auth.user.id,
                asignado_en: new Date(),
              })),
              { transaction },
            );
          if (
            previous.funciones.includes("administrador_empresa") &&
            !data.funciones.includes("administrador_empresa")
          )
            await revokeCreatedBy(
              member.id,
              auth.company.id,
              auth.user.id,
              requestId,
              transaction,
            );
          await audit(
            auth.user.id,
            auth.company.id,
            "miembro.funciones",
            "usuario",
            member.id,
            requestId,
            data.motivo,
            { antes: previous.funciones, despues: [...data.funciones].sort() },
            transaction,
          );
        }
        return reloadMember(member.id, transaction);
      });
    },
    async deactivate(auth, id, data, requestId) {
      return manage(auth, async (transaction) => {
        const member = await targetMember(auth, id, transaction);
        if (member.estado === "activo") {
          await ensureReplacement(member, true, transaction);
          await member.update({ estado: "inactivo" }, { transaction });
          await m.Sesion.update(
            { revocada_en: new Date() },
            {
              where: { usuario_id: member.id, revocada_en: null },
              transaction,
            },
          );
          await revokeCreatedBy(
            member.id,
            auth.company.id,
            auth.user.id,
            requestId,
            transaction,
          );
          await audit(
            auth.user.id,
            auth.company.id,
            "miembro.desactivado",
            "usuario",
            member.id,
            requestId,
            data.motivo,
            { antes: "activo", despues: "inactivo" },
            transaction,
          );
        }
        return reloadMember(member.id, transaction);
      });
    },
    async inspect(token) {
      const { invite } = await candidate(token);
      const company = await m.Empresa.findOne({
        where: { id: invite.empresa_id, estado: "activa" },
      });
      if (!company) invalid();
      return {
        empresa: company.nombre,
        correo: invite.correo,
        funciones: invite.funciones.map((r) => r.codigo),
        aviso:
          "No se envió correo. Invitación entregada manualmente en desarrollo.",
      };
    },
    async accept(data, requestId) {
      const initial = await candidate(data.token);
      const password_hash = await bcrypt.hash(data.password, 12);
      try {
        return await m.sequelize.transaction(
          { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
          async (transaction) => {
            await lockCompany(initial.invite.empresa_id, transaction);
            const { invite, record } = await candidate(data.token, transaction);
            if (
              !(await activeAdmin(
                invite.creador_id,
                invite.empresa_id,
                transaction,
              ))
            )
              invalid();
            const roles = await rolesFor(
              invite.funciones.map((r) => r.codigo),
              transaction,
            );
            if (!roles.length) invalid();
            const policies = await identity.policyRows(transaction);
            if (
              new Set(data.aceptaciones.map((p) => p.tipo)).size !== 2 ||
              policies.some(
                (p) =>
                  !data.aceptaciones.some(
                    (a) =>
                      a.tipo === p.tipo &&
                      a.version === p.version &&
                      a.aceptada,
                  ),
              )
            )
              fail(
                409,
                "POLICY_VERSION_CHANGED",
                "Revisá y aceptá las versiones actuales de los borradores.",
              );
            if (
              await m.Usuario.findOne({
                where: { correo: invite.correo },
                transaction,
              })
            )
              fail(
                409,
                "INVITATION_CONFLICT",
                "No pudimos activar la invitación con esos datos.",
              );
            const user = await m.Usuario.create(
              {
                empresa_id: invite.empresa_id,
                correo: invite.correo,
                nombre: data.nombre,
                password_hash,
                estado: "activo",
              },
              { transaction },
            );
            await m.UsuarioRol.bulkCreate(
              roles.map((r) => ({
                usuario_id: user.id,
                rol_id: r.id,
                asignado_por: invite.creador_id,
                asignado_en: new Date(),
              })),
              { transaction },
            );
            for (const policy of policies)
              await m.Aceptacion.create(
                {
                  usuario_id: user.id,
                  politica_id: policy.id,
                  aceptada_en: new Date(),
                  medio: "invitacion_local_borrador",
                },
                { transaction },
              );
            await m.Consentimiento.create(
              {
                usuario_id: user.id,
                finalidad: "comunicaciones_opcionales",
                otorgado: data.comunicaciones_opcionales,
                version_aviso: "local-0.1",
                fecha: new Date(),
              },
              { transaction },
            );
            await record.update({ usado_en: new Date() }, { transaction });
            await invite.update(
              { estado: "aceptada", aceptada_por: user.id },
              { transaction },
            );
            await audit(
              user.id,
              invite.empresa_id,
              "invitacion.aceptada",
              "usuario",
              user.id,
              requestId,
              "Aceptación de invitación empresarial",
              {
                invitacion_id: String(invite.id),
                funciones: roles.map((r) => r.codigo),
              },
              transaction,
            );
            return identity.issue(user, transaction);
          },
        );
      } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError")
          fail(
            409,
            "INVITATION_CONFLICT",
            "No pudimos activar la invitación con esos datos.",
          );
        throw error;
      }
    },
    async auditLog(auth, page) {
      assertAdmin(auth);
      const pagina = pageValue(page);
      const where = { empresa_id: auth.company.id };
      const total = await m.Auditoria.count({ where });
      const rows = await m.Auditoria.findAll({
        where,
        order: [["id", "DESC"]],
        limit: 50,
        offset: (pagina - 1) * 50,
        attributes: [
          "id",
          "actor_id",
          "accion",
          "recurso_tipo",
          "recurso_id",
          "request_id",
          "fecha",
          "motivo",
          "detalle",
        ],
      });
      return {
        eventos: rows,
        pagina,
        total,
        paginas: Math.max(1, Math.ceil(total / 50)),
      };
    },
  };
}
module.exports = { createTeamService };
