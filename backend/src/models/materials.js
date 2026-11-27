module.exports = (sequelize, m) => {
  const { DataTypes: D } = require("sequelize");
  const required = (type) => ({ type, allowNull: false });
  const id = () => ({
    type: D.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  });
  const catalog = (tableName) => ({ tableName, timestamps: false });
  const dates = (tableName) => ({
    tableName,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  });
  const Categoria = sequelize.define(
    "Categoria",
    {
      id: id(),
      nombre: { ...required(D.STRING(80)), unique: true },
      descripcion: D.TEXT,
      activo: required(D.BOOLEAN),
    },
    catalog("categorias"),
  );
  const Unidad = sequelize.define(
    "Unidad",
    {
      id: id(),
      codigo: { ...required(D.STRING(15)), unique: true },
      nombre: required(D.STRING(60)),
      magnitud: required(D.STRING(30)),
      activo: required(D.BOOLEAN),
    },
    catalog("unidades"),
  );
  const Propiedad = sequelize.define(
    "Propiedad",
    {
      id: id(),
      nombre: { ...required(D.STRING(60)), unique: true },
      tipo_dato: required(D.STRING(20)),
      unidad_id: D.BIGINT.UNSIGNED,
      activo: required(D.BOOLEAN),
    },
    catalog("propiedades"),
  );
  const CategoriaPropiedad = sequelize.define(
    "CategoriaPropiedad",
    {
      categoria_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      propiedad_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      requerida: required(D.BOOLEAN),
    },
    catalog("categoria_propiedad"),
  );
  const base = {
    empresa_id: required(D.BIGINT.UNSIGNED),
    autor_id: required(D.BIGINT.UNSIGNED),
    categoria_id: required(D.BIGINT.UNSIGNED),
    unidad_id: required(D.BIGINT.UNSIGNED),
    titulo: required(D.STRING(160)),
    ubicacion: required(D.STRING(160)),
    estado: required(D.STRING(30)),
  };
  const Oferta = sequelize.define(
    "Oferta",
    {
      id: id(),
      ...base,
      composicion: required(D.TEXT),
      estado_material: required(D.STRING(40)),
      cantidad_total: required(D.DECIMAL(14, 3)),
      cantidad_reservada: {
        ...required(D.DECIMAL(14, 3)),
        defaultValue: "0.000",
      },
      cantidad_entregada: {
        ...required(D.DECIMAL(14, 3)),
        defaultValue: "0.000",
      },
      modalidad: required(D.STRING(20)),
      precio_unitario: D.DECIMAL(14, 2),
      moneda: D.CHAR(3),
      frecuencia: required(D.STRING(30)),
      declaracion_no_peligroso: required(D.BOOLEAN),
      declaracion_aprovechable: required(D.BOOLEAN),
    },
    dates("ofertas"),
  );
  const OfertaPropiedad = sequelize.define(
    "OfertaPropiedad",
    {
      oferta_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      propiedad_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      valor_texto: D.STRING(255),
      valor_numero: D.DECIMAL(14, 4),
    },
    catalog("oferta_propiedad"),
  );
  const Archivo = sequelize.define(
    "Archivo",
    {
      id: id(),
      empresa_id: required(D.BIGINT.UNSIGNED),
      clave_objeto: { ...required(D.STRING(255)), unique: true },
      nombre: required(D.STRING(255)),
      mime: required(D.STRING(120)),
      bytes: required(D.BIGINT.UNSIGNED),
      hash_sha256: required(D.CHAR(64)),
      visibilidad: required(D.STRING(20)),
      estado: required(D.STRING(20)),
    },
    dates("archivos"),
  );
  const OfertaArchivo = sequelize.define(
    "OfertaArchivo",
    {
      oferta_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      archivo_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      orden: required(D.SMALLINT.UNSIGNED),
    },
    catalog("oferta_archivo"),
  );
  const Necesidad = sequelize.define(
    "Necesidad",
    {
      id: id(),
      ...base,
      descripcion: required(D.TEXT),
      cantidad: required(D.DECIMAL(14, 3)),
      fecha_objetivo: D.DATEONLY,
    },
    dates("necesidades"),
  );
  const NecesidadPropiedad = sequelize.define(
    "NecesidadPropiedad",
    {
      necesidad_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      propiedad_id: { ...required(D.BIGINT.UNSIGNED), primaryKey: true },
      valor_texto: D.STRING(255),
      minimo: D.DECIMAL(14, 4),
      maximo: D.DECIMAL(14, 4),
    },
    catalog("necesidad_propiedad"),
  );
  Categoria.belongsToMany(Propiedad, {
    as: "propiedades",
    through: CategoriaPropiedad,
    foreignKey: "categoria_id",
    otherKey: "propiedad_id",
  });
  Propiedad.belongsTo(Unidad, { as: "unidad", foreignKey: "unidad_id" });
  for (const Model of [Oferta, Necesidad]) {
    Model.belongsTo(Categoria, { as: "categoria", foreignKey: "categoria_id" });
    Model.belongsTo(Unidad, { as: "unidad", foreignKey: "unidad_id" });
    Model.belongsTo(m.Empresa, { as: "empresa", foreignKey: "empresa_id" });
  }
  Oferta.hasMany(OfertaPropiedad, {
    as: "propiedades",
    foreignKey: "oferta_id",
  });
  Necesidad.hasMany(NecesidadPropiedad, {
    as: "propiedades",
    foreignKey: "necesidad_id",
  });
  Oferta.belongsToMany(Archivo, {
    as: "fotos",
    through: OfertaArchivo,
    foreignKey: "oferta_id",
    otherKey: "archivo_id",
  });
  return {
    Categoria,
    Unidad,
    Propiedad,
    CategoriaPropiedad,
    Oferta,
    OfertaPropiedad,
    Archivo,
    OfertaArchivo,
    Necesidad,
    NecesidadPropiedad,
  };
};
