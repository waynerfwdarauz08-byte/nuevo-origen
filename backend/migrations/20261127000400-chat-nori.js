module.exports = {
  async up(q, S) {
    const id = () => ({
        type: S.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      }),
      req = (type) => ({ type, allowNull: false }),
      ref = (table, nullable = false) => ({
        type: S.BIGINT.UNSIGNED,
        allowNull: nullable,
        references: { model: table, key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });
    await q.createTable("conversaciones_ia", {
      id: id(),
      usuario_id: ref("usuarios"),
      empresa_id: ref("empresas", true),
      clave_cliente: req(S.STRING(36)),
      contexto_json: req(S.JSON),
      contexto_hash: req(S.CHAR(64)),
      creada_en: req(S.DATE),
      actualizada_en: req(S.DATE),
    });
    await q.addIndex("conversaciones_ia", ["usuario_id", "clave_cliente"], {
      unique: true,
      name: "nori_conversacion_clave",
    });
    await q.addIndex("conversaciones_ia", ["usuario_id", "id"], {
      name: "nori_conversacion_usuario",
    });
    await q.createTable("turnos_ia", {
      id: id(),
      conversacion_id: ref("conversaciones_ia"),
      usuario_id: ref("usuarios"),
      clave_cliente: req(S.STRING(36)),
      pregunta: req(S.TEXT),
      estado: req(S.STRING(30)),
      error_codigo: S.STRING(60),
      ejecucion_id: { ...ref("ejecuciones_ia", true), unique: true },
      fecha: req(S.DATE),
    });
    await q.addIndex("turnos_ia", ["usuario_id", "clave_cliente"], {
      unique: true,
      name: "nori_turno_clave",
    });
    await q.addIndex("turnos_ia", ["conversacion_id", "id"], {
      name: "nori_turnos_cursor",
    });
  },
  async down() {
    throw new Error(
      "No borrar conversaciones automáticamente; usar respaldo y procedimiento autorizado.",
    );
  },
};
