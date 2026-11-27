module.exports = (sequelize) => {
  const D = require("../config/datatypes").dataTypes(sequelize),
    required = (type) => ({ type, allowNull: false }),
    id = () => ({
      ...required(D.BIGINT.UNSIGNED),
      primaryKey: true,
      autoIncrement: true,
    });
  const Agente = sequelize.define(
    "Agente",
    {
      id: id(),
      codigo: required(D.STRING(10)),
      nombre: required(D.STRING(100)),
      version_prompt: required(D.STRING(40)),
    },
    { tableName: "agentes", timestamps: false },
  );
  const EjecucionIA = sequelize.define(
    "EjecucionIA",
    {
      id: id(),
      agente_id: required(D.BIGINT.UNSIGNED),
      usuario_id: required(D.BIGINT.UNSIGNED),
      empresa_id: D.BIGINT.UNSIGNED,
      modelo: required(D.STRING(100)),
      version_prompt: required(D.STRING(40)),
      clave_cliente: required(D.STRING(36)),
      entrada_hash: required(D.CHAR(64)),
      contexto_hash: required(D.CHAR(64)),
      estado: required(D.STRING(30)),
      duracion_ms: D.INTEGER,
      tokens_entrada: D.INTEGER,
      tokens_salida: D.INTEGER,
      costo_estimado: D.DECIMAL(12, 6),
      error_codigo: D.STRING(60),
      fecha: required(D.DATE),
      fuentes_json: required(D.JSON),
      respuesta_json: D.JSON,
    },
    { tableName: "ejecuciones_ia", timestamps: false },
  );
  return { Agente, EjecucionIA };
};
