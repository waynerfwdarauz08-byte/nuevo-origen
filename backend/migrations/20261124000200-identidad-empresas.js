"use strict";
module.exports = {
  async up(q, S) {
    const id = () => ({
      type: S.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    });
    const fk = (model, nullable = false) => ({
      type: S.BIGINT.UNSIGNED,
      allowNull: nullable,
      references: { model, key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "RESTRICT",
    });
    const timestamps = () => ({
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.createTable("empresas", {
      id: id(),
      nombre: { type: S.STRING(150), allowNull: false },
      sector: { type: S.STRING(80), allowNull: false },
      descripcion: S.TEXT,
      correo_contacto: { type: S.STRING(254), allowNull: false },
      telefono: S.STRING(30),
      ubicacion_publica: { type: S.STRING(160), allowNull: false },
      direccion_privada: S.TEXT,
      estado: { type: S.STRING(30), allowNull: false, defaultValue: "activa" },
      ...timestamps(),
    });
    await q.createTable("usuarios", {
      id: id(),
      empresa_id: fk("empresas", true),
      nombre: { type: S.STRING(120), allowNull: false },
      correo: { type: S.STRING(254), allowNull: false, unique: true },
      password_hash: { type: S.STRING(255), allowNull: false },
      estado: { type: S.STRING(30), allowNull: false, defaultValue: "activo" },
      ...timestamps(),
    });
    await q.createTable("usuario_roles", {
      usuario_id: { ...fk("usuarios"), primaryKey: true },
      rol_id: { ...fk("roles"), primaryKey: true },
      asignado_por: fk("usuarios"),
      asignado_en: { type: S.DATE, allowNull: false },
    });
    await q.createTable("sesiones", {
      id: id(),
      usuario_id: fk("usuarios"),
      refresh_hash: { type: S.CHAR(64), allowNull: false, unique: true },
      vence_en: { type: S.DATE, allowNull: false },
      revocada_en: S.DATE,
      ...timestamps(),
    });
    await q.addIndex("sesiones", ["usuario_id", "revocada_en"]);
    await q.createTable("politicas", {
      id: id(),
      tipo: { type: S.STRING(30), allowNull: false },
      version: { type: S.STRING(40), allowNull: false },
      contenido: { type: S.TEXT("medium"), allowNull: false },
      publicada_en: S.DATE,
      vigente: { type: S.BOOLEAN, allowNull: false },
      estado: {
        type: S.STRING(20),
        allowNull: false,
        defaultValue: "borrador",
      },
    });
    await q.addConstraint("politicas", {
      fields: ["tipo", "version"],
      type: "unique",
      name: "politicas_tipo_version_unique",
    });
    await q.createTable("aceptaciones", {
      id: id(),
      usuario_id: fk("usuarios"),
      politica_id: fk("politicas"),
      aceptada_en: { type: S.DATE, allowNull: false },
      medio: { type: S.STRING(30), allowNull: false },
    });
    await q.addConstraint("aceptaciones", {
      fields: ["usuario_id", "politica_id"],
      type: "unique",
      name: "aceptaciones_usuario_politica_unique",
    });
    await q.createTable("consentimientos", {
      id: id(),
      usuario_id: fk("usuarios"),
      finalidad: { type: S.STRING(80), allowNull: false },
      otorgado: { type: S.BOOLEAN, allowNull: false },
      version_aviso: { type: S.STRING(40), allowNull: false },
      fecha: { type: S.DATE, allowNull: false },
    });
  },
  // No ejecutar sobre bases con datos sin respaldo y revisión específica de impacto.
  async down(q) {
    for (const table of [
      "consentimientos",
      "aceptaciones",
      "politicas",
      "sesiones",
      "usuario_roles",
      "usuarios",
      "empresas",
    ])
      await q.dropTable(table);
  },
};
