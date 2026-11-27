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
    const text = (n) => ({ type: S.STRING(n), allowNull: false });
    const dates = () => ({
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.createTable("categorias", {
      id: id(),
      nombre: { ...text(80), unique: true },
      descripcion: S.TEXT,
      activo: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
    });
    await q.createTable("unidades", {
      id: id(),
      codigo: { ...text(15), unique: true },
      nombre: text(60),
      magnitud: text(30),
      activo: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
    });
    await q.createTable("propiedades", {
      id: id(),
      nombre: { ...text(60), unique: true },
      tipo_dato: text(20),
      unidad_id: fk("unidades", true),
      activo: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
    });
    await q.createTable("categoria_propiedad", {
      categoria_id: { ...fk("categorias"), primaryKey: true },
      propiedad_id: { ...fk("propiedades"), primaryKey: true },
      requerida: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await q.createTable("ofertas", {
      id: id(),
      empresa_id: fk("empresas"),
      autor_id: fk("usuarios"),
      categoria_id: fk("categorias"),
      unidad_id: fk("unidades"),
      titulo: text(160),
      composicion: { type: S.TEXT, allowNull: false },
      estado_material: text(40),
      cantidad_total: { type: S.DECIMAL(14, 3), allowNull: false },
      cantidad_reservada: {
        type: S.DECIMAL(14, 3),
        allowNull: false,
        defaultValue: 0,
      },
      cantidad_entregada: {
        type: S.DECIMAL(14, 3),
        allowNull: false,
        defaultValue: 0,
      },
      modalidad: text(20),
      precio_unitario: S.DECIMAL(14, 2),
      moneda: S.CHAR(3),
      frecuencia: text(30),
      ubicacion: text(160),
      estado: { ...text(30), defaultValue: "borrador" },
      declaracion_no_peligroso: {
        type: S.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      declaracion_aprovechable: {
        type: S.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ...dates(),
    });
    await q.createTable("oferta_propiedad", {
      oferta_id: { ...fk("ofertas"), primaryKey: true },
      propiedad_id: { ...fk("propiedades"), primaryKey: true },
      valor_texto: S.STRING(255),
      valor_numero: S.DECIMAL(14, 4),
    });
    await q.createTable("archivos", {
      id: id(),
      empresa_id: fk("empresas"),
      clave_objeto: { ...text(255), unique: true },
      nombre: text(255),
      mime: text(120),
      bytes: { type: S.BIGINT.UNSIGNED, allowNull: false },
      hash_sha256: { type: S.CHAR(64), allowNull: false },
      visibilidad: { ...text(20), defaultValue: "privada" },
      estado: { ...text(20), defaultValue: "activo" },
      ...dates(),
    });
    await q.createTable("oferta_archivo", {
      oferta_id: { ...fk("ofertas"), primaryKey: true },
      archivo_id: { ...fk("archivos"), primaryKey: true },
      orden: { type: S.SMALLINT.UNSIGNED, allowNull: false },
    });
    await q.createTable("necesidades", {
      id: id(),
      empresa_id: fk("empresas"),
      autor_id: fk("usuarios"),
      categoria_id: fk("categorias"),
      unidad_id: fk("unidades"),
      titulo: text(160),
      descripcion: { type: S.TEXT, allowNull: false },
      cantidad: { type: S.DECIMAL(14, 3), allowNull: false },
      ubicacion: text(160),
      fecha_objetivo: S.DATEONLY,
      estado: { ...text(30), defaultValue: "borrador" },
      ...dates(),
    });
    await q.createTable("necesidad_propiedad", {
      necesidad_id: { ...fk("necesidades"), primaryKey: true },
      propiedad_id: { ...fk("propiedades"), primaryKey: true },
      valor_texto: S.STRING(255),
      minimo: S.DECIMAL(14, 4),
      maximo: S.DECIMAL(14, 4),
    });
    for (const table of ["ofertas", "necesidades"]) {
      await q.addIndex(table, ["empresa_id", "estado", "id"]);
      await q.addIndex(table, ["estado", "categoria_id", "unidad_id"]);
    }
    // MySQL 8 aplica CHECK: también protege escrituras fuera de la API.
    const checks = {
      ofertas: [
        [
          "ofertas_cantidades_validas",
          "cantidad_total > 0 AND cantidad_reservada >= 0 AND cantidad_entregada >= 0 AND cantidad_reservada + cantidad_entregada <= cantidad_total",
        ],
        [
          "ofertas_precio_valido",
          "(modalidad = 'venta' AND precio_unitario IS NOT NULL AND precio_unitario >= 0 AND moneda IS NOT NULL) OR (modalidad IN ('donacion','intercambio') AND precio_unitario IS NULL AND moneda IS NULL)",
        ],
        [
          "ofertas_estado_valido",
          "estado IN ('borrador','publicada','pausada','agotada','archivada')",
        ],
      ],
      necesidades: [
        ["necesidades_cantidad_valida", "cantidad > 0"],
        [
          "necesidades_estado_valido",
          "estado IN ('borrador','activa','pausada','cerrada','archivada')",
        ],
      ],
      oferta_propiedad: [
        [
          "oferta_propiedad_un_tipo",
          "(valor_texto IS NULL) <> (valor_numero IS NULL)",
        ],
      ],
      necesidad_propiedad: [
        [
          "necesidad_propiedad_un_tipo",
          "(valor_texto IS NOT NULL AND minimo IS NULL AND maximo IS NULL) OR (valor_texto IS NULL AND (minimo IS NOT NULL OR maximo IS NOT NULL) AND (minimo IS NULL OR maximo IS NULL OR minimo <= maximo))",
        ],
      ],
    };
    for (const [table, entries] of Object.entries(checks))
      for (const [name, expression] of entries)
        await q.sequelize.query(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` CHECK (${expression})`,
        );
  },
  async down(q) {
    for (const table of [
      "necesidad_propiedad",
      "necesidades",
      "oferta_archivo",
      "archivos",
      "oferta_propiedad",
      "ofertas",
      "categoria_propiedad",
      "propiedades",
      "unidades",
      "categorias",
    ])
      await q.dropTable(table);
  },
};
