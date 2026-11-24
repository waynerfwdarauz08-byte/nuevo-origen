const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createHash, randomBytes } = require("node:crypto");
const { Op } = require("sequelize");
class IdentityError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const userDto = (u) => ({
  id: String(u.id),
  nombre: u.nombre,
  correo: u.correo,
  empresa_id: u.empresa_id === null ? null : String(u.empresa_id),
});
const companyDto = (e) => ({
  id: String(e.id),
  nombre: e.nombre,
  sector: e.sector,
  descripcion: e.descripcion || "",
  correo_contacto: e.correo_contacto,
  telefono: e.telefono || "",
  ubicacion_publica: e.ubicacion_publica,
  direccion_privada: e.direccion_privada || "",
});
function createIdentityService(m, config) {
  const now = () => new Date();
  const dummyHash = bcrypt.hash("clave-ficticia-solo-comparacion", 12);
  async function policies(transaction) {
    return m.Politica.findAll({
      where: { vigente: true, tipo: { [Op.in]: ["terminos", "privacidad"] } },
      order: [["id", "DESC"]],
      transaction,
    });
  }
  async function currentPolicies(transaction) {
    const all = await policies(transaction);
    const selected = ["terminos", "privacidad"].map((tipo) =>
      all.find((p) => p.tipo === tipo),
    );
    if (selected.some((p) => !p))
      fail(
        503,
        "POLICIES_UNAVAILABLE",
        "No están disponibles las políticas de pruebas.",
      );
    return selected;
  }
  async function issue(user, transaction) {
    const expires = new Date(Date.now() + config.ttl * 1000);
    // No se almacena el token en claro. Se completa su hash dentro de la misma transacción.
    const session = await m.Sesion.create(
      {
        usuario_id: user.id,
        refresh_hash: hash(randomBytes(32)),
        vence_en: expires,
        revocada_en: null,
      },
      { transaction },
    );
    const token = jwt.sign({ sid: String(session.id) }, config.jwtSecret, {
      algorithm: "HS256",
      subject: String(user.id),
      issuer: "nuevo-origen",
      audience: "nuevo-origen-web",
      expiresIn: config.ttl,
      jwtid: randomBytes(16).toString("hex"),
    });
    await session.update({ refresh_hash: hash(token) }, { transaction });
    return { token, expires };
  }
  async function register(data) {
    const password_hash = await bcrypt.hash(data.usuario.password, 12);
    try {
      return await m.sequelize.transaction(async (transaction) => {
        const ps = await currentPolicies(transaction);
        if (
          new Set(data.aceptaciones.map((p) => p.tipo)).size !== 2 ||
          ps.some(
            (p) =>
              !data.aceptaciones.some(
                (a) =>
                  a.tipo === p.tipo && a.version === p.version && a.aceptada,
              ),
          )
        )
          fail(
            409,
            "POLICY_VERSION_CHANGED",
            "Revisá y aceptá las versiones actuales de los borradores.",
          );
        const role = await m.Rol.findOne({
          where: { codigo: "administrador_empresa", alcance: "empresa" },
          transaction,
        });
        if (!role)
          fail(503, "ROLES_UNAVAILABLE", "El registro no está disponible.");
        const empresa = await m.Empresa.create(
          { ...data.empresa, estado: "activa" },
          { transaction },
        );
        const user = await m.Usuario.create(
          {
            nombre: data.usuario.nombre,
            correo: data.usuario.correo,
            password_hash,
            empresa_id: empresa.id,
            estado: "activo",
          },
          { transaction },
        );
        await m.UsuarioRol.create(
          {
            usuario_id: user.id,
            rol_id: role.id,
            asignado_por: user.id,
            asignado_en: now(),
          },
          { transaction },
        );
        for (const p of ps)
          await m.Aceptacion.create(
            {
              usuario_id: user.id,
              politica_id: p.id,
              aceptada_en: now(),
              medio: "registro_local_borrador",
            },
            { transaction },
          );
        await m.Consentimiento.create(
          {
            usuario_id: user.id,
            finalidad: "comunicaciones_opcionales",
            otorgado: data.comunicaciones_opcionales,
            version_aviso: "local-0.1",
            fecha: now(),
          },
          { transaction },
        );
        return issue(user, transaction);
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError")
        fail(
          409,
          "REGISTRATION_UNAVAILABLE",
          "No pudimos completar el registro con esos datos. Revisá la información o iniciá sesión.",
        );
      throw error;
    }
  }
  async function login(data) {
    const user = await m.Usuario.unscoped().findOne({
      where: { correo: data.correo },
    });
    const valid = await bcrypt.compare(
      data.password,
      user?.password_hash || (await dummyHash),
    );
    if (!valid || !user || user.estado !== "activo")
      fail(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
    const company = user.empresa_id
      ? await m.Empresa.findByPk(user.empresa_id)
      : null;
    if (user.empresa_id && company?.estado !== "activa")
      fail(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
    return m.sequelize.transaction((transaction) => issue(user, transaction));
  }
  async function authenticate(token) {
    if (!token) fail(401, "SESSION_REQUIRED", "Iniciá sesión para continuar.");
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "nuevo-origen",
        audience: "nuevo-origen-web",
      });
    } catch {
      fail(
        401,
        "SESSION_REQUIRED",
        "La sesión venció o no es válida. Iniciá sesión.",
      );
    }
    if (!/^\d+$/.test(payload.sid || "") || !/^\d+$/.test(payload.sub || ""))
      fail(401, "SESSION_REQUIRED", "La sesión no es válida.");
    const session = await m.Sesion.findOne({
      where: {
        id: payload.sid,
        usuario_id: payload.sub,
        refresh_hash: hash(token),
        revocada_en: null,
        vence_en: { [Op.gt]: now() },
      },
    });
    if (!session)
      fail(401, "SESSION_REQUIRED", "La sesión venció o fue cerrada.");
    const user = await m.Usuario.findOne({
      where: { id: session.usuario_id, estado: "activo" },
      include: [{ model: m.Rol, as: "roles", include: [m.Permiso] }],
    });
    if (!user) fail(401, "SESSION_REQUIRED", "La sesión no es válida.");
    const company = user.empresa_id
      ? await m.Empresa.findOne({
          where: { id: user.empresa_id, estado: "activa" },
        })
      : null;
    if (user.empresa_id && !company)
      fail(401, "SESSION_REQUIRED", "La sesión no es válida.");
    // Roles globales no se convierten en permisos empresariales, aunque exista una asignación inconsistente.
    const roles = user.roles.filter(
      (r) => r.alcance === (company ? "empresa" : "plataforma"),
    );
    const permissions = [
      ...new Set(roles.flatMap((r) => r.Permisos.map((p) => p.codigo))),
    ].sort();
    return {
      session,
      user,
      company,
      roles: roles.map((r) => r.codigo),
      permissions,
    };
  }
  const sessionDto = (auth) => ({
    usuario: userDto(auth.user),
    empresa: auth.company
      ? { id: String(auth.company.id), nombre: auth.company.nombre }
      : null,
    roles: auth.roles,
    permisos: auth.permissions,
    vence_en: auth.session.vence_en,
  });
  const scope = (auth, id) => {
    if (!auth.company || String(auth.company.id) !== String(id))
      fail(404, "NOT_FOUND", "No encontramos este recurso.");
  };
  const permit = (auth, permission) => {
    if (!auth.permissions.includes(permission))
      fail(403, "FORBIDDEN", "No tenés permiso para realizar esta acción.");
  };
  return {
    policyRows: currentPolicies,
    issue,
    register,
    login,
    authenticate,
    sessionDto,
    scope,
    permit,
    async getPolicies() {
      return (await currentPolicies()).map((p) => ({
        id: String(p.id),
        tipo: p.tipo,
        version: p.version,
        estado: p.estado,
        contenido: p.contenido,
      }));
    },
    async logout(auth) {
      await auth.session.update({ revocada_en: now() });
    },
    async account(auth) {
      const accepts = await m.Aceptacion.findAll({
        where: { usuario_id: auth.user.id },
        include: [m.Politica],
      });
      return {
        ...userDto(auth.user),
        aceptaciones: accepts.map((a) => ({
          tipo: a.Politica.tipo,
          version: a.Politica.version,
          estado: a.Politica.estado,
          aceptada_en: a.aceptada_en,
        })),
      };
    },
    async updateAccount(auth, data) {
      await auth.user.update({ nombre: data.nombre });
      return userDto(auth.user);
    },
    async company(auth, id) {
      scope(auth, id);
      permit(auth, "perfil.leer");
      return companyDto(auth.company);
    },
    async updateCompany(auth, id, data) {
      scope(auth, id);
      permit(auth, "perfil.gestionar");
      await auth.company.update(data, { fields: Object.keys(data) });
      return companyDto(auth.company);
    },
  };
}
module.exports = { createIdentityService, IdentityError };
