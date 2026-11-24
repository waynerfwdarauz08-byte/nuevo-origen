module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Rol",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      alcance: { type: DataTypes.STRING(20), allowNull: false },
    },
    { tableName: "roles", timestamps: false },
  );
