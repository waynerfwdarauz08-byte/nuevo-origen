const { Op, Transaction } = require("sequelize");
const { createHash } = require("node:crypto");
const { IdentityError } = require("./identity.service");
const { scaled, format, available } = require("./decimal");
const fail = (status, code, message) => {
    throw new IdentityError(status, code, message);
  },
  missing = () => fail(404, "NOT_FOUND", "No encontramos este recurso."),
  conflict = (message) => fail(409, "OPERATION_CONFLICT", message),
  bad = (message) => fail(400, "INVALID_OPERATION", message),
  same = (a, b) => String(a) === String(b);
function createOperationsService(m) {
  const offerInc = {
    model: m.Oferta,
    as: "oferta",
    attributes: ["id", "empresa_id", "titulo"],
  };
  const requestInc = [
    offerInc,
    { model: m.Empresa, as: "solicitante", attributes: ["id", "nombre"] },
    { model: m.Acuerdo, as: "acuerdo", attributes: ["id", "estado"] },
  ];
  const deliveryInc = [
    { model: m.EntregaLinea, as: "lineas" },
    { model: m.Confirmacion, as: "confirmaciones" },
    {
      model: m.Archivo,
      as: "evidencias",
      where: { estado: "activo" },
      required: false,
      through: { attributes: ["descripcion"] },
    },
  ];
  function permission(auth, code = "acuerdos.gestionar") {
    if (!auth.company || !auth.permissions.includes(code))
      fail(
        403,
        "FORBIDDEN",
        "Tu función no permite esta operación empresarial.",
      );
  }
  async function actor(auth, t, code = "acuerdos.gestionar") {
    const user = await m.Usuario.findOne({
      where: {
        id: auth.user.id,
        empresa_id: auth.company.id,
        estado: "activo",
      },
      include: [{ model: m.Rol, as: "roles", include: [m.Permiso] }],
      transaction: t,
    });
    if (
      !user ||
      !user.roles.some(
        (r) =>
          r.alcance === "empresa" && r.Permisos.some((p) => p.codigo === code),
      )
    )
      fail(403, "FORBIDDEN", "Tu acceso cambió. Actualizá la sesión.");
  }
  async function companies(ids, t) {
    for (const id of [...new Set(ids.map(String))].sort((a, b) =>
      BigInt(a) < BigInt(b) ? -1 : 1,
    )) {
      if (
        !(await m.Empresa.findOne({
          where: { id, estado: "activa" },
          transaction: t,
          lock: t.LOCK.UPDATE,
        }))
      )
        conflict("Una empresa participante no está activa.");
    }
  }
  const tx = (work) =>
    m.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      work,
    );
  async function audit(auth, action, type, id, detail, rid, t) {
    await m.Auditoria.create(
      {
        actor_id: auth.user.id,
        empresa_id: auth.company.id,
        accion: action,
        recurso_tipo: type,
        recurso_id: id,
        request_id: rid,
        fecha: new Date(),
        motivo: "Operación empresarial confirmada por usuario",
        detalle: detail,
      },
      { transaction: t },
    );
  }
  async function history(auth, kind, id, before, after, reason, t) {
    await m.HistorialEstado.create(
      {
        solicitud_id: kind === "solicitud" ? id : null,
        acuerdo_id: kind === "acuerdo" ? id : null,
        actor_id: auth.user.id,
        estado_anterior: before,
        estado_nuevo: after,
        motivo: reason,
        fecha: new Date(),
      },
      { transaction: t },
    );
  }
  async function notify(ids, type, key, route, t) {
    const users = await m.Usuario.findAll({
      where: { empresa_id: ids, estado: "activo" },
      attributes: ["id"],
      include: [
        {
          model: m.Rol,
          as: "roles",
          attributes: [],
          required: true,
          through: { attributes: [] },
          where: { alcance: "empresa" },
          include: [
            {
              model: m.Permiso,
              attributes: [],
              through: { attributes: [] },
              required: true,
              where: { codigo: "acuerdos.gestionar" },
            },
          ],
        },
      ],
      transaction: t,
    });
    for (const user of users)
      await m.Notificacion.create(
        {
          usuario_id: user.id,
          tipo: type,
          canal: "interfaz",
          evento_clave: key,
          estado: "pendiente",
          ruta: route,
          creada_en: new Date(),
        },
        { transaction: t },
      );
  }
  async function requestAccess(auth, id, t) {
    permission(auth);
    const row = await m.Solicitud.findByPk(id, {
      include: [offerInc],
      transaction: t,
    });
    if (
      !row ||
      (!same(row.solicitante_empresa_id, auth.company.id) &&
        !same(row.oferta.empresa_id, auth.company.id))
    )
      missing();
    return row;
  }
  async function withRequest(auth, id, work) {
    const initial = await requestAccess(auth, id);
    return tx(async (t) => {
      await companies(
        [initial.solicitante_empresa_id, initial.oferta.empresa_id],
        t,
      );
      await actor(auth, t);
      const r = await m.Solicitud.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      return work(r, initial.oferta.empresa_id, t);
    });
  }
  async function agreementAccess(auth, id, t) {
    permission(auth);
    const agreement = await m.Acuerdo.findByPk(id, { transaction: t });
    if (!agreement) missing();
    const r = await requestAccess(auth, agreement.solicitud_id, t);
    return { agreement, request: r };
  }
  async function withAgreement(auth, id, work) {
    const initial = await agreementAccess(auth, id);
    return withRequest(auth, initial.request.id, async (r, owner, t) => {
      const a = await m.Acuerdo.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      return work(a, r, owner, t);
    });
  }
  async function withDelivery(auth, id, work) {
    const d = await m.Entrega.findByPk(id);
    if (!d) missing();
    return withAgreement(auth, d.acuerdo_id, async (a, r, owner, t) => {
      const row = await m.Entrega.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      return work(row, a, r, owner, t);
    });
  }
  async function requestDto(id, t) {
    const r = await m.Solicitud.findByPk(id, {
      include: requestInc,
      transaction: t,
    });
    return {
      id: String(r.id),
      oferta_id: String(r.oferta_id),
      titulo: r.oferta.titulo,
      empresa_oferente_id: String(r.oferta.empresa_id),
      solicitante: {
        id: String(r.solicitante.id),
        nombre: r.solicitante.nombre,
      },
      necesidad_id: r.necesidad_id ? String(r.necesidad_id) : null,
      cantidad: r.cantidad,
      condiciones: r.propuesta,
      estado: r.estado,
      version: r.version,
      proponente_empresa_id: String(r.proponente_empresa_id),
      propuesta: r.condiciones_json,
      acuerdo: r.acuerdo
        ? { id: String(r.acuerdo.id), estado: r.acuerdo.estado }
        : null,
      creada_en: r.created_at,
      actualizada_en: r.updated_at,
    };
  }
  function deliveryDto(d) {
    return {
      id: String(d.id),
      acuerdo_id: String(d.acuerdo_id),
      fecha: d.fecha,
      estado: d.estado,
      lineas: d.lineas.map((l) => ({
        id: String(l.id),
        acuerdo_linea_id: String(l.acuerdo_linea_id),
        cantidad: l.cantidad,
        masa_kg: l.masa_kg,
        metodo_masa: l.metodo_masa,
        factor_kg: l.factor_kg,
        fuente_factor: l.fuente_factor,
      })),
      confirmaciones: d.confirmaciones.map((c) => ({
        empresa_id: String(c.empresa_id),
        tipo: c.tipo,
        conforme: c.conforme,
        observacion: c.observacion || "",
        fecha: c.fecha,
      })),
      evidencias: d.evidencias.map((f) => ({
        id: String(f.id),
        descripcion: f.EntregaEvidencia.descripcion || "",
        url: `/api/entregas/${d.id}/evidencias/${f.id}`,
      })),
    };
  }
  async function loadDelivery(id, t) {
    return m.Entrega.findByPk(id, { include: deliveryInc, transaction: t });
  }
  async function agreementDto(id, t) {
    const a = await m.Acuerdo.findByPk(id, {
      include: [
        { model: m.AcuerdoLinea, as: "lineas" },
        { model: m.Entrega, as: "entregas", include: deliveryInc },
      ],
      transaction: t,
    });
    return {
      id: String(a.id),
      solicitud_id: String(a.solicitud_id),
      modalidad: a.modalidad,
      condiciones: a.condiciones,
      fecha_prevista: a.fecha_prevista,
      estado: a.estado,
      version_aceptada: a.version_aceptada,
      lineas: a.lineas.map((l) => ({
        id: String(l.id),
        oferta_id: String(l.oferta_id),
        unidad_id: String(l.unidad_id),
        empresa_oferente_id: String(l.empresa_oferente_id),
        empresa_receptora_id: String(l.empresa_receptora_id),
        cantidad: l.cantidad,
        cantidad_pendiente_registro: format(
          scaled(l.cantidad) -
            a.entregas
              .filter((d) => d.estado !== "anulada")
              .flatMap((d) => d.lineas)
              .filter((x) => same(x.acuerdo_linea_id, l.id))
              .reduce((n, x) => n + scaled(x.cantidad), 0n),
        ),
        precio_unitario_acordado: l.precio_unitario_acordado,
        moneda: l.moneda,
        ficha: l.ficha_json,
      })),
      entregas: a.entregas.map(deliveryDto),
      creado_en: a.created_at,
    };
  }
  async function offerLocks(ids, t) {
    const map = new Map();
    for (const id of [...new Set(ids.map(String))].sort((a, b) =>
      BigInt(a) < BigInt(b) ? -1 : 1,
    )) {
      const o = await m.Oferta.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!o) missing();
      map.set(String(id), o);
    }
    return map;
  }
  async function proposal(offerId, requester, owner, data, t) {
    const ids = [
        offerId,
        ...(data.oferta_intercambio_id ? [data.oferta_intercambio_id] : []),
      ],
      offers = await offerLocks(ids, t),
      main = offers.get(String(offerId));
    if (!same(main.empresa_id, owner) || same(owner, requester))
      bad("No podés solicitar materiales a tu propia empresa.");
    const lines = [];
    async function line(o, qty, receiver, override = false) {
      if (o.estado !== "publicada" || scaled(available(o)) < scaled(qty))
        conflict("La oferta no está publicada o no tiene cantidad suficiente.");
      const unit = await m.Unidad.findByPk(o.unidad_id, { transaction: t });
      const props = await m.OfertaPropiedad.findAll({
        where: { oferta_id: o.id },
        transaction: t,
      });
      const sale = o.modalidad === "venta";
      if (
        !sale &&
        override &&
        (data.precio_unitario_acordado != null || data.moneda != null)
      )
        bad("Donación e intercambio no admiten precio.");
      const price =
        override && data.precio_unitario_acordado !== undefined
          ? data.precio_unitario_acordado
          : o.precio_unitario;
      const currency =
        override && data.moneda !== undefined ? data.moneda : o.moneda;
      if (sale && (price === null || currency === null))
        bad("La venta requiere precio y moneda.");
      lines.push({
        oferta_id: String(o.id),
        unidad_id: String(o.unidad_id),
        empresa_oferente_id: String(o.empresa_id),
        empresa_receptora_id: String(receiver),
        cantidad: format(scaled(qty)),
        precio_unitario_acordado: sale ? price : null,
        moneda: sale ? currency : null,
        ficha: {
          titulo: o.titulo,
          composicion: o.composicion,
          estado_material: o.estado_material,
          unidad: unit.codigo,
          propiedades: props.map((p) => ({
            propiedad_id: String(p.propiedad_id),
            valor_texto: p.valor_texto,
            valor_numero: p.valor_numero,
          })),
        },
      });
    }
    await line(main, data.cantidad, requester, true);
    if (main.modalidad === "intercambio") {
      if (
        !data.oferta_intercambio_id ||
        !data.cantidad_intercambio ||
        same(data.oferta_intercambio_id, offerId)
      )
        bad("El intercambio requiere otra oferta propia y su cantidad.");
      const other = offers.get(data.oferta_intercambio_id);
      if (
        !same(other.empresa_id, requester) ||
        other.modalidad !== "intercambio"
      )
        bad(
          "La contraprestación debe ser una oferta de intercambio de la empresa solicitante.",
        );
      await line(other, data.cantidad_intercambio, owner);
    } else if (data.oferta_intercambio_id || data.cantidad_intercambio)
      bad("Esta modalidad no admite una segunda oferta.");
    return {
      modalidad: main.modalidad,
      fecha_prevista: data.fecha_prevista,
      condiciones: data.condiciones,
      lineas: lines,
    };
  }
  async function refreshAgreement(a, auth, rid, t) {
    if (a.estado === "cancelado") return;
    const lines = await m.AcuerdoLinea.findAll({
        where: { acuerdo_id: a.id },
        transaction: t,
      }),
      deliveries = await m.Entrega.findAll({
        where: { acuerdo_id: a.id, estado: { [Op.ne]: "anulada" } },
        include: [{ model: m.EntregaLinea, as: "lineas" }],
        transaction: t,
      });
    const complete = lines.every(
      (l) =>
        deliveries
          .filter((d) =>
            ["entregada", "aprovechamiento_confirmado"].includes(d.estado),
          )
          .flatMap((d) => d.lineas)
          .filter((x) => same(x.acuerdo_linea_id, l.id))
          .reduce((n, x) => n + scaled(x.cantidad), 0n) === scaled(l.cantidad),
    );
    const allUsed =
      complete &&
      deliveries.length &&
      deliveries.every((d) => d.estado === "aprovechamiento_confirmado");
    const state = allUsed
      ? "aprovechamiento_confirmado"
      : complete
        ? "entregado"
        : deliveries.length
          ? "entrega_pendiente"
          : "confirmado";
    if (state !== a.estado) {
      const before = a.estado;
      await a.update({ estado: state }, { transaction: t });
      await history(
        auth,
        "acuerdo",
        a.id,
        before,
        state,
        "Estado derivado de entregas y confirmaciones",
        t,
      );
    }
  }
  return {
    permission,
    actor,
    companies,
    tx,
    audit,
    notify,
    requestAccess,
    withRequest,
    agreementAccess,
    withAgreement,
    withDelivery,
    requestDto,
    agreementDto,
    deliveryDto,
    loadDelivery,
    offerLocks,
    refreshAgreement,
    async create(auth, data, rid) {
      permission(auth);
      const first = await m.Oferta.findByPk(data.oferta_id, {
        attributes: ["id", "empresa_id"],
      });
      if (!first) missing();
      return tx(async (t) => {
        await companies([auth.company.id, first.empresa_id], t);
        await actor(auth, t);
        const p = await proposal(
          first.id,
          auth.company.id,
          first.empresa_id,
          data,
          t,
        );
        if (data.necesidad_id) {
          const n = await m.Necesidad.findOne({
            where: {
              id: data.necesidad_id,
              empresa_id: auth.company.id,
              estado: "activa",
            },
            transaction: t,
          });
          if (!n) missing();
          const o = await m.Oferta.findByPk(first.id, { transaction: t });
          if (
            !same(n.categoria_id, o.categoria_id) ||
            !same(n.unidad_id, o.unidad_id)
          )
            bad(
              "La necesidad y oferta deben usar categoría y unidad compatibles.",
            );
        }
        const r = await m.Solicitud.create(
          {
            oferta_id: first.id,
            necesidad_id: data.necesidad_id,
            solicitante_empresa_id: auth.company.id,
            creador_id: auth.user.id,
            cantidad: format(scaled(data.cantidad)),
            propuesta: data.condiciones,
            estado: "enviada",
            version: 1,
            proponente_empresa_id: auth.company.id,
            condiciones_json: p,
          },
          { transaction: t },
        );
        await history(
          auth,
          "solicitud",
          r.id,
          null,
          "enviada",
          "Solicitud creada sin reserva",
          t,
        );
        await audit(
          auth,
          "solicitud.creada",
          "solicitud",
          r.id,
          { version: 1 },
          rid,
          t,
        );
        await notify(
          [first.empresa_id],
          "solicitud_nueva",
          "solicitud:" + r.id,
          `/mi-espacio/solicitudes/${r.id}`,
          t,
        );
        return requestDto(r.id, t);
      });
    },
    async revise(auth, id, data, rid) {
      return withRequest(auth, id, async (r, owner, t) => {
        if (!["enviada", "en_negociacion"].includes(r.estado))
          conflict("La solicitud ya está cerrada.");
        if (r.version !== data.version)
          conflict("La propuesta cambió. Revisá la nueva versión.");
        const p = await proposal(
            r.oferta_id,
            r.solicitante_empresa_id,
            owner,
            data,
            t,
          ),
          before = r.estado;
        await r.update(
          {
            cantidad: format(scaled(data.cantidad)),
            propuesta: data.condiciones,
            condiciones_json: p,
            version: r.version + 1,
            proponente_empresa_id: auth.company.id,
            estado: "en_negociacion",
          },
          { transaction: t },
        );
        await history(
          auth,
          "solicitud",
          id,
          before,
          r.estado,
          "Nueva propuesta de condiciones; versión " + r.version,
          t,
        );
        await audit(
          auth,
          "solicitud.propuesta",
          "solicitud",
          id,
          { version: r.version },
          rid,
          t,
        );
        await notify(
          [same(owner, auth.company.id) ? r.solicitante_empresa_id : owner],
          "propuesta_nueva",
          `propuesta:${id}:${r.version}`,
          `/mi-espacio/solicitudes/${id}`,
          t,
        );
        return requestDto(id, t);
      });
    },
    async accept(auth, id, data, rid) {
      return withRequest(auth, id, async (r, owner, t) => {
        if (r.version !== data.version)
          conflict(
            "La propuesta cambió. Revisá la versión actual antes de aceptar.",
          );
        const existing = await m.Acuerdo.findOne({
          where: { solicitud_id: id },
          transaction: t,
        });
        if (existing)
          return {
            created: false,
            acuerdo: await agreementDto(existing.id, t),
          };
        if (!["enviada", "en_negociacion"].includes(r.estado))
          conflict("La solicitud está cerrada.");
        if (same(r.proponente_empresa_id, auth.company.id))
          fail(
            403,
            "COUNTERPART_REQUIRED",
            "La contraparte debe revisar y aceptar tu propuesta.",
          );
        const p = r.condiciones_json,
          offers = await offerLocks(
            p.lineas.map((l) => l.oferta_id),
            t,
          );
        for (const l of p.lineas) {
          const o = offers.get(l.oferta_id);
          if (
            !same(o.empresa_id, l.empresa_oferente_id) ||
            !same(o.unidad_id, l.unidad_id) ||
            o.estado !== "publicada" ||
            scaled(available(o)) < scaled(l.cantidad)
          )
            conflict(
              "Cambió la oferta, la unidad o la disponibilidad. Prepará una propuesta actualizada.",
            );
        }
        const a = await m.Acuerdo.create(
          {
            solicitud_id: id,
            modalidad: p.modalidad,
            condiciones: p.condiciones,
            fecha_prevista: p.fecha_prevista,
            estado: "confirmado",
            version_aceptada: r.version,
          },
          { transaction: t },
        );
        await m.AcuerdoLinea.bulkCreate(
          p.lineas.map((l) => ({
            acuerdo_id: a.id,
            oferta_id: l.oferta_id,
            unidad_id: l.unidad_id,
            empresa_oferente_id: l.empresa_oferente_id,
            empresa_receptora_id: l.empresa_receptora_id,
            cantidad: l.cantidad,
            precio_unitario_acordado: l.precio_unitario_acordado,
            moneda: l.moneda,
            ficha_json: l.ficha,
          })),
          { transaction: t },
        );
        for (const l of p.lineas) {
          const o = offers.get(l.oferta_id);
          await o.update(
            {
              cantidad_reservada: format(
                scaled(o.cantidad_reservada) + scaled(l.cantidad),
              ),
            },
            { transaction: t },
          );
        }
        const before = r.estado;
        await r.update({ estado: "aceptada" }, { transaction: t });
        await history(
          auth,
          "solicitud",
          id,
          before,
          "aceptada",
          "Propuesta revisada y aceptada",
          t,
        );
        await history(
          auth,
          "acuerdo",
          a.id,
          null,
          "confirmado",
          "Reserva transaccional de las líneas",
          t,
        );
        await audit(
          auth,
          "acuerdo.aceptado",
          "acuerdo",
          a.id,
          { solicitud_id: String(id), version: r.version },
          rid,
          t,
        );
        await notify(
          [owner, r.solicitante_empresa_id],
          "acuerdo_confirmado",
          "acuerdo:" + a.id,
          `/mi-espacio/acuerdos/${a.id}`,
          t,
        );
        return { created: true, acuerdo: await agreementDto(a.id, t) };
      });
    },
    async closeRequest(auth, id, data, action, rid) {
      return withRequest(auth, id, async (r, owner, t) => {
        if (!["enviada", "en_negociacion"].includes(r.estado))
          conflict("La solicitud ya está cerrada.");
        if (action === "rechazada" && !same(owner, auth.company.id))
          fail(
            403,
            "FORBIDDEN",
            "Solo la empresa oferente puede rechazar la solicitud.",
          );
        if (
          action === "cancelada" &&
          !same(r.solicitante_empresa_id, auth.company.id)
        )
          fail(
            403,
            "FORBIDDEN",
            "Solo la empresa solicitante puede cancelar su solicitud.",
          );
        const before = r.estado;
        await r.update({ estado: action }, { transaction: t });
        await history(auth, "solicitud", id, before, action, data.motivo, t);
        await audit(
          auth,
          "solicitud." + action,
          "solicitud",
          id,
          { motivo: data.motivo },
          rid,
          t,
        );
        return requestDto(id, t);
      });
    },
    async message(auth, id, data, rid) {
      return withRequest(auth, id, async (r, owner, t) => {
        if (data.clave_cliente) {
          const previous = await m.Mensaje.findOne({
            where: {
              autor_id: auth.user.id,
              clave_cliente: data.clave_cliente,
            },
            transaction: t,
          });
          if (previous) {
            if (
              !same(previous.solicitud_id, id) ||
              previous.contenido !== data.contenido
            )
              conflict("La clave de envío ya se utilizó con otro mensaje.");
            return {
              id: String(previous.id),
              autor_id: String(previous.autor_id),
              nombre: auth.user.nombre,
              contenido: previous.contenido,
              enviado_en: previous.enviado_en,
              repetido: true,
            };
          }
        }
        const msg = await m.Mensaje.create(
          {
            solicitud_id: id,
            autor_id: auth.user.id,
            contenido: data.contenido,
            clave_cliente: data.clave_cliente || null,
            enviado_en: new Date(),
          },
          { transaction: t },
        );
        await r.update({ updated_at: new Date() }, { transaction: t });
        await audit(
          auth,
          "solicitud.mensaje",
          "mensaje",
          msg.id,
          { solicitud_id: String(id) },
          rid,
          t,
        );
        await notify(
          [same(owner, auth.company.id) ? r.solicitante_empresa_id : owner],
          "mensaje_nuevo",
          "mensaje:" + msg.id,
          `/mi-espacio/mensajes/${id}`,
          t,
        );
        return {
          id: String(msg.id),
          autor_id: String(auth.user.id),
          nombre: auth.user.nombre,
          contenido: msg.contenido,
          enviado_en: msg.enviado_en,
        };
      });
    },
    async messages(auth, id, page) {
      await requestAccess(auth, id);
      const where = { solicitud_id: id },
        total = await m.Mensaje.count({ where });
      const rows = await m.Mensaje.findAll({
        where,
        order: [["id", "DESC"]],
        limit: 30,
        offset: (page - 1) * 30,
      });
      const users = await m.Usuario.findAll({
        where: { id: rows.map((r) => r.autor_id) },
        attributes: ["id", "nombre"],
      });
      return {
        mensajes: rows.map((r) => ({
          id: String(r.id),
          autor_id: String(r.autor_id),
          nombre:
            users.find((u) => same(u.id, r.autor_id))?.nombre || "Usuario",
          contenido: r.contenido,
          enviado_en: r.enviado_en,
        })),
        pagina: page,
        total,
        paginas: Math.max(1, Math.ceil(total / 30)),
      };
    },
    async getRequest(auth, id) {
      await requestAccess(auth, id);
      const result = await requestDto(id);
      const history = await m.HistorialEstado.findAll({
        where: { solicitud_id: id },
        order: [["id", "ASC"]],
        limit: 200,
        attributes: [
          "id",
          "actor_id",
          "estado_anterior",
          "estado_nuevo",
          "motivo",
          "fecha",
        ],
      });
      return { ...result, historial: history };
    },
    async list(auth, page) {
      permission(auth);
      const where = {
        [Op.or]: [
          { solicitante_empresa_id: auth.company.id },
          { "$oferta.empresa_id$": auth.company.id },
        ],
      };
      const total = await m.Solicitud.count({ where, include: [offerInc] });
      const rows = await m.Solicitud.findAll({
        where,
        include: requestInc,
        order: [["id", "DESC"]],
        limit: 20,
        offset: (page - 1) * 20,
        subQuery: false,
      });
      return {
        solicitudes: await Promise.all(rows.map((r) => requestDto(r.id))),
        pagina: page,
        total,
        paginas: Math.max(1, Math.ceil(total / 20)),
      };
    },
    async getAgreement(auth, id) {
      await agreementAccess(auth, id);
      return agreementDto(id);
    },
    async cancel(auth, id, data, rid) {
      return withAgreement(auth, id, async (a, r, owner, t) => {
        if (a.estado === "cancelado") return agreementDto(id, t);
        if (a.estado === "aprovechamiento_confirmado")
          conflict("El acuerdo ya se completó.");
        const pending = await m.Entrega.count({
          where: {
            acuerdo_id: id,
            estado: { [Op.in]: ["pendiente", "disputada"] },
          },
          transaction: t,
        });
        if (pending)
          conflict(
            "Resolvé las entregas pendientes o discrepancias antes de cancelar.",
          );
        const lines = await m.AcuerdoLinea.findAll({
            where: { acuerdo_id: id },
            transaction: t,
          }),
          done = await m.Entrega.findAll({
            where: { acuerdo_id: id },
            include: [{ model: m.EntregaLinea, as: "lineas" }],
            transaction: t,
          }),
          offers = await offerLocks(
            lines.map((l) => l.oferta_id),
            t,
          );
        let released = 0n;
        for (const l of lines) {
          const delivered = done
              .filter((d) => d.estado !== "anulada")
              .flatMap((d) => d.lineas)
              .filter((x) => same(x.acuerdo_linea_id, l.id))
              .reduce((n, x) => n + scaled(x.cantidad), 0n),
            remaining = scaled(l.cantidad) - delivered,
            o = offers.get(String(l.oferta_id));
          if (remaining < 0n || scaled(o.cantidad_reservada) < remaining)
            conflict("Las cantidades requieren conciliación.");
          released += remaining;
          await o.update(
            {
              cantidad_reservada: format(
                scaled(o.cantidad_reservada) - remaining,
              ),
            },
            { transaction: t },
          );
        }
        if (released === 0n)
          conflict("Todas las cantidades ya fueron entregadas.");
        const before = a.estado;
        await a.update({ estado: "cancelado" }, { transaction: t });
        await history(auth, "acuerdo", id, before, "cancelado", data.motivo, t);
        await audit(
          auth,
          "acuerdo.cancelado",
          "acuerdo",
          id,
          { motivo: data.motivo },
          rid,
          t,
        );
        await notify(
          [owner, r.solicitante_empresa_id],
          "acuerdo_cancelado",
          "cancelado:" + id,
          `/mi-espacio/acuerdos/${id}`,
          t,
        );
        return agreementDto(id, t);
      });
    },
    async delivery(auth, id, data, rid) {
      return withAgreement(auth, id, async (a, r, owner, t) => {
        const key = `${id}:${data.clave_idempotencia}`;
        const canonical = {
          fecha: new Date(data.fecha).toISOString(),
          lineas: [...data.lineas]
            .sort((x, y) =>
              BigInt(x.acuerdo_linea_id) < BigInt(y.acuerdo_linea_id) ? -1 : 1,
            )
            .map((l) => ({
              ...l,
              cantidad: format(scaled(l.cantidad)),
              masa_kg: l.masa_kg === null ? null : format(scaled(l.masa_kg)),
              factor_kg:
                l.factor_kg === null ? null : format(scaled(l.factor_kg, 6), 6),
            })),
        };
        const hash = createHash("sha256")
          .update(JSON.stringify(canonical))
          .digest("hex");
        const existing = await m.Entrega.findOne({
          where: { clave_idempotencia: key },
          transaction: t,
        });
        if (existing) {
          if (existing.entrada_hash !== hash)
            conflict("La clave de operación ya se usó con otra entrada.");
          return {
            created: false,
            entrega: deliveryDto(await loadDelivery(existing.id, t)),
          };
        }
        if (!["confirmado", "entrega_pendiente"].includes(a.estado))
          conflict("El acuerdo no admite nuevas entregas.");
        const lines = await m.AcuerdoLinea.findAll({
            where: { acuerdo_id: id },
            transaction: t,
          }),
          prior = await m.Entrega.findAll({
            where: { acuerdo_id: id },
            include: [{ model: m.EntregaLinea, as: "lineas" }],
            transaction: t,
          });
        const values = [];
        for (const entry of canonical.lineas) {
          const l = lines.find((l) => same(l.id, entry.acuerdo_linea_id));
          if (!l) bad("Una línea no pertenece al acuerdo.");
          const registered = prior
            .filter((d) => d.estado !== "anulada")
            .flatMap((d) => d.lineas)
            .filter((x) => same(x.acuerdo_linea_id, l.id))
            .reduce((n, x) => n + scaled(x.cantidad), 0n);
          if (registered + scaled(entry.cantidad) > scaled(l.cantidad))
            conflict("La entrega supera lo pendiente de la línea.");
          let mass = entry.masa_kg;
          if (entry.metodo_masa === "estimado") {
            const kg =
              (scaled(entry.cantidad) * scaled(entry.factor_kg, 6) + 500000n) /
              1000000n;
            if (kg > 99999999999999n)
              bad("La masa estimada supera el límite permitido.");
            mass = format(kg);
          }
          values.push({ ...entry, masa_kg: mass });
        }
        const d = await m.Entrega.create(
          {
            acuerdo_id: id,
            clave_idempotencia: key,
            entrada_hash: hash,
            fecha: new Date(data.fecha),
            estado: "pendiente",
            creador_id: auth.user.id,
          },
          { transaction: t },
        );
        await m.EntregaLinea.bulkCreate(
          values.map((l) => ({ ...l, entrega_id: d.id })),
          { transaction: t },
        );
        await refreshAgreement(a, auth, rid, t);
        await audit(
          auth,
          "entrega.registrada",
          "entrega",
          d.id,
          { acuerdo_id: String(id) },
          rid,
          t,
        );
        await notify(
          [owner, r.solicitante_empresa_id],
          "entrega_pendiente",
          "entrega:" + d.id,
          `/mi-espacio/acuerdos/${id}`,
          t,
        );
        return {
          created: true,
          entrega: deliveryDto(await loadDelivery(d.id, t)),
        };
      });
    },
    async confirm(auth, id, data, rid) {
      return withDelivery(auth, id, async (d, a, r, owner, t) => {
        if (
          a.estado === "cancelado" ||
          ["disputada", "anulada"].includes(d.estado)
        )
          conflict(
            "La operación está cancelada o requiere resolver una discrepancia.",
          );
        const current = await m.Confirmacion.findOne({
          where: {
            entrega_id: id,
            empresa_id: auth.company.id,
            tipo: data.tipo,
          },
          transaction: t,
        });
        if (current && current.conforme === data.conforme)
          return deliveryDto(await loadDelivery(id, t));
        if (
          current &&
          !(
            data.tipo === "aprovechamiento" &&
            !current.conforme &&
            data.conforme
          )
        )
          conflict(
            "La confirmación ya fue registrada y requiere revisión para cambiarla.",
          );
        const all = await m.Confirmacion.findAll({
          where: { entrega_id: id },
          transaction: t,
        });
        if (data.tipo === "recepcion" && d.estado !== "pendiente")
          conflict("La recepción ya fue cerrada.");
        if (data.tipo === "aprovechamiento") {
          if (!["entregada", "aprovechamiento_confirmado"].includes(d.estado))
            conflict("Ambas empresas deben confirmar la recepción primero.");
          if (
            a.modalidad !== "intercambio" &&
            same(owner, auth.company.id) &&
            data.conforme &&
            !all.some(
              (c) =>
                c.tipo === "aprovechamiento" &&
                same(c.empresa_id, r.solicitante_empresa_id) &&
                c.conforme,
            )
          )
            conflict("Primero debe declarar el uso la empresa receptora.");
        }
        const fields = {
          usuario_id: auth.user.id,
          conforme: data.conforme,
          observacion: data.observacion,
          fecha: new Date(),
        };
        let saved = current;
        if (current) await current.update(fields, { transaction: t });
        else
          saved = await m.Confirmacion.create(
            {
              entrega_id: id,
              empresa_id: auth.company.id,
              tipo: data.tipo,
              ...fields,
            },
            { transaction: t },
          );
        const refreshed = await m.Confirmacion.findAll({
          where: { entrega_id: id },
          transaction: t,
        });
        if (data.tipo === "recepcion" && !data.conforme) {
          await d.update({ estado: "disputada" }, { transaction: t });
          await m.Incidencia.create(
            {
              reportante_id: auth.user.id,
              oferta_id: r.oferta_id,
              acuerdo_id: a.id,
              entrega_id: id,
              motivo: data.observacion,
              estado: "abierta",
            },
            { transaction: t },
          );
        } else if (
          data.tipo === "recepcion" &&
          refreshed.filter((c) => c.tipo === "recepcion" && c.conforme)
            .length === 2
        ) {
          const dl = await m.EntregaLinea.findAll({
              where: { entrega_id: id },
              transaction: t,
            }),
            lines = await m.AcuerdoLinea.findAll({
              where: { acuerdo_id: a.id },
              transaction: t,
            }),
            offers = await offerLocks(
              lines.map((l) => l.oferta_id),
              t,
            );
          for (const entry of dl) {
            const l = lines.find((l) => same(l.id, entry.acuerdo_linea_id)),
              o = offers.get(String(l.oferta_id));
            if (scaled(o.cantidad_reservada) < scaled(entry.cantidad))
              conflict("Las reservas requieren conciliación.");
            const delivered =
              scaled(o.cantidad_entregada) + scaled(entry.cantidad);
            await o.update(
              {
                cantidad_reservada: format(
                  scaled(o.cantidad_reservada) - scaled(entry.cantidad),
                ),
                cantidad_entregada: format(delivered),
                ...(delivered === scaled(o.cantidad_total) &&
                o.estado === "publicada"
                  ? { estado: "agotada" }
                  : {}),
              },
              { transaction: t },
            );
          }
          await d.update({ estado: "entregada" }, { transaction: t });
        } else if (
          data.tipo === "aprovechamiento" &&
          refreshed.filter((c) => c.tipo === "aprovechamiento" && c.conforme)
            .length === 2
        )
          await d.update(
            { estado: "aprovechamiento_confirmado" },
            { transaction: t },
          );
        await refreshAgreement(a, auth, rid, t);
        await audit(
          auth,
          "entrega.confirmacion",
          "entrega",
          id,
          { tipo: data.tipo, conforme: data.conforme },
          rid,
          t,
        );
        await notify(
          [same(owner, auth.company.id) ? r.solicitante_empresa_id : owner],
          "confirmacion_entrega",
          `confirmacion:${saved.id}:${data.conforme}`,
          `/mi-espacio/acuerdos/${a.id}`,
          t,
        );
        return deliveryDto(await loadDelivery(id, t));
      });
    },
    async evidence(auth, id, file, description, rid) {
      return withDelivery(auth, id, async (d, a, r, owner, t) => {
        const count = await m.EntregaEvidencia.count({
          where: { entrega_id: id },
          transaction: t,
        });
        if (count >= 6)
          bad("Se permiten seis fotografías de evidencia por entrega.");
        const f = await m.Archivo.create(
          {
            ...file,
            empresa_id: auth.company.id,
            visibilidad: "privada",
            estado: "activo",
          },
          { transaction: t },
        );
        await m.EntregaEvidencia.create(
          { entrega_id: id, archivo_id: f.id, descripcion: description },
          { transaction: t },
        );
        await audit(
          auth,
          "entrega.evidencia",
          "entrega",
          id,
          { archivo_id: String(f.id) },
          rid,
          t,
        );
        return deliveryDto(await loadDelivery(id, t));
      });
    },
    async evidenceFile(auth, id, fileId) {
      const d = await m.Entrega.findByPk(id);
      if (!d) missing();
      await agreementAccess(auth, d.acuerdo_id);
      const link = await m.EntregaEvidencia.findOne({
          where: { entrega_id: id, archivo_id: fileId },
        }),
        file =
          link &&
          (await m.Archivo.findOne({
            where: { id: fileId, estado: "activo" },
          }));
      if (!file) missing();
      return file;
    },
    async notifications(auth, page) {
      const where = { usuario_id: auth.user.id },
        total = await m.Notificacion.count({ where });
      const rows = await m.Notificacion.findAll({
        where,
        order: [["id", "DESC"]],
        limit: 30,
        offset: (page - 1) * 30,
        attributes: ["id", "tipo", "ruta", "estado", "creada_en", "leida_en"],
      });
      return {
        avisos: rows,
        pagina: page,
        total,
        paginas: Math.max(1, Math.ceil(total / 30)),
        correo_enviado: false,
      };
    },
    async readNotification(auth, id) {
      const row = await m.Notificacion.findOne({
        where: { id, usuario_id: auth.user.id },
      });
      if (!row) missing();
      await row.update({ estado: "leida", leida_en: new Date() });
      return { estado: "leida" };
    },
  };
}
module.exports = { createOperationsService };
