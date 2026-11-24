"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("roles", {
      id: { type: S.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      codigo: { type: S.STRING(40), allowNull: false, unique: true },
      nombre: { type: S.STRING(80), allowNull: false },
      alcance: { type: S.STRING(20), allowNull: false },
    });
    await q.createTable("permisos", {
      id: { type: S.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      codigo: { type: S.STRING(80), allowNull: false, unique: true },
      descripcion: { type: S.STRING(255), allowNull: false },
    });
    await q.createTable("rol_permiso", {
      rol_id: {
        type: S.BIGINT.UNSIGNED,
        primaryKey: true,
        references: { model: "roles", key: "id" },
        onDelete: "RESTRICT",
      },
      permiso_id: {
        type: S.BIGINT.UNSIGNED,
        primaryKey: true,
        references: { model: "permisos", key: "id" },
        onDelete: "RESTRICT",
      },
    });
  },
  async down(q) {
    await q.dropTable("rol_permiso");
    await q.dropTable("permisos");
    await q.dropTable("roles");
  },
};
