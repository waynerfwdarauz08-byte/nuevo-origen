"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("solicitudes_derechos", {
      id: {
        type: S.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuario_id: {
        type: S.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      empresa_id: {
        type: S.BIGINT.UNSIGNED,
        references: { model: "empresas", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      tipo: { type: S.STRING(30), allowNull: false },
      estado: { type: S.STRING(30), allowNull: false },
      detalle: { type: S.TEXT, allowNull: false },
      resolucion: { type: S.TEXT },
      verificada_en: { type: S.DATE, allowNull: false },
      creada_en: { type: S.DATE, allowNull: false },
      resuelta_en: { type: S.DATE },
    });
    await q.addIndex("solicitudes_derechos", ["usuario_id", "creada_en"]);
  },
  async down(q) {
    await q.dropTable("solicitudes_derechos");
  },
};
