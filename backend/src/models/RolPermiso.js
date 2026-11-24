module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "RolPermiso",
    {
      rol_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        references: { model: "roles", key: "id" },
      },
      permiso_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        references: { model: "permisos", key: "id" },
      },
    },
    { tableName: "rol_permiso", timestamps: false },
  );
