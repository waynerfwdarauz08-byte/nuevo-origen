module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Permiso",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      codigo: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      descripcion: { type: DataTypes.STRING(255), allowNull: false },
    },
    { tableName: "permisos", timestamps: false },
  );
