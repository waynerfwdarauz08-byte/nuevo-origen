module.exports = (sequelize) => {
  const D = require("../config/datatypes").dataTypes(sequelize),
    req = (type) => ({ type, allowNull: false }),
    id = () => ({
      ...req(D.BIGINT.UNSIGNED),
      primaryKey: true,
      autoIncrement: true,
    });
  const ConversacionIA = sequelize.define(
    "ConversacionIA",
    {
      id: id(),
      usuario_id: req(D.BIGINT.UNSIGNED),
      empresa_id: D.BIGINT.UNSIGNED,
      clave_cliente: req(D.STRING(36)),
      contexto_json: req(D.JSON),
      contexto_hash: req(D.CHAR(64)),
      creada_en: req(D.DATE),
      actualizada_en: req(D.DATE),
    },
    { tableName: "conversaciones_ia", timestamps: false },
  );
  const TurnoIA = sequelize.define(
    "TurnoIA",
    {
      id: id(),
      conversacion_id: req(D.BIGINT.UNSIGNED),
      usuario_id: req(D.BIGINT.UNSIGNED),
      clave_cliente: req(D.STRING(36)),
      pregunta: req(D.TEXT),
      estado: req(D.STRING(30)),
      error_codigo: D.STRING(60),
      ejecucion_id: D.BIGINT.UNSIGNED,
      fecha: req(D.DATE),
    },
    { tableName: "turnos_ia", timestamps: false },
  );
  return { ConversacionIA, TurnoIA };
};
