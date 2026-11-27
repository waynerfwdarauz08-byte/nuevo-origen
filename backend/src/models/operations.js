module.exports = (sequelize, m) => {
  const D = require("../config/datatypes").dataTypes(sequelize),
    req = (type) => ({ type, allowNull: false }),
    id = () => ({
      type: D.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    }),
    dates = (tableName) => ({
      tableName,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }),
    catalog = (tableName) => ({ tableName, timestamps: false });
  const Solicitud = sequelize.define(
    "Solicitud",
    {
      id: id(),
      oferta_id: req(D.BIGINT.UNSIGNED),
      necesidad_id: D.BIGINT.UNSIGNED,
      solicitante_empresa_id: req(D.BIGINT.UNSIGNED),
      creador_id: req(D.BIGINT.UNSIGNED),
      cantidad: req(D.DECIMAL(14, 3)),
      propuesta: req(D.TEXT),
      estado: req(D.STRING(30)),
      version: req(D.INTEGER.UNSIGNED),
      proponente_empresa_id: req(D.BIGINT.UNSIGNED),
      condiciones_json: req(D.JSON),
    },
    dates("solicitudes"),
  );
  const Acuerdo = sequelize.define(
    "Acuerdo",
    {
      id: id(),
      solicitud_id: { ...req(D.BIGINT.UNSIGNED), unique: true },
      modalidad: req(D.STRING(20)),
      condiciones: req(D.TEXT),
      fecha_prevista: D.DATE,
      estado: req(D.STRING(40)),
      version_aceptada: req(D.INTEGER.UNSIGNED),
    },
    dates("acuerdos"),
  );
  const AcuerdoLinea = sequelize.define(
    "AcuerdoLinea",
    {
      id: id(),
      acuerdo_id: req(D.BIGINT.UNSIGNED),
      oferta_id: req(D.BIGINT.UNSIGNED),
      unidad_id: req(D.BIGINT.UNSIGNED),
      empresa_oferente_id: req(D.BIGINT.UNSIGNED),
      empresa_receptora_id: req(D.BIGINT.UNSIGNED),
      cantidad: req(D.DECIMAL(14, 3)),
      precio_unitario_acordado: D.DECIMAL(14, 2),
      moneda: D.CHAR(3),
      ficha_json: req(D.JSON),
    },
    catalog("acuerdo_lineas"),
  );
  const Mensaje = sequelize.define(
    "Mensaje",
    {
      id: id(),
      solicitud_id: req(D.BIGINT.UNSIGNED),
      autor_id: req(D.BIGINT.UNSIGNED),
      contenido: req(D.TEXT),
      clave_cliente: D.STRING(36),
      enviado_en: req(D.DATE),
    },
    catalog("mensajes"),
  );
  const HistorialEstado = sequelize.define(
    "HistorialEstado",
    {
      id: id(),
      solicitud_id: D.BIGINT.UNSIGNED,
      acuerdo_id: D.BIGINT.UNSIGNED,
      actor_id: req(D.BIGINT.UNSIGNED),
      estado_anterior: D.STRING(40),
      estado_nuevo: req(D.STRING(40)),
      motivo: D.TEXT,
      fecha: req(D.DATE),
    },
    catalog("historial_estados"),
  );
  const Entrega = sequelize.define(
    "Entrega",
    {
      id: id(),
      acuerdo_id: req(D.BIGINT.UNSIGNED),
      clave_idempotencia: { ...req(D.STRING(80)), unique: true },
      entrada_hash: req(D.CHAR(64)),
      fecha: req(D.DATE),
      estado: req(D.STRING(40)),
      creador_id: req(D.BIGINT.UNSIGNED),
    },
    dates("entregas"),
  );
  const EntregaLinea = sequelize.define(
    "EntregaLinea",
    {
      id: id(),
      entrega_id: req(D.BIGINT.UNSIGNED),
      acuerdo_linea_id: req(D.BIGINT.UNSIGNED),
      cantidad: req(D.DECIMAL(14, 3)),
      masa_kg: D.DECIMAL(14, 3),
      metodo_masa: D.STRING(20),
      factor_kg: D.DECIMAL(14, 6),
      fuente_factor: D.STRING(255),
    },
    catalog("entrega_lineas"),
  );
  const Confirmacion = sequelize.define(
    "Confirmacion",
    {
      id: id(),
      entrega_id: req(D.BIGINT.UNSIGNED),
      empresa_id: req(D.BIGINT.UNSIGNED),
      usuario_id: req(D.BIGINT.UNSIGNED),
      tipo: req(D.STRING(30)),
      conforme: req(D.BOOLEAN),
      observacion: D.TEXT,
      fecha: req(D.DATE),
    },
    catalog("confirmaciones"),
  );
  const EntregaEvidencia = sequelize.define(
    "EntregaEvidencia",
    {
      entrega_id: { ...req(D.BIGINT.UNSIGNED), primaryKey: true },
      archivo_id: { ...req(D.BIGINT.UNSIGNED), primaryKey: true },
      descripcion: D.STRING(255),
    },
    catalog("entrega_evidencias"),
  );
  const Incidencia = sequelize.define(
    "Incidencia",
    {
      id: id(),
      reportante_id: D.BIGINT.UNSIGNED,
      oferta_id: D.BIGINT.UNSIGNED,
      acuerdo_id: D.BIGINT.UNSIGNED,
      entrega_id: D.BIGINT.UNSIGNED,
      motivo: req(D.TEXT),
      estado: req(D.STRING(30)),
      resolucion: D.TEXT,
      revisor_id: D.BIGINT.UNSIGNED,
    },
    dates("incidencias"),
  );
  const Notificacion = sequelize.define(
    "Notificacion",
    {
      id: id(),
      usuario_id: req(D.BIGINT.UNSIGNED),
      tipo: req(D.STRING(40)),
      canal: req(D.STRING(20)),
      evento_clave: req(D.STRING(120)),
      estado: req(D.STRING(30)),
      leida_en: D.DATE,
      ruta: req(D.STRING(200)),
      creada_en: req(D.DATE),
    },
    catalog("notificaciones"),
  );
  Solicitud.belongsTo(m.Oferta, { as: "oferta", foreignKey: "oferta_id" });
  Solicitud.belongsTo(m.Empresa, {
    as: "solicitante",
    foreignKey: "solicitante_empresa_id",
  });
  Solicitud.hasOne(Acuerdo, { as: "acuerdo", foreignKey: "solicitud_id" });
  Acuerdo.belongsTo(Solicitud, { as: "solicitud", foreignKey: "solicitud_id" });
  Acuerdo.hasMany(AcuerdoLinea, { as: "lineas", foreignKey: "acuerdo_id" });
  Acuerdo.hasMany(Entrega, { as: "entregas", foreignKey: "acuerdo_id" });
  Entrega.hasMany(EntregaLinea, { as: "lineas", foreignKey: "entrega_id" });
  Entrega.hasMany(Confirmacion, {
    as: "confirmaciones",
    foreignKey: "entrega_id",
  });
  Entrega.belongsToMany(m.Archivo, {
    as: "evidencias",
    through: EntregaEvidencia,
    foreignKey: "entrega_id",
    otherKey: "archivo_id",
  });
  return {
    Solicitud,
    Acuerdo,
    AcuerdoLinea,
    Mensaje,
    HistorialEstado,
    Entrega,
    EntregaLinea,
    Confirmacion,
    EntregaEvidencia,
    Incidencia,
    Notificacion,
  };
};
