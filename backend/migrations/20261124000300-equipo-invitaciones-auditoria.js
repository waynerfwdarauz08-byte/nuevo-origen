module.exports = {
  async up(q, S) {
    const id = () => ({
      type: S.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    });
    const fk = (model, nullable = false) => ({
      type: S.BIGINT.UNSIGNED,
      allowNull: nullable,
      references: { model, key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "RESTRICT",
    });
    const dates = () => ({
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.createTable("tokens_accion", {
      id: id(),
      usuario_id: fk("usuarios"),
      tipo: { type: S.STRING(30), allowNull: false },
      token_hash: { type: S.CHAR(64), allowNull: false, unique: true },
      vence_en: { type: S.DATE, allowNull: false },
      usado_en: S.DATE,
      revocado_en: S.DATE,
      ...dates(),
    });
    await q.createTable("invitaciones", {
      id: id(),
      empresa_id: fk("empresas"),
      creador_id: fk("usuarios"),
      token_accion_id: { ...fk("tokens_accion"), unique: true },
      correo: { type: S.STRING(254), allowNull: false },
      estado: { type: S.STRING(20), allowNull: false },
      aceptada_por: fk("usuarios", true),
      ...dates(),
    });
    await q.addIndex("invitaciones", ["empresa_id", "correo", "estado"]);
    await q.createTable("invitacion_roles", {
      invitacion_id: { ...fk("invitaciones"), primaryKey: true },
      rol_id: { ...fk("roles"), primaryKey: true },
    });
    await q.createTable("auditoria", {
      id: id(),
      actor_id: fk("usuarios", true),
      empresa_id: fk("empresas", true),
      accion: { type: S.STRING(80), allowNull: false },
      recurso_tipo: { type: S.STRING(40), allowNull: false },
      recurso_id: S.BIGINT.UNSIGNED,
      request_id: { type: S.STRING(80), allowNull: false },
      fecha: { type: S.DATE, allowNull: false },
      motivo: S.TEXT,
      detalle: S.JSON,
    });
    await q.addIndex("auditoria", ["empresa_id", "fecha"]);
  },
  async down(q) {
    for (const table of [
      "auditoria",
      "invitacion_roles",
      "invitaciones",
      "tokens_accion",
    ])
      await q.dropTable(table);
  },
};
