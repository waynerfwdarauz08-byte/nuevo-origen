module.exports = function defineIdentity(sequelize, { Rol, Permiso }) {
  const { DataTypes: D } = require("sequelize");
  const id = () => ({
    type: D.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  });
  const required = (type) => ({ type, allowNull: false });
  const timestamps = (tableName) => ({
    tableName,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });
  const catalog = (tableName) => ({ tableName, timestamps: false });
  const Empresa = sequelize.define(
    "Empresa",
    {
      id: id(),
      nombre: required(D.STRING(150)),
      sector: required(D.STRING(80)),
      descripcion: D.TEXT,
      correo_contacto: required(D.STRING(254)),
      telefono: D.STRING(30),
      ubicacion_publica: required(D.STRING(160)),
      direccion_privada: D.TEXT,
      estado: required(D.STRING(30)),
    },
    timestamps("empresas"),
  );
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: id(),
      empresa_id: D.BIGINT.UNSIGNED,
      nombre: required(D.STRING(120)),
      correo: { ...required(D.STRING(254)), unique: true },
      password_hash: required(D.STRING(255)),
      estado: required(D.STRING(30)),
    },
    {
      ...timestamps("usuarios"),
      defaultScope: { attributes: { exclude: ["password_hash"] } },
    },
  );
  const UsuarioRol = sequelize.define(
    "UsuarioRol",
    {
      usuario_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      rol_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      asignado_por: required(D.BIGINT.UNSIGNED),
      asignado_en: required(D.DATE),
    },
    catalog("usuario_roles"),
  );
  const Sesion = sequelize.define(
    "Sesion",
    {
      id: id(),
      usuario_id: required(D.BIGINT.UNSIGNED),
      refresh_hash: { ...required(D.CHAR(64)), unique: true },
      vence_en: required(D.DATE),
      revocada_en: D.DATE,
    },
    timestamps("sesiones"),
  );
  const Politica = sequelize.define(
    "Politica",
    {
      id: id(),
      tipo: required(D.STRING(30)),
      version: required(D.STRING(40)),
      contenido: required(D.TEXT("medium")),
      publicada_en: D.DATE,
      vigente: required(D.BOOLEAN),
      estado: required(D.STRING(20)),
    },
    catalog("politicas"),
  );
  const Aceptacion = sequelize.define(
    "Aceptacion",
    {
      id: id(),
      usuario_id: required(D.BIGINT.UNSIGNED),
      politica_id: required(D.BIGINT.UNSIGNED),
      aceptada_en: required(D.DATE),
      medio: required(D.STRING(30)),
    },
    catalog("aceptaciones"),
  );
  const Consentimiento = sequelize.define(
    "Consentimiento",
    {
      id: id(),
      usuario_id: required(D.BIGINT.UNSIGNED),
      finalidad: required(D.STRING(80)),
      otorgado: required(D.BOOLEAN),
      version_aviso: required(D.STRING(40)),
      fecha: required(D.DATE),
    },
    catalog("consentimientos"),
  );
  Usuario.belongsTo(Empresa, { foreignKey: "empresa_id" });
  Empresa.hasMany(Usuario, { foreignKey: "empresa_id" });
  Usuario.belongsToMany(Rol, {
    as: "roles",
    through: UsuarioRol,
    foreignKey: "usuario_id",
    otherKey: "rol_id",
  });
  Sesion.belongsTo(Usuario, { foreignKey: "usuario_id" });
  Aceptacion.belongsTo(Politica, { foreignKey: "politica_id" });
  return {
    Empresa,
    Usuario,
    UsuarioRol,
    Sesion,
    Politica,
    Aceptacion,
    Consentimiento,
  };
};
