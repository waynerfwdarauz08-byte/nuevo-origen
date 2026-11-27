module.exports = (sequelize, { Usuario, Rol }) => {
  const D = require("../config/datatypes").dataTypes(sequelize);
  const required = (type) => ({ type, allowNull: false });
  const id = () => ({
    type: D.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  });
  const dated = (tableName) => ({
    tableName,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  });
  const TokenAccion = sequelize.define(
    "TokenAccion",
    {
      id: id(),
      usuario_id: required(D.BIGINT.UNSIGNED),
      tipo: required(D.STRING(30)),
      token_hash: { ...required(D.CHAR(64)), unique: true },
      vence_en: required(D.DATE),
      usado_en: D.DATE,
      revocado_en: D.DATE,
    },
    {
      ...dated("tokens_accion"),
      defaultScope: { attributes: { exclude: ["token_hash"] } },
    },
  );
  const Invitacion = sequelize.define(
    "Invitacion",
    {
      id: id(),
      empresa_id: required(D.BIGINT.UNSIGNED),
      creador_id: required(D.BIGINT.UNSIGNED),
      token_accion_id: { ...required(D.BIGINT.UNSIGNED), unique: true },
      correo: required(D.STRING(254)),
      estado: required(D.STRING(20)),
      aceptada_por: D.BIGINT.UNSIGNED,
    },
    dated("invitaciones"),
  );
  const InvitacionRol = sequelize.define(
    "InvitacionRol",
    {
      invitacion_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      rol_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
    },
    { tableName: "invitacion_roles", timestamps: false },
  );
  const Auditoria = sequelize.define(
    "Auditoria",
    {
      id: id(),
      actor_id: D.BIGINT.UNSIGNED,
      empresa_id: D.BIGINT.UNSIGNED,
      accion: required(D.STRING(80)),
      recurso_tipo: required(D.STRING(40)),
      recurso_id: D.BIGINT.UNSIGNED,
      request_id: required(D.STRING(80)),
      fecha: required(D.DATE),
      motivo: D.TEXT,
      detalle: D.JSON,
    },
    { tableName: "auditoria", timestamps: false },
  );
  Invitacion.belongsTo(TokenAccion, {
    as: "token",
    foreignKey: "token_accion_id",
  });
  Invitacion.belongsToMany(Rol, {
    as: "funciones",
    through: InvitacionRol,
    foreignKey: "invitacion_id",
    otherKey: "rol_id",
  });
  TokenAccion.belongsTo(Usuario, { foreignKey: "usuario_id" });
  return { TokenAccion, Invitacion, InvitacionRol, Auditoria };
};
