module.exports = {
  async up(q, S) {
    const id = () => ({
        type: S.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      }),
      fk = (model, nullable = false) => ({
        type: S.BIGINT.UNSIGNED,
        allowNull: nullable,
        references: { model, key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      }),
      text = (n) => ({ type: S.STRING(n), allowNull: false }),
      dates = () => ({
        created_at: { type: S.DATE, allowNull: false },
        updated_at: { type: S.DATE, allowNull: false },
      });
    await q.createTable("solicitudes", {
      id: id(),
      oferta_id: fk("ofertas"),
      necesidad_id: fk("necesidades", true),
      solicitante_empresa_id: fk("empresas"),
      creador_id: fk("usuarios"),
      cantidad: { type: S.DECIMAL(14, 3), allowNull: false },
      propuesta: { type: S.TEXT, allowNull: false },
      estado: text(30),
      version: { type: S.INTEGER.UNSIGNED, allowNull: false },
      proponente_empresa_id: fk("empresas"),
      condiciones_json: { type: S.JSON, allowNull: false },
      ...dates(),
    });
    await q.addIndex("solicitudes", ["solicitante_empresa_id", "estado", "id"]);
    await q.addIndex("solicitudes", ["oferta_id", "estado"]);
    await q.createTable("acuerdos", {
      id: id(),
      solicitud_id: { ...fk("solicitudes"), unique: true },
      modalidad: text(20),
      condiciones: { type: S.TEXT, allowNull: false },
      fecha_prevista: S.DATE,
      estado: text(40),
      version_aceptada: { type: S.INTEGER.UNSIGNED, allowNull: false },
      ...dates(),
    });
    await q.createTable("acuerdo_lineas", {
      id: id(),
      acuerdo_id: fk("acuerdos"),
      oferta_id: fk("ofertas"),
      unidad_id: fk("unidades"),
      empresa_oferente_id: fk("empresas"),
      empresa_receptora_id: fk("empresas"),
      cantidad: { type: S.DECIMAL(14, 3), allowNull: false },
      precio_unitario_acordado: S.DECIMAL(14, 2),
      moneda: S.CHAR(3),
      ficha_json: { type: S.JSON, allowNull: false },
    });
    await q.addConstraint("acuerdo_lineas", {
      fields: ["acuerdo_id", "oferta_id"],
      type: "unique",
      name: "acuerdo_linea_oferta_unique",
    });
    await q.createTable("mensajes", {
      id: id(),
      solicitud_id: fk("solicitudes"),
      autor_id: fk("usuarios"),
      contenido: { type: S.TEXT, allowNull: false },
      enviado_en: { type: S.DATE, allowNull: false },
    });
    await q.addIndex("mensajes", ["solicitud_id", "id"]);
    await q.createTable("historial_estados", {
      id: id(),
      solicitud_id: fk("solicitudes", true),
      acuerdo_id: fk("acuerdos", true),
      actor_id: fk("usuarios"),
      estado_anterior: S.STRING(40),
      estado_nuevo: text(40),
      motivo: S.TEXT,
      fecha: { type: S.DATE, allowNull: false },
    });
    await q.createTable("entregas", {
      id: id(),
      acuerdo_id: fk("acuerdos"),
      clave_idempotencia: { ...text(80), unique: true },
      entrada_hash: { type: S.CHAR(64), allowNull: false },
      fecha: { type: S.DATE, allowNull: false },
      estado: text(40),
      creador_id: fk("usuarios"),
      ...dates(),
    });
    await q.createTable("entrega_lineas", {
      id: id(),
      entrega_id: fk("entregas"),
      acuerdo_linea_id: fk("acuerdo_lineas"),
      cantidad: { type: S.DECIMAL(14, 3), allowNull: false },
      masa_kg: S.DECIMAL(14, 3),
      metodo_masa: S.STRING(20),
      factor_kg: S.DECIMAL(14, 6),
      fuente_factor: S.STRING(255),
    });
    await q.addConstraint("entrega_lineas", {
      fields: ["entrega_id", "acuerdo_linea_id"],
      type: "unique",
      name: "entrega_linea_unique",
    });
    await q.createTable("confirmaciones", {
      id: id(),
      entrega_id: fk("entregas"),
      empresa_id: fk("empresas"),
      usuario_id: fk("usuarios"),
      tipo: text(30),
      conforme: { type: S.BOOLEAN, allowNull: false },
      observacion: S.TEXT,
      fecha: { type: S.DATE, allowNull: false },
    });
    await q.addConstraint("confirmaciones", {
      fields: ["entrega_id", "empresa_id", "tipo"],
      type: "unique",
      name: "confirmacion_empresa_tipo_unique",
    });
    await q.createTable("entrega_evidencias", {
      entrega_id: { ...fk("entregas"), primaryKey: true },
      archivo_id: { ...fk("archivos"), primaryKey: true },
      descripcion: S.STRING(255),
    });
    await q.createTable("incidencias", {
      id: id(),
      reportante_id: fk("usuarios", true),
      oferta_id: fk("ofertas", true),
      acuerdo_id: fk("acuerdos", true),
      entrega_id: fk("entregas", true),
      motivo: { type: S.TEXT, allowNull: false },
      estado: text(30),
      resolucion: S.TEXT,
      revisor_id: fk("usuarios", true),
      ...dates(),
    });
    await q.createTable("notificaciones", {
      id: id(),
      usuario_id: fk("usuarios"),
      tipo: text(40),
      canal: text(20),
      evento_clave: text(120),
      estado: text(30),
      leida_en: S.DATE,
      ruta: text(200),
      creada_en: { type: S.DATE, allowNull: false },
    });
    await q.addConstraint("notificaciones", {
      fields: ["usuario_id", "canal", "evento_clave"],
      type: "unique",
      name: "aviso_evento_unique",
    });
    for (const [table, name, expr] of [
      ["solicitudes", "solicitud_cantidad_positiva", "cantidad > 0"],
      ["acuerdo_lineas", "acuerdo_linea_cantidad_positiva", "cantidad > 0"],
      [
        "entrega_lineas",
        "entrega_linea_cantidad_positiva",
        "cantidad > 0 AND (masa_kg IS NULL OR masa_kg >= 0)",
      ],
      [
        "historial_estados",
        "historial_referencia_unica",
        "(solicitud_id IS NULL) <> (acuerdo_id IS NULL)",
      ],
    ])
      await q.addConstraint(table, {
        fields: [],
        type: "check",
        where: S.literal(expr),
        name,
      });
  },
  async down(q) {
    for (const table of [
      "notificaciones",
      "incidencias",
      "entrega_evidencias",
      "confirmaciones",
      "entrega_lineas",
      "entregas",
      "historial_estados",
      "mensajes",
      "acuerdo_lineas",
      "acuerdos",
      "solicitudes",
    ])
      await q.dropTable(table);
  },
};
