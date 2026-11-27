module.exports = (sequelize) => {
  const { DataTypes: D } = require("sequelize");
  return {
    SolicitudDerecho: sequelize.define(
      "SolicitudDerecho",
      {
        id: { type: D.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        usuario_id: { type: D.BIGINT.UNSIGNED, allowNull: false },
        empresa_id: D.BIGINT.UNSIGNED,
        tipo: { type: D.STRING(30), allowNull: false },
        estado: { type: D.STRING(30), allowNull: false },
        detalle: { type: D.TEXT, allowNull: false },
        resolucion: D.TEXT,
        verificada_en: { type: D.DATE, allowNull: false },
        creada_en: { type: D.DATE, allowNull: false },
        resuelta_en: D.DATE,
      },
      { tableName: "solicitudes_derechos", timestamps: false },
    ),
  };
};
