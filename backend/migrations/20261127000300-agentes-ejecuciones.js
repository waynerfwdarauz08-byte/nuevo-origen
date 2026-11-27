"use strict";
module.exports = {
  async up(q, S) {
    const id = {
      type: S.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    };
    const ref = (table, nullable = false) => ({
      type: S.BIGINT.UNSIGNED,
      allowNull: nullable,
      references: { model: table, key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
    await q.createTable("agentes", {
      id,
      codigo: { type: S.STRING(10), allowNull: false, unique: true },
      nombre: { type: S.STRING(100), allowNull: false },
      version_prompt: { type: S.STRING(40), allowNull: false },
    });
    await q.createTable("ejecuciones_ia", {
      id,
      agente_id: ref("agentes"),
      usuario_id: ref("usuarios"),
      empresa_id: ref("empresas", true),
      modelo: { type: S.STRING(100), allowNull: false },
      version_prompt: { type: S.STRING(40), allowNull: false },
      clave_cliente: { type: S.STRING(36), allowNull: false },
      entrada_hash: { type: S.CHAR(64), allowNull: false },
      contexto_hash: { type: S.CHAR(64), allowNull: false },
      estado: { type: S.STRING(30), allowNull: false },
      duracion_ms: { type: S.INTEGER, allowNull: true },
      tokens_entrada: S.INTEGER,
      tokens_salida: S.INTEGER,
      costo_estimado: S.DECIMAL(12, 6),
      error_codigo: S.STRING(60),
      fecha: { type: S.DATE, allowNull: false },
      fuentes_json: { type: S.JSON, allowNull: false },
      respuesta_json: S.JSON,
    });
    await q.addIndex("ejecuciones_ia", ["usuario_id", "clave_cliente"], {
      unique: true,
      name: "ia_usuario_clave_unica",
    });
    await q.addIndex("ejecuciones_ia", ["usuario_id", "fecha"], {
      name: "ia_usuario_fecha",
    });
    await q.addIndex("ejecuciones_ia", ["empresa_id", "fecha"], {
      name: "ia_empresa_fecha",
    });
    const names = [
      "Orquestador",
      "Caracterización de materiales",
      "Compatibilidad",
      "Aprovechamiento",
      "Asistente documental RAG",
      "Seguimiento de acuerdos",
      "Analista de impacto",
      "Revisor de publicaciones",
    ];
    await q.bulkInsert(
      "agentes",
      names.map((nombre, i) => ({
        codigo: `AG-0${i + 1}`,
        nombre,
        version_prompt: "1.0.0",
      })),
    );
  },
  async down() {
    throw new Error(
      "No eliminar trazabilidad IA automáticamente; restaurar en una base nueva.",
    );
  },
};
