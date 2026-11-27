const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { IdentityError } = require("./identity.service");
const fail = (status, message) => {
  throw new IdentityError(status, "PLATFORM_OPERATION", message);
};
function createPlatformService(m) {
  const tx = require("./operations.service").createOperationsService(m).tx;
  const include = [{ model: m.Rol, as: "roles", include: [m.Permiso] }];
  function permission(auth, code) {
    if (auth.company || !auth.permissions.includes(code))
      fail(403, "Tu función no permite administrar plataforma.");
  }
  async function fresh(auth, code, t) {
    permission(auth, code);
    const u = await m.Usuario.findOne({
      where: { id: auth.user.id, empresa_id: null, estado: "activo" },
      include,
      transaction: t,
    });
    if (
      !u?.roles.some(
        (r) =>
          r.alcance === "plataforma" &&
          r.Permisos.some((p) => p.codigo === code),
      )
    )
      fail(403, "Tu autorización cambió.");
  }
  const audit = (auth, action, type, id, motivo, detail, t, rid) =>
    m.Auditoria.create(
      {
        actor_id: auth.user.id,
        empresa_id: null,
        accion: action,
        recurso_tipo: type,
        recurso_id: id,
        request_id: rid,
        fecha: new Date(),
        motivo,
        detalle: detail,
      },
      { transaction: t },
    );
  const dto = (u) => ({
    id: String(u.id),
    nombre: u.nombre,
    correo: u.correo,
    estado: u.estado,
    funciones: u.roles.map((r) => r.codigo),
  });
  async function globalLock(t) {
    const row = await m.Rol.findOne({
      where: { codigo: "administrador_plataforma", alcance: "plataforma" },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) fail(503, "Los roles iniciales no están disponibles.");
    return row;
  }
  async function roles(codes, t) {
    const rows = await m.Rol.findAll({
      where: { alcance: "plataforma", codigo: codes },
      transaction: t,
    });
    if (rows.length !== codes.length)
      fail(400, "Solo se permiten funciones globales existentes.");
    return rows;
  }
  async function setRoles(user, rows, actor, t) {
    await m.UsuarioRol.destroy({
      where: { usuario_id: user.id },
      transaction: t,
    });
    await m.UsuarioRol.bulkCreate(
      rows.map((r) => ({
        usuario_id: user.id,
        rol_id: r.id,
        asignado_por: actor,
        asignado_en: new Date(),
      })),
      { transaction: t },
    );
  }
  return {
    async users(auth) {
      await fresh(auth, "roles_globales.gestionar");
      return {
        usuarios: (
          await m.Usuario.findAll({
            where: { empresa_id: null },
            include,
            order: [["id", "ASC"]],
            limit: 100,
          })
        ).map(dto),
      };
    },
    async create(auth, data, rid) {
      permission(auth, "roles_globales.gestionar");
      const password_hash = await bcrypt.hash(data.password, 12);
      return tx(async (t) => {
        await globalLock(t);
        await fresh(auth, "roles_globales.gestionar", t);
        const rs = await roles(data.funciones, t);
        if (
          await m.Usuario.findOne({
            where: { correo: data.correo },
            transaction: t,
          })
        )
          fail(409, "No pudimos crear la cuenta con esos datos.");
        const u = await m.Usuario.create(
          {
            nombre: data.nombre,
            correo: data.correo,
            password_hash,
            empresa_id: null,
            estado: "activo",
          },
          { transaction: t },
        );
        await setRoles(u, rs, auth.user.id, t);
        await audit(
          auth,
          "cuenta_global.creada",
          "usuario",
          u.id,
          data.motivo,
          { funciones: data.funciones },
          t,
          rid,
        );
        return { ...dto({ ...u.get(), roles: rs }), correo_enviado: false };
      });
    },
    async update(auth, id, data, rid) {
      return tx(async (t) => {
        const admin = await globalLock(t);
        await fresh(auth, "roles_globales.gestionar", t);
        const u = await m.Usuario.findOne({
          where: { id, empresa_id: null },
          include,
          transaction: t,
        });
        if (!u) fail(404, "No encontramos esta cuenta global.");
        const rs = await roles(data.funciones, t),
          losesAdmin =
            u.estado === "activo" &&
            u.roles.some((r) => String(r.id) === String(admin.id)) &&
            (data.estado !== "activo" ||
              !rs.some((r) => String(r.id) === String(admin.id)));
        if (losesAdmin) {
          const n = await m.Usuario.count({
            where: { empresa_id: null, estado: "activo" },
            include: [
              {
                model: m.Rol,
                as: "roles",
                where: { id: admin.id },
                required: true,
              },
            ],
            distinct: true,
            transaction: t,
          });
          if (n <= 1)
            fail(
              409,
              "Debe permanecer una administración de plataforma activa.",
            );
        }
        await setRoles(u, rs, auth.user.id, t);
        await u.update({ estado: data.estado }, { transaction: t });
        if (data.estado !== "activo")
          await m.Sesion.update(
            { revocada_en: new Date() },
            { where: { usuario_id: u.id, revocada_en: null }, transaction: t },
          );
        await audit(
          auth,
          "cuenta_global.actualizada",
          "usuario",
          u.id,
          data.motivo,
          { funciones: data.funciones, estado: data.estado },
          t,
          rid,
        );
        return dto({ ...u.get(), roles: rs });
      });
    },
    async policies(auth) {
      await fresh(auth, "politicas.gestionar");
      return {
        politicas: await m.Politica.findAll({ order: [["id", "DESC"]] }),
      };
    },
    async policy(auth, data, rid) {
      return tx(async (t) => {
        await globalLock(t);
        await fresh(auth, "politicas.gestionar", t);
        if (
          await m.Politica.findOne({
            where: { tipo: data.tipo, version: data.version },
            transaction: t,
          })
        )
          fail(409, "La versión ya existe; creá otra sin reescribirla.");
        await m.Politica.update(
          { vigente: false },
          { where: { tipo: data.tipo, vigente: true }, transaction: t },
        );
        const row = await m.Politica.create(
          {
            tipo: data.tipo,
            version: data.version,
            contenido: data.contenido,
            estado: "borrador",
            vigente: true,
            publicada_en: new Date(),
          },
          { transaction: t },
        );
        await audit(
          auth,
          "politica.borrador_versionado",
          "politica",
          row.id,
          data.motivo,
          { tipo: row.tipo, version: row.version },
          t,
          rid,
        );
        return row;
      });
    },
    async log(auth, page) {
      await fresh(auth, "auditoria.consultar");
      const rows = await m.Auditoria.findAndCountAll({
        order: [["id", "DESC"]],
        limit: 50,
        offset: (page - 1) * 50,
        attributes: [
          "id",
          "actor_id",
          "empresa_id",
          "accion",
          "recurso_tipo",
          "recurso_id",
          "fecha",
          "motivo",
        ],
      });
      return {
        eventos: rows.rows,
        total: rows.count,
        pagina: page,
        paginas: Math.max(1, Math.ceil(rows.count / 50)),
      };
    },
  };
}
module.exports = { createPlatformService };
