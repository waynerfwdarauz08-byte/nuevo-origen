const { Op, Transaction, literal, where: sqlWhere } = require("sequelize");
const { IdentityError } = require("./identity.service");
const { available, scaled } = require("./decimal");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
const missing = () => fail(404, "NOT_FOUND", "No encontramos este recurso.");
const invalid = (message) => fail(400, "MATERIAL_INVALID", message);
const same = (a, b) => String(a) === String(b);
function createMaterialsService(m) {
  const companyFields = [
    "id",
    "nombre",
    "sector",
    "descripcion",
    "ubicacion_publica",
  ];
  const companyDto = (c) =>
    Object.fromEntries(
      companyFields.map((k) => [k, k === "id" ? String(c[k]) : c[k] || ""]),
    );
  const catalogDto = (r) => ({
    id: String(r.id),
    nombre: r.nombre,
    activo: r.activo,
    ...(r.codigo ? { codigo: r.codigo, magnitud: r.magnitud } : {}),
    ...(r.tipo_dato
      ? {
          tipo_dato: r.tipo_dato,
          unidad_id: r.unidad_id ? String(r.unidad_id) : null,
        }
      : {}),
    ...(r.descripcion !== undefined
      ? { descripcion: r.descripcion || "" }
      : {}),
  });
  const baseInclude = [
    { model: m.Categoria, as: "categoria" },
    { model: m.Unidad, as: "unidad" },
    { model: m.Empresa, as: "empresa", attributes: companyFields },
  ];
  const photos = {
    model: m.Archivo,
    as: "fotos",
    where: { estado: "activo" },
    required: false,
    through: { attributes: ["orden"] },
  };
  function dto(row, kind, publicView = false) {
    const common = {
      id: String(row.id),
      categoria: catalogDto(row.categoria),
      unidad: catalogDto(row.unidad),
      titulo: row.titulo,
      ubicacion: row.ubicacion,
      estado: row.estado,
      actualizada_en: row.updated_at,
    };
    const values = row.propiedades.map((p) =>
      kind === "oferta"
        ? {
            propiedad_id: String(p.propiedad_id),
            valor_texto: p.valor_texto,
            valor_numero: p.valor_numero,
          }
        : {
            propiedad_id: String(p.propiedad_id),
            valor_texto: p.valor_texto,
            minimo: p.minimo,
            maximo: p.maximo,
          },
    );
    if (kind === "necesidad")
      return {
        ...common,
        descripcion: row.descripcion,
        cantidad: row.cantidad,
        fecha_objetivo: row.fecha_objetivo,
        propiedades: values,
      };
    return {
      ...common,
      composicion: row.composicion,
      estado_material: row.estado_material,
      cantidad_total: row.cantidad_total,
      cantidad_disponible: available(row),
      modalidad: row.modalidad,
      precio_unitario: row.precio_unitario,
      moneda: row.moneda,
      frecuencia: row.frecuencia,
      declaracion_no_peligroso: row.declaracion_no_peligroso,
      declaracion_aprovechable: row.declaracion_aprovechable,
      empresa: companyDto(row.empresa),
      propiedades: values,
      fotos: [...row.fotos]
        .sort((a, b) => a.OfertaArchivo.orden - b.OfertaArchivo.orden)
        .map((f) => ({
          id: String(f.id),
          url: `/api/${publicView ? "catalogo/" : ""}ofertas/${row.id}/fotos/${f.id}`,
        })),
      ...(!publicView
        ? {
            cantidad_reservada: row.cantidad_reservada,
            cantidad_entregada: row.cantidad_entregada,
          }
        : {}),
    };
  }
  function permit(auth, permission) {
    if (!auth.permissions.includes(permission))
      fail(403, "FORBIDDEN", "No tenés permiso para realizar esta acción.");
  }
  function business(auth, permission) {
    permit(auth, permission);
    if (!auth.company)
      fail(403, "FORBIDDEN", "Esta operación requiere una cuenta empresarial.");
  }
  function platform(auth) {
    permit(auth, "categorias.gestionar");
    if (auth.company || !auth.roles.includes("administrador_plataforma"))
      fail(
        403,
        "FORBIDDEN",
        "Solo la administración de plataforma gestiona los catálogos.",
      );
  }
  async function fresh(auth, permission, transaction) {
    const actor = await m.Usuario.findOne({
      where: {
        id: auth.user.id,
        estado: "activo",
        empresa_id: auth.company?.id || null,
      },
      include: [{ model: m.Rol, as: "roles", include: [m.Permiso] }],
      transaction,
    });
    const scope = auth.company ? "empresa" : "plataforma";
    if (
      !actor ||
      !actor.roles.some(
        (r) =>
          r.alcance === scope &&
          r.Permisos.some((p) => p.codigo === permission),
      )
    )
      fail(403, "FORBIDDEN", "Tu acceso cambió. Actualizá la sesión.");
  }
  async function manage(auth, work) {
    business(auth, "materiales.gestionar");
    return m.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (transaction) => {
        const company = await m.Empresa.findOne({
          where: { id: auth.company.id, estado: "activa" },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!company) fail(403, "FORBIDDEN", "La empresa no está activa.");
        await fresh(auth, "materiales.gestionar", transaction);
        return work(transaction);
      },
    );
  }
  async function audit(auth, action, type, id, detail, requestId, transaction) {
    return m.Auditoria.create(
      {
        actor_id: auth.user.id,
        empresa_id: auth.company?.id || null,
        accion: action,
        recurso_tipo: type,
        recurso_id: id,
        request_id: requestId,
        fecha: new Date(),
        motivo: "Gestión de materiales y catálogo",
        detalle: detail,
      },
      { transaction },
    );
  }
  function model(kind) {
    return kind === "oferta" ? m.Oferta : m.Necesidad;
  }
  function valueModel(kind) {
    return kind === "oferta" ? m.OfertaPropiedad : m.NecesidadPropiedad;
  }
  function include(kind) {
    return [
      ...baseInclude,
      { model: valueModel(kind), as: "propiedades" },
      ...(kind === "oferta" ? [photos] : []),
    ];
  }
  async function owned(auth, kind, id, transaction) {
    const row = await model(kind).findOne({
      where: { id, empresa_id: auth.company.id },
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!row) missing();
    return row;
  }
  async function load(kind, id, transaction) {
    return model(kind).findByPk(id, { include: include(kind), transaction });
  }
  async function references(data, kind, transaction, required) {
    const category = await m.Categoria.findOne({
      where: { id: data.categoria_id, activo: true },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const unit = await m.Unidad.findOne({
      where: { id: data.unidad_id, activo: true },
      transaction,
    });
    if (!category || !unit) invalid("Elegí una categoría y unidad activas.");
    const definitions = await m.CategoriaPropiedad.findAll({
      where: { categoria_id: category.id },
      transaction,
    });
    const properties = await m.Propiedad.findAll({
      where: { id: definitions.map((d) => d.propiedad_id) },
      transaction,
    });
    for (const value of data.propiedades) {
      const def = properties.find((p) => same(p.id, value.propiedad_id));
      if (!def || !def.activo)
        invalid(
          "Una propiedad no pertenece a la categoría o está desactivada.",
        );
      if (
        def.tipo_dato === "texto"
          ? !value.valor_texto
          : kind === "oferta"
            ? value.valor_numero === undefined
            : value.valor_texto !== undefined
      )
        invalid("El tipo de una propiedad no corresponde a su definición.");
      if (
        kind === "necesidad" &&
        value.minimo !== undefined &&
        value.maximo !== undefined &&
        scaled(value.minimo, 4) > scaled(value.maximo, 4)
      )
        invalid("El mínimo de una propiedad no puede superar su máximo.");
    }
    if (
      required &&
      definitions.some(
        (d) =>
          d.requerida &&
          !data.propiedades.some((v) => same(v.propiedad_id, d.propiedad_id)),
      )
    )
      invalid("Completá las propiedades obligatorias de la categoría.");
  }
  async function replaceValues(row, data, kind, transaction) {
    const Model = valueModel(kind),
      key = kind === "oferta" ? "oferta_id" : "necesidad_id";
    await Model.destroy({ where: { [key]: row.id }, transaction });
    if (data.propiedades.length)
      await Model.bulkCreate(
        data.propiedades.map((v) => ({ ...v, [key]: row.id })),
        { transaction },
      );
  }
  async function publishable(row, data, kind, transaction) {
    await references(data, kind, transaction, true);
    if (kind === "oferta") {
      if (!data.declaracion_no_peligroso || !data.declaracion_aprovechable)
        invalid(
          "Confirmá que el material es aprovechable y no peligroso. No se admiten materiales que requieran tratamiento especializado.",
        );
      const photos = await m.OfertaArchivo.count({
        where: { oferta_id: row.id },
        include: [],
        transaction,
      });
      const [count] = await m.sequelize.query(
        "SELECT COUNT(*) AS total FROM oferta_archivo oa JOIN archivos a ON a.id=oa.archivo_id WHERE oa.oferta_id=:id AND a.estado=:estado",
        { replacements: { id: row.id, estado: "activo" }, transaction },
      );
      if (!photos || Number(count[0].total) < 1)
        invalid(
          "Agregá al menos una fotografía real del material antes de publicar.",
        );
      if (
        scaled(data.cantidad_total) <
        scaled(row.cantidad_reservada) + scaled(row.cantidad_entregada)
      )
        invalid("La cantidad no puede ser menor a lo reservado o entregado.");
    }
  }
  function filters(input) {
    const where = {};
    for (const k of [
      "categoria_id",
      "unidad_id",
      "modalidad",
      "estado_material",
      "frecuencia",
    ])
      if (input[k]) where[k] = input[k];
    const escape = (s) => s.replace(/[\\%_]/g, "\\$&");
    if (input.q) where.titulo = { [Op.like]: `%${escape(input.q)}%` };
    if (input.ubicacion)
      where.ubicacion = { [Op.like]: `%${escape(input.ubicacion)}%` };
    if (input.minimo !== undefined)
      where[Op.and] = [
        sqlWhere(
          literal("cantidad_total - cantidad_reservada - cantidad_entregada"),
          { [Op.gte]: input.minimo },
        ),
      ];
    return where;
  }
  return {
    business,
    platform,
    manage,
    owned,
    audit,
    load,
    dto,
    async metadata(auth, all = false) {
      if (all) platform(auth);
      const where = all ? {} : { activo: true };
      const [categories, units, properties] = await Promise.all([
        m.Categoria.findAll({
          where,
          order: [["nombre", "ASC"]],
          include: [
            {
              model: m.Propiedad,
              as: "propiedades",
              through: { attributes: ["requerida"] },
            },
          ],
        }),
        m.Unidad.findAll({ order: [["nombre", "ASC"]] }),
        m.Propiedad.findAll({ order: [["nombre", "ASC"]] }),
      ]);
      return {
        categorias: categories.map((c) => ({
          ...catalogDto(c),
          propiedades: c.propiedades
            .filter((p) => all || p.activo)
            .map((p) => ({
              ...catalogDto(p),
              requerida: p.CategoriaPropiedad.requerida,
            })),
        })),
        unidades: units.map(catalogDto),
        propiedades: properties.map(catalogDto),
      };
    },
    async saveCatalog(auth, kind, id, data, requestId) {
      platform(auth);
      try {
        return await m.sequelize.transaction(async (transaction) => {
          await m.Rol.findOne({
            where: { codigo: "administrador_plataforma" },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          await fresh(auth, "categorias.gestionar", transaction);
          const Model = {
            categorias: m.Categoria,
            unidades: m.Unidad,
            propiedades: m.Propiedad,
          }[kind];
          let row = id
            ? await Model.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
              })
            : null;
          if (id && !row) missing();
          if (
            row &&
            ((kind === "unidades" &&
              (row.codigo !== data.codigo || row.magnitud !== data.magnitud)) ||
              (kind === "propiedades" &&
                (row.tipo_dato !== data.tipo_dato ||
                  !same(row.unidad_id, data.unidad_id))))
          )
            invalid(
              "Código, magnitud y tipo de medida son inmutables. Creá una definición nueva.",
            );
          if (
            kind === "propiedades" &&
            data.unidad_id &&
            !(await m.Unidad.findOne({
              where: { id: data.unidad_id, activo: true },
              transaction,
            }))
          )
            invalid("La unidad de la propiedad no está activa.");
          const before = row ? catalogDto(row) : null;
          row = row
            ? await row.update(data, { transaction })
            : await Model.create(data, { transaction });
          await audit(
            auth,
            "catalogo." + (id ? "editado" : "creado"),
            kind,
            row.id,
            { antes: before, despues: catalogDto(row) },
            requestId,
            transaction,
          );
          return catalogDto(row);
        });
      } catch (e) {
        if (e.name === "SequelizeUniqueConstraintError")
          fail(
            409,
            "CATALOG_DUPLICATE",
            "Ya existe una definición con ese nombre o código.",
          );
        throw e;
      }
    },
    async mapProperties(auth, id, data, requestId) {
      platform(auth);
      return m.sequelize.transaction(async (transaction) => {
        await m.Rol.findOne({
          where: { codigo: "administrador_plataforma" },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        await fresh(auth, "categorias.gestionar", transaction);
        const c = await m.Categoria.findByPk(id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!c) missing();
        const properties = await m.Propiedad.findAll({
          where: {
            id: data.propiedades.map((p) => p.propiedad_id),
            activo: true,
          },
          transaction,
        });
        if (properties.length !== data.propiedades.length)
          invalid("Seleccioná propiedades activas.");
        await m.CategoriaPropiedad.destroy({
          where: { categoria_id: id },
          transaction,
        });
        if (data.propiedades.length)
          await m.CategoriaPropiedad.bulkCreate(
            data.propiedades.map((p) => ({ ...p, categoria_id: id })),
            { transaction },
          );
        await audit(
          auth,
          "catalogo.plantilla",
          "categorias",
          id,
          { propiedades: data.propiedades },
          requestId,
          transaction,
        );
        return { propiedades: data.propiedades };
      });
    },
    async create(auth, kind, data, requestId) {
      return manage(auth, async (transaction) => {
        await references(data, kind, transaction, false);
        const { propiedades, ...fields } = data;
        const row = await model(kind).create(
          {
            ...fields,
            empresa_id: auth.company.id,
            autor_id: auth.user.id,
            estado: "borrador",
          },
          { transaction },
        );
        await replaceValues(row, data, kind, transaction);
        await audit(
          auth,
          kind + ".creada",
          kind,
          row.id,
          { estado: "borrador" },
          requestId,
          transaction,
        );
        return dto(await load(kind, row.id, transaction), kind);
      });
    },
    async update(auth, kind, id, data, requestId) {
      return manage(auth, async (transaction) => {
        const row = await owned(auth, kind, id, transaction);
        if (
          kind === "oferta" &&
          !same(row.unidad_id, data.unidad_id) &&
          (scaled(row.cantidad_reservada) > 0n ||
            scaled(row.cantidad_entregada) > 0n)
        )
          invalid(
            "No podés cambiar la unidad de una oferta con reservas o entregas.",
          );
        if (["archivada", "cerrada", "agotada"].includes(row.estado))
          fail(
            409,
            "MATERIAL_READ_ONLY",
            "Esta ficha ya está cerrada o archivada.",
          );
        if (
          kind === "oferta" &&
          scaled(data.cantidad_total) <
            scaled(row.cantidad_reservada) + scaled(row.cantidad_entregada)
        )
          invalid("La cantidad no puede ser menor a lo reservado o entregado.");
        if (["publicada", "activa"].includes(row.estado))
          await publishable(row, data, kind, transaction);
        else await references(data, kind, transaction, false);
        const { propiedades, ...fields } = data;
        await row.update(fields, { transaction });
        await replaceValues(row, data, kind, transaction);
        await audit(
          auth,
          kind + ".editada",
          kind,
          id,
          { estado: row.estado },
          requestId,
          transaction,
        );
        return dto(await load(kind, id, transaction), kind);
      });
    },
    async state(auth, kind, id, data, requestId) {
      return manage(auth, async (transaction) => {
        const row = await owned(auth, kind, id, transaction);
        const transitions =
          kind === "oferta"
            ? {
                borrador: ["publicada", "archivada"],
                publicada: ["pausada", "archivada"],
                pausada: ["publicada", "archivada"],
                agotada: ["archivada"],
                archivada: [],
              }
            : {
                borrador: ["activa", "archivada"],
                activa: ["pausada", "cerrada", "archivada"],
                pausada: ["activa", "cerrada", "archivada"],
                cerrada: ["archivada"],
                archivada: [],
              };
        if (!transitions[row.estado]?.includes(data.estado))
          fail(
            409,
            "INVALID_TRANSITION",
            "Ese cambio de estado no está permitido.",
          );
        if (["publicada", "activa"].includes(data.estado)) {
          const full = await load(kind, id, transaction);
          await publishable(
            row,
            {
              ...full.get({ plain: true }),
              propiedades: full.propiedades.map((p) =>
                kind === "oferta"
                  ? {
                      propiedad_id: String(p.propiedad_id),
                      ...(p.valor_texto !== null
                        ? { valor_texto: p.valor_texto }
                        : { valor_numero: p.valor_numero }),
                    }
                  : {
                      propiedad_id: String(p.propiedad_id),
                      ...(p.valor_texto !== null
                        ? { valor_texto: p.valor_texto }
                        : {
                            ...(p.minimo !== null ? { minimo: p.minimo } : {}),
                            ...(p.maximo !== null ? { maximo: p.maximo } : {}),
                          }),
                    },
              ),
            },
            kind,
            transaction,
          );
        }
        const before = row.estado;
        await row.update({ estado: data.estado }, { transaction });
        await audit(
          auth,
          kind + ".estado",
          kind,
          id,
          { antes: before, despues: data.estado, motivo: data.motivo },
          requestId,
          transaction,
        );
        return dto(await load(kind, id, transaction), kind);
      });
    },
    async get(auth, kind, id) {
      business(auth, "materiales.leer");
      await owned(auth, kind, id);
      return dto(await load(kind, id), kind);
    },
    async list(auth, kind, input) {
      business(auth, "materiales.leer");
      const where = { empresa_id: auth.company.id };
      if (input.q)
        where.titulo = { [Op.like]: `%${input.q.replace(/[\\%_]/g, "\\$&")}%` };
      const total = await model(kind).count({ where });
      const rows = await model(kind).findAll({
        where,
        include: include(kind),
        order: [["id", "DESC"]],
        limit: 12,
        offset: (input.pagina - 1) * 12,
      });
      return {
        registros: rows.map((r) => dto(r, kind)),
        pagina: input.pagina,
        total,
        paginas: Math.max(1, Math.ceil(total / 12)),
      };
    },
    async publicList(input) {
      const where = { ...filters(input), estado: "publicada" };
      where[Op.and] = [
        ...(where[Op.and] || []),
        sqlWhere(
          literal("cantidad_total - cantidad_reservada - cantidad_entregada"),
          { [Op.gt]: 0 },
        ),
      ];
      const publicIncludes = include("oferta").map((i) =>
        i.as === "empresa"
          ? { ...i, where: { estado: "activa" }, required: true }
          : i,
      );
      const total = await m.Oferta.count({
        where,
        include: [publicIncludes.find((i) => i.as === "empresa")],
        distinct: true,
      });
      const rows = await m.Oferta.findAll({
        where,
        include: publicIncludes,
        order:
          input.orden === "titulo"
            ? [
                ["titulo", "ASC"],
                ["id", "DESC"],
              ]
            : [["id", "DESC"]],
        limit: 12,
        offset: (input.pagina - 1) * 12,
        subQuery: true,
      });
      return {
        ofertas: rows.map((r) => dto(r, "oferta", true)),
        pagina: input.pagina,
        total,
        paginas: Math.max(1, Math.ceil(total / 12)),
      };
    },
    async publicGet(id) {
      const row = await m.Oferta.findOne({
        where: { id, estado: "publicada" },
        include: include("oferta").map((i) =>
          i.as === "empresa"
            ? { ...i, where: { estado: "activa" }, required: true }
            : i,
        ),
      });
      if (!row || scaled(available(row)) <= 0n) missing();
      return dto(row, "oferta", true);
    },
    async publicCompany(id) {
      const row = await m.Empresa.findOne({
        where: { id, estado: "activa" },
        attributes: companyFields,
      });
      if (
        !row ||
        !(await m.Oferta.count({
          where: { empresa_id: id, estado: "publicada" },
        }))
      )
        missing();
      return companyDto(row);
    },
    async authorizePhoto(auth, offerId, fileId, publicView) {
      let offer;
      if (publicView) {
        offer = await m.Oferta.findOne({
          where: { id: offerId, estado: "publicada" },
          include: [
            {
              model: m.Empresa,
              as: "empresa",
              where: { estado: "activa" },
              attributes: ["id"],
              required: true,
            },
          ],
        });
        if (!offer || scaled(available(offer)) <= 0n) missing();
      } else {
        business(auth, "materiales.leer");
        offer = await owned(auth, "oferta", offerId);
      }
      const link = await m.OfertaArchivo.findOne({
        where: { oferta_id: offer.id, archivo_id: fileId },
      });
      const file =
        link &&
        (await m.Archivo.findOne({
          where: { id: fileId, empresa_id: offer.empresa_id, estado: "activo" },
        }));
      if (!file) missing();
      return file;
    },
    async attachPhoto(auth, id, file, requestId) {
      return manage(auth, async (transaction) => {
        const row = await owned(auth, "oferta", id, transaction);
        if (!["borrador", "pausada"].includes(row.estado))
          fail(
            409,
            "PHOTO_STATE",
            "Pausá la oferta antes de cambiar sus fotografías.",
          );
        const links = await m.OfertaArchivo.findAll({
          where: { oferta_id: id },
          transaction,
        });
        const active = links.length
          ? await m.Archivo.count({
              where: { id: links.map((l) => l.archivo_id), estado: "activo" },
              transaction,
            })
          : 0;
        if (active >= 6)
          invalid("Se permiten hasta seis fotografías por oferta.");
        const photo = await m.Archivo.create(
          {
            ...file,
            empresa_id: auth.company.id,
            visibilidad: "privada",
            estado: "activo",
          },
          { transaction },
        );
        await m.OfertaArchivo.create(
          { oferta_id: id, archivo_id: photo.id, orden: links.length },
          { transaction },
        );
        await audit(
          auth,
          "oferta.foto_agregada",
          "oferta",
          id,
          { archivo_id: String(photo.id) },
          requestId,
          transaction,
        );
        return dto(await load("oferta", id, transaction), "oferta");
      });
    },
    async removePhoto(auth, id, fileId, requestId) {
      return manage(auth, async (transaction) => {
        const row = await owned(auth, "oferta", id, transaction);
        if (!["borrador", "pausada"].includes(row.estado))
          fail(
            409,
            "PHOTO_STATE",
            "Pausá la oferta antes de retirar fotografías.",
          );
        const link = await m.OfertaArchivo.findOne({
          where: { oferta_id: id, archivo_id: fileId },
          transaction,
        });
        const file =
          link &&
          (await m.Archivo.findOne({
            where: {
              id: fileId,
              empresa_id: auth.company.id,
              estado: "activo",
            },
            transaction,
          }));
        if (!file) missing();
        await file.update(
          { estado: "retirado", visibilidad: "privada" },
          { transaction },
        );
        await audit(
          auth,
          "oferta.foto_retirada",
          "oferta",
          id,
          { archivo_id: String(file.id) },
          requestId,
          transaction,
        );
        return dto(await load("oferta", id, transaction), "oferta");
      });
    },
  };
}
module.exports = { createMaterialsService };
