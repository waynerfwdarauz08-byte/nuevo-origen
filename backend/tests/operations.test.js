const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  request = require("supertest"),
  { randomUUID, randomBytes } = require("node:crypto"),
  { execFileSync } = require("node:child_process"),
  path = require("node:path"),
  sharp = require("sharp");
test(
  "operación entre empresas con MySQL exclusivo",
  { skip: process.env.RUN_MYSQL_TESTS !== "1" },
  async (t) => {
    process.env.NODE_ENV = "test";
    assert.equal(
      require("../src/config/env").readConfig().database.database,
      "nuevo_origen_test",
    );
    const cli = path.resolve("node_modules/sequelize-cli/lib/sequelize");
    for (const cmd of ["db:migrate", "db:seed:all"])
      execFileSync(process.execPath, [cli, cmd, "--env", "test"], {
        env: process.env,
        stdio: "pipe",
      });
    const m = require("../src/models"),
      security = {
        ...require("../src/config/security").readSecurity({
          JWT_SECRET: randomBytes(48).toString("hex"),
        }),
        registerLimit: 100,
        loginLimit: 100,
        ipLimit: 300,
        manualInvitations: true,
      },
      app = require("../src/app").createApp({
        database: m.sequelize,
        models: m,
        security,
      }),
      tag = randomUUID(),
      password = "OperacionFicticia_12345",
      origin = "http://127.0.0.1:5173";
    const policies = (
      await request(app).get("/api/politicas")
    ).body.politicas.map((p) => ({
      tipo: p.tipo,
      version: p.version,
      aceptada: true,
    }));
    const csrf = async (a) =>
      (await a.get("/api/auth/csrf").expect(200)).body.csrfToken;
    async function mutate(a, url, body, method = "post") {
      const token = await csrf(a);
      return a[method]("/api" + url)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send(body);
    }
    async function company(name) {
      const a = request.agent(app),
        correo = `op-${name}-${tag}@example.test`,
        r = await mutate(a, "/auth/registro", {
          empresa: {
            nombre: "Empresa ficticia " + name,
            sector: "Pruebas",
            correo_contacto: correo,
            ubicacion_publica: "Cantón ficticio",
          },
          usuario: { nombre: "Persona ficticia " + name, correo, password },
          aceptaciones: policies,
          comunicaciones_opcionales: false,
        });
      assert.equal(r.status, 201);
      return { a, id: r.body.empresa.id, user: r.body.usuario.id };
    }
    const a = await company("A"),
      b = await company("B"),
      c = await company("C"),
      meta = (await request(app).get("/api/catalogos/materiales")).body;
    const kg = meta.unidades.find((u) => u.codigo === "kg").id,
      category = meta.categorias[0].id;
    async function offer(company, quantity = "10.000", mode = "venta") {
      return m.Oferta.create({
        empresa_id: company.id,
        autor_id: company.user,
        categoria_id: category,
        unidad_id: kg,
        titulo: "Oferta ficticia " + randomUUID(),
        composicion: "Material de prueba no peligroso",
        estado_material: "retazo",
        cantidad_total: quantity,
        modalidad: mode,
        precio_unitario: mode === "venta" ? "10.00" : null,
        moneda: mode === "venta" ? "CRC" : null,
        frecuencia: "puntual",
        ubicacion: "Cantón ficticio",
        estado: "publicada",
        declaracion_no_peligroso: true,
        declaracion_aprovechable: true,
      });
    }
    const proposal = (o, qty = "5.000", extra = {}) => ({
      oferta_id: String(o.id),
      cantidad: qty,
      condiciones: "Retiro coordinado entre empresas; condiciones ficticias.",
      ...extra,
    });
    async function create(owner, o, qty = "5.000", extra = {}) {
      const r = await mutate(owner.a, "/solicitudes", proposal(o, qty, extra));
      assert.equal(r.status, 201);
      return r.body;
    }
    async function accept(owner, r) {
      const response = await mutate(owner.a, `/solicitudes/${r.id}/aceptar`, {
        version: r.version,
      });
      assert.equal(response.status, 201);
      return response.body;
    }
    async function confirm(owner, id, tipo, conforme = true) {
      return mutate(owner.a, `/entregas/${id}/confirmaciones`, {
        tipo,
        conforme,
        observacion: conforme
          ? "Conforme en prueba ficticia"
          : "Todavía no se utilizó el material",
      });
    }
    let main, req, agreement, delivery;
    try {
      await t.test(
        "solicitudes no reservan y solo participantes con permiso acceden",
        async () => {
          main = await offer(a);
          assert.equal(
            (await mutate(a.a, "/solicitudes", proposal(main))).status,
            400,
          );
          req = await create(b, main);
          assert.equal(
            (await m.Oferta.findByPk(main.id)).cantidad_reservada,
            "0.000",
          );
          await c.a.get("/api/solicitudes/" + req.id).expect(404);
          await request(app)
            .get("/api/solicitudes/" + req.id)
            .expect(401);
          assert.equal(
            (
              await mutate(c.a, "/solicitudes", {
                ...proposal(main),
                empresa_id: b.id,
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(b.a, `/solicitudes/${req.id}/aceptar`, {
                version: 1,
              })
            ).status,
            403,
          );
        },
      );
      await t.test(
        "conversación privada, historial y revisión de propuesta versionada",
        async () => {
          assert.equal(
            (
              await mutate(b.a, `/solicitudes/${req.id}/mensajes`, {
                contenido: "Consulta ficticia sobre el retiro.",
              })
            ).status,
            201,
          );
          assert.equal(
            (await a.a.get(`/api/solicitudes/${req.id}/mensajes`)).body.total,
            1,
          );
          await c.a.get(`/api/solicitudes/${req.id}/mensajes`).expect(404);
          const revision = await mutate(
            a.a,
            `/solicitudes/${req.id}/condiciones`,
            {
              version: 1,
              cantidad: "5.000",
              condiciones: "Nuevo retiro acordado para prueba.",
            },
            "put",
          );
          assert.equal(revision.status, 200);
          req = revision.body;
          assert.equal(req.version, 2);
          assert.equal(
            (
              await mutate(b.a, `/solicitudes/${req.id}/aceptar`, {
                version: 1,
              })
            ).status,
            409,
          );
          agreement = await accept(b, req);
          assert.equal(
            (await m.Oferta.findByPk(main.id)).cantidad_reservada,
            "5.000",
          );
          assert.equal(
            (
              await mutate(b.a, `/solicitudes/${req.id}/aceptar`, {
                version: 2,
              })
            ).status,
            200,
          );
          assert.equal(
            await m.Acuerdo.count({ where: { solicitud_id: req.id } }),
            1,
          );
          assert.ok(
            (await a.a.get("/api/solicitudes/" + req.id)).body.historial
              .length >= 3,
          );
        },
      );
      await t.test(
        "la unidad no puede cambiar mientras existan reservas",
        async () => {
          const r = await a.a.get("/api/ofertas/" + main.id).expect(200);
          const o = r.body;
          const body = {
            titulo: o.titulo,
            categoria_id: o.categoria.id,
            unidad_id: meta.unidades.find((u) => u.codigo === "unidad").id,
            ubicacion: o.ubicacion,
            composicion: o.composicion,
            estado_material: o.estado_material,
            cantidad_total: o.cantidad_total,
            modalidad: o.modalidad,
            precio_unitario: o.precio_unitario,
            moneda: o.moneda,
            frecuencia: o.frecuencia,
            declaracion_no_peligroso: true,
            declaracion_aprovechable: true,
            propiedades: [],
          };
          assert.equal(
            (await mutate(a.a, "/ofertas/" + main.id, body, "put")).status,
            400,
          );
        },
      );
      await t.test(
        "entrega parcial idempotente, sin impacto antes de confirmaciones",
        async () => {
          const input = {
            clave_idempotencia: randomUUID(),
            fecha: new Date().toISOString(),
            lineas: [
              {
                acuerdo_linea_id: agreement.lineas[0].id,
                cantidad: "2.000",
                masa_kg: "2.500",
                metodo_masa: "medido",
              },
            ],
          };
          const r = await mutate(
            a.a,
            `/acuerdos/${agreement.id}/entregas`,
            input,
          );
          assert.equal(r.status, 201);
          delivery = r.body;
          assert.equal(
            (await mutate(a.a, `/acuerdos/${agreement.id}/entregas`, input))
              .status,
            200,
          );
          assert.equal(
            (
              await mutate(a.a, `/acuerdos/${agreement.id}/entregas`, {
                ...input,
                lineas: [{ ...input.lineas[0], cantidad: "1" }],
              })
            ).status,
            409,
          );
          assert.equal(
            (await m.Oferta.findByPk(main.id)).cantidad_entregada,
            "0.000",
          );
          assert.equal(
            (await confirm(a, delivery.id, "recepcion")).status,
            200,
          );
          assert.equal(
            (await confirm(b, delivery.id, "recepcion")).status,
            200,
          );
          assert.equal(
            (await confirm(b, delivery.id, "recepcion")).status,
            200,
          );
          const o = await m.Oferta.findByPk(main.id);
          assert.equal(o.cantidad_entregada, "2.000");
          assert.equal(o.cantidad_reservada, "3.000");
        },
      );
      await t.test(
        "aprovechamiento requiere receptor y ambas partes; masas medidas separadas",
        async () => {
          assert.equal(
            (await confirm(a, delivery.id, "aprovechamiento")).status,
            409,
          );
          assert.equal(
            (await confirm(b, delivery.id, "aprovechamiento", false)).status,
            200,
          );
          const period = "?desde=2026-01-01&hasta=2027-12-31";
          assert.equal(
            (await a.a.get("/api/indicadores" + period)).body
              .entregas_con_uso_confirmado,
            0,
          );
          assert.equal(
            (await confirm(b, delivery.id, "aprovechamiento")).status,
            200,
          );
          assert.equal(
            (await confirm(a, delivery.id, "aprovechamiento")).status,
            200,
          );
          assert.equal(
            (await confirm(a, delivery.id, "aprovechamiento")).status,
            200,
          );
          const metrics = await a.a
            .get("/api/indicadores" + period)
            .expect(200);
          assert.equal(metrics.body.entregas_con_uso_confirmado, 1);
          assert.equal(metrics.body.grupos[0].cantidad, "2.000");
          assert.equal(metrics.body.grupos[0].masa_medida_kg, "2.500");
          assert.equal(metrics.body.grupos[0].masa_estimada_kg, "0.000");
          assert.equal(metrics.body.tendencia_diaria.length, 1);
          assert.equal(metrics.body.tendencia_diaria[0].cantidad, "2.000");
          assert.equal(
            metrics.body.tendencia_diaria[0].masa_medida_kg,
            "2.500",
          );
          assert.equal(
            (await c.a.get("/api/indicadores" + period)).body
              .entregas_con_uso_confirmado,
            0,
          );
        },
      );
      await t.test(
        "resto de entrega y estimación exacta con fuente; cantidades excesivas rechazadas",
        async () => {
          const base = {
            clave_idempotencia: randomUUID(),
            fecha: new Date().toISOString(),
            lineas: [
              {
                acuerdo_linea_id: agreement.lineas[0].id,
                cantidad: "4.000",
                metodo_masa: "estimado",
                factor_kg: "0.400000",
                fuente_factor: "Factor ficticio documentado de prueba",
              },
            ],
          };
          assert.equal(
            (await mutate(a.a, `/acuerdos/${agreement.id}/entregas`, base))
              .status,
            409,
          );
          base.lineas[0].cantidad = "3.000";
          const r = await mutate(
            a.a,
            `/acuerdos/${agreement.id}/entregas`,
            base,
          );
          assert.equal(r.status, 201);
          assert.equal(r.body.lineas[0].masa_kg, "1.200");
          for (const who of [a, b])
            assert.equal(
              (await confirm(who, r.body.id, "recepcion")).status,
              200,
            );
          for (const who of [b, a])
            assert.equal(
              (await confirm(who, r.body.id, "aprovechamiento")).status,
              200,
            );
          const result = await a.a
            .get("/api/acuerdos/" + agreement.id)
            .expect(200);
          assert.equal(result.body.estado, "aprovechamiento_confirmado");
          const o = await m.Oferta.findByPk(main.id);
          assert.equal(o.cantidad_entregada, "5.000");
          assert.equal(o.cantidad_reservada, "0.000");
          assert.equal(
            (
              await mutate(a.a, `/acuerdos/${agreement.id}/cancelar`, {
                motivo: "No corresponde cancelar completo",
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "cancelar libera reserva y conserva cantidades entregadas históricas",
        async () => {
          const r = await create(b, main, "3.000"),
            a2 = await accept(a, r);
          assert.equal(
            (await m.Oferta.findByPk(main.id)).cantidad_reservada,
            "3.000",
          );
          assert.equal(
            (
              await mutate(b.a, `/acuerdos/${a2.id}/cancelar`, {
                motivo: "Cancelación ficticia",
              })
            ).status,
            200,
          );
          const o = await m.Oferta.findByPk(main.id);
          assert.equal(o.cantidad_reservada, "0.000");
          assert.equal(o.cantidad_entregada, "5.000");
        },
      );
      await t.test(
        "aceptaciones concurrentes nunca sobreasignan stock",
        async () => {
          const o = await offer(a, "5.000"),
            r1 = await create(b, o, "4"),
            r2 = await create(c, o, "4");
          const results = await Promise.all([
            mutate(a.a, `/solicitudes/${r1.id}/aceptar`, { version: 1 }),
            mutate(a.a, `/solicitudes/${r2.id}/aceptar`, { version: 1 }),
          ]);
          assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_reservada,
            "4.000",
          );
        },
      );
      await t.test(
        "intercambio reserva ambos lados y cancela ambos atómicamente",
        async () => {
          const oa = await offer(a, "4", "intercambio"),
            ob = await offer(b, "3", "intercambio"),
            r = await create(b, oa, "2", {
              oferta_intercambio_id: String(ob.id),
              cantidad_intercambio: "1",
            }),
            ag = await accept(a, r);
          assert.equal(ag.lineas.length, 2);
          assert.equal(
            (await m.Oferta.findByPk(oa.id)).cantidad_reservada,
            "2.000",
          );
          assert.equal(
            (await m.Oferta.findByPk(ob.id)).cantidad_reservada,
            "1.000",
          );
          assert.equal(
            (
              await mutate(a.a, `/acuerdos/${ag.id}/cancelar`, {
                motivo: "Cancelar ambas reservas",
              })
            ).status,
            200,
          );
          assert.equal(
            (await m.Oferta.findByPk(oa.id)).cantidad_reservada,
            "0.000",
          );
          assert.equal(
            (await m.Oferta.findByPk(ob.id)).cantidad_reservada,
            "0.000",
          );
        },
      );
      await t.test(
        "fallo de segunda reserva bilateral no deja primera reserva huérfana",
        async () => {
          const oa = await offer(a, "5", "intercambio"),
            ob = await offer(b, "2", "intercambio"),
            oc = await offer(c, "2", "intercambio");
          const first = await create(b, oa, "5", {
              oferta_intercambio_id: String(ob.id),
              cantidad_intercambio: "2",
            }),
            competing = await create(c, ob, "2", {
              oferta_intercambio_id: String(oc.id),
              cantidad_intercambio: "1",
            });
          await accept(b, competing);
          assert.equal(
            (
              await mutate(a.a, `/solicitudes/${first.id}/aceptar`, {
                version: 1,
              })
            ).status,
            409,
          );
          assert.equal(
            (await m.Oferta.findByPk(oa.id)).cantidad_reservada,
            "0.000",
          );
          assert.equal(
            await m.Acuerdo.count({ where: { solicitud_id: first.id } }),
            0,
          );
        },
      );
      await t.test(
        "discrepancia abre incidencia y no mueve stock ni cuenta impacto",
        async () => {
          const o = await offer(a, "2"),
            r = await create(b, o, "1"),
            ag = await accept(a, r),
            d = await mutate(a.a, `/acuerdos/${ag.id}/entregas`, {
              clave_idempotencia: randomUUID(),
              fecha: new Date().toISOString(),
              lineas: [{ acuerdo_linea_id: ag.lineas[0].id, cantidad: "1" }],
            });
          assert.equal(d.status, 201);
          assert.equal((await confirm(a, d.body.id, "recepcion")).status, 200);
          const no = await confirm(b, d.body.id, "recepcion", false);
          assert.equal(no.status, 200);
          assert.equal(no.body.estado, "disputada");
          assert.equal(
            await m.Incidencia.count({ where: { entrega_id: d.body.id } }),
            1,
          );
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_entregada,
            "0.000",
          );
          assert.equal(
            (
              await mutate(a.a, `/acuerdos/${ag.id}/cancelar`, {
                motivo: "Pendiente resolver disputa",
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "mensajería independiente: aislamiento, cursores, reintentos y permisos vigentes",
        async () => {
          const o = await offer(a),
            r = await create(b, o, "1"),
            root = `/mensajeria/conversaciones/${r.id}`,
            url = root + "/mensajes";
          await request(app).get("/api/mensajeria/conversaciones").expect(401);
          await c.a.get("/api" + root).expect(404);
          await c.a.get("/api" + url).expect(404);
          const context = await b.a.get("/api" + root).expect(200);
          assert.equal(context.body.contraparte.id, a.id);
          const inbox = await b.a
            .get("/api/mensajeria/conversaciones")
            .expect(200);
          assert.ok(inbox.body.conversaciones.some((x) => x.id === r.id));
          const outsider = await c.a
            .get("/api/mensajeria/conversaciones")
            .expect(200);
          assert.ok(!outsider.body.conversaciones.some((x) => x.id === r.id));
          const key = randomUUID(),
            payload = {
              contenido: "Mensaje ficticio conservado entre empresas.",
              clave_cliente: key,
            };
          const sent = await mutate(b.a, url, payload);
          assert.equal(sent.status, 201);
          const repeated = await mutate(b.a, url, payload);
          assert.equal(repeated.status, 200);
          assert.equal(repeated.body.id, sent.body.id);
          assert.equal(
            await m.Mensaje.count({
              where: { autor_id: b.user, clave_cliente: key },
            }),
            1,
          );
          assert.equal(
            (
              await mutate(b.a, url, {
                ...payload,
                contenido: "Otro contenido",
              })
            ).status,
            409,
          );
          assert.equal(
            (await mutate(b.a, url, { ...payload, autor_id: a.user })).status,
            400,
          );
          assert.equal(
            (await mutate(b.a, url, { ...payload, contenido: "  " })).status,
            400,
          );
          await b.a
            .post("/api" + url)
            .send(payload)
            .expect(403);
          await c.a
            .post("/api" + url)
            .send(payload)
            .expect(403);
          const otherRequest = await create(b, o, "1");
          assert.equal(
            (
              await mutate(
                b.a,
                `/mensajeria/conversaciones/${otherRequest.id}/mensajes`,
                payload,
              )
            ).status,
            409,
          );
          const concurrentKey = randomUUID(),
            attempts = await Promise.all([
              mutate(b.a, url, {
                contenido: "Un único envío concurrente",
                clave_cliente: concurrentKey,
              }),
              mutate(b.a, url, {
                contenido: "Un único envío concurrente",
                clave_cliente: concurrentKey,
              }),
            ]);
          assert.deepEqual(attempts.map((x) => x.status).sort(), [200, 201]);
          assert.equal(attempts[0].body.id, attempts[1].body.id);
          await m.Mensaje.bulkCreate(
            Array.from({ length: 51 }, (_, i) => ({
              solicitud_id: r.id,
              autor_id: i % 2 ? a.user : b.user,
              contenido: "Historial ficticio " + i,
              enviado_en: new Date(),
            })),
          );
          const latest = await b.a.get("/api" + url).expect(200);
          assert.equal(latest.body.mensajes.length, 50);
          assert.equal(latest.body.hay_mas, true);
          for (let i = 1; i < latest.body.mensajes.length; i++)
            assert.ok(
              BigInt(latest.body.mensajes[i].id) >
                BigInt(latest.body.mensajes[i - 1].id),
            );
          const oldest = await b.a
            .get("/api" + url + "?antes_de=" + latest.body.mensajes[0].id)
            .expect(200);
          assert.equal(oldest.body.mensajes.length, 3);
          assert.equal(oldest.body.hay_mas, false);
          const forward = await a.a
            .get("/api" + url + "?despues_de=" + sent.body.id)
            .expect(200);
          assert.equal(forward.body.mensajes.length, 50);
          assert.equal(forward.body.hay_mas, true);
          const tail = await a.a
            .get(
              "/api" + url + "?despues_de=" + forward.body.mensajes.at(-1).id,
            )
            .expect(200);
          assert.equal(tail.body.mensajes.length, 2);
          assert.equal(tail.body.hay_mas, false);
          await b.a.get("/api" + url + "?antes_de=1&despues_de=2").expect(400);
          assert.ok(!JSON.stringify(latest.body).includes("password_hash"));
          assert.ok(!JSON.stringify(latest.body).includes("@example.test"));
          const member = await m.Usuario.create({
              empresa_id: a.id,
              nombre: "Especialista ficticio",
              correo: `chat-${tag}@example.test`,
              password_hash: await require("bcryptjs").hash(password, 12),
              estado: "activo",
            }),
            materialRole = await m.Rol.findOne({
              where: { codigo: "gestor_materiales" },
            }),
            agreementRole = await m.Rol.findOne({
              where: { codigo: "gestor_acuerdos" },
            });
          await m.UsuarioRol.create({
            usuario_id: member.id,
            rol_id: materialRole.id,
            asignado_por: a.user,
            asignado_en: new Date(),
          });
          const memberAgent = request.agent(app);
          assert.equal(
            (
              await mutate(memberAgent, "/auth/login", {
                correo: member.correo,
                password,
              })
            ).status,
            200,
          );
          await memberAgent.get("/api/mensajeria/conversaciones").expect(403);
          await m.UsuarioRol.create({
            usuario_id: member.id,
            rol_id: agreementRole.id,
            asignado_por: a.user,
            asignado_en: new Date(),
          });
          await memberAgent.get("/api" + url).expect(200);
          await m.UsuarioRol.destroy({
            where: { usuario_id: member.id, rol_id: agreementRole.id },
          });
          await memberAgent.get("/api" + url).expect(403);
          const rollbackKey = randomUUID();
          m.Auditoria.addHook("beforeCreate", "chat-rollback", (row) => {
            if (row.accion === "solicitud.mensaje")
              throw new Error("Fallo ficticio de auditoría");
          });
          try {
            assert.equal(
              (
                await mutate(b.a, url, {
                  contenido: "Debe revertirse",
                  clave_cliente: rollbackKey,
                })
              ).status,
              500,
            );
          } finally {
            m.Auditoria.removeHook("beforeCreate", "chat-rollback");
          }
          assert.equal(
            await m.Mensaje.count({ where: { clave_cliente: rollbackKey } }),
            0,
          );
        },
      );
      await t.test(
        "evidencias privadas, avisos propios, seguimiento y exportación",
        async () => {
          const image = await sharp({
              create: {
                width: 12,
                height: 12,
                channels: 3,
                background: "#354638",
              },
            })
              .png()
              .toBuffer(),
            token = await csrf(a.a);
          const uploaded = await a.a
            .post(`/api/entregas/${delivery.id}/evidencias`)
            .set("Origin", origin)
            .set("X-CSRF-Token", token)
            .attach("foto", image, "evidencia.png");
          assert.equal(uploaded.status, 201);
          const url = uploaded.body.evidencias[0].url;
          await b.a.get(url).expect(200);
          await c.a.get(url).expect(404);
          await request(app).get(url).expect(401);
          const avisos = await b.a.get("/api/notificaciones").expect(200);
          assert.ok(avisos.body.total > 0);
          assert.equal(avisos.body.correo_enviado, false);
          assert.equal(
            (
              await mutate(
                c.a,
                `/notificaciones/${avisos.body.avisos[0].id}/leida`,
                {},
              )
            ).status,
            404,
          );
          await a.a.get("/api/seguimiento/embudo").expect(200);
          await a.a.get("/api/seguimiento/atencion?dias=3").expect(200);
          await a.a
            .get(
              "/api/indicadores/exportacion?desde=2026-01-01&hasta=2027-12-31",
            )
            .expect(200)
            .expect("Content-Type", /text\/csv/);
        },
      );
      await t.test(
        "moderación: asignación concurrente, aislamiento y anulación sin impacto",
        async () => {
          async function moderator() {
            const correo = `mod-${randomUUID()}@example.test`;
            const user = await m.Usuario.create({
              empresa_id: null,
              nombre: "Moderación ficticia",
              correo,
              password_hash: await require("bcryptjs").hash(password, 12),
              estado: "activo",
            });
            const role = await m.Rol.findOne({
              where: { codigo: "moderador" },
            });
            await m.UsuarioRol.create({
              usuario_id: user.id,
              rol_id: role.id,
              asignado_por: user.id,
              asignado_en: new Date(),
            });
            const agent = request.agent(app);
            assert.equal(
              (await mutate(agent, "/auth/login", { correo, password })).status,
              200,
            );
            return agent;
          }
          const mod = await moderator(),
            other = await moderator();
          const o = await offer(a, "2"),
            r = await create(b, o, "1"),
            ag = await accept(a, r);
          const d = await mutate(a.a, `/acuerdos/${ag.id}/entregas`, {
            clave_idempotencia: randomUUID(),
            fecha: new Date().toISOString(),
            lineas: [{ acuerdo_linea_id: ag.lineas[0].id, cantidad: "1" }],
          });
          assert.equal(d.status, 201);
          await confirm(a, d.body.id, "recepcion");
          await confirm(b, d.body.id, "recepcion", false);
          const incident = await m.Incidencia.findOne({
              where: { entrega_id: d.body.id },
            }),
            url = `/administracion/incidencias/${incident.id}`;
          await c.a.get("/api" + url).expect(403);
          await mod.get("/api" + url).expect(404);
          const attempts = await Promise.all([
            mutate(mod, url + "/asignarme", {}),
            mutate(other, url + "/asignarme", {}),
          ]);
          assert.deepEqual(attempts.map((r) => r.status).sort(), [200, 409]);
          const winner = attempts[0].status === 200 ? mod : other,
            loser = winner === mod ? other : mod;
          await winner.get("/api" + url).expect(200);
          await loser.get("/api" + url).expect(404);
          assert.equal(
            (
              await mutate(winner, url + "/resolver", {
                accion: "confirmar_entrega",
                motivo: "Acción prohibida de prueba",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(winner, url + "/resolver", {
                accion: "anular_entrega",
                motivo:
                  "Las empresas requieren corregir el registro disputado.",
              })
            ).status,
            200,
          );
          assert.equal((await m.Entrega.findByPk(d.body.id)).estado, "anulada");
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_reservada,
            "1.000",
          );
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_entregada,
            "0.000",
          );
          const detail = await a.a.get("/api/acuerdos/" + ag.id).expect(200);
          assert.equal(
            detail.body.lineas[0].cantidad_pendiente_registro,
            "1.000",
          );
          assert.equal(
            (
              await mutate(a.a, `/acuerdos/${ag.id}/cancelar`, {
                motivo: "Cancelación posterior a anulación",
              })
            ).status,
            200,
          );
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_reservada,
            "0.000",
          );
          const retryOffer = await offer(a, "2"),
            retryRequest = await create(b, retryOffer, "1"),
            retryAgreement = await accept(a, retryRequest);
          assert.equal(
            (
              await mutate(mod, "/incidencias", {
                oferta_id: String(retryOffer.id),
                motivo: "Reporte autenticado de oferta pública.",
              })
            ).status,
            201,
          );
          assert.equal(
            (
              await mutate(mod, "/incidencias", {
                acuerdo_id: retryAgreement.id,
                motivo: "No puede representar a una empresa.",
              })
            ).status,
            403,
          );
          const retryDelivery = await mutate(
            a.a,
            `/acuerdos/${retryAgreement.id}/entregas`,
            {
              clave_idempotencia: randomUUID(),
              fecha: new Date().toISOString(),
              lineas: [
                {
                  acuerdo_linea_id: retryAgreement.lineas[0].id,
                  cantidad: "1",
                },
              ],
            },
          );
          assert.equal(retryDelivery.status, 201);
          await confirm(a, retryDelivery.body.id, "recepcion");
          await confirm(b, retryDelivery.body.id, "recepcion", false);
          const retryCase = await m.Incidencia.findOne({
              where: { entrega_id: retryDelivery.body.id },
            }),
            retryUrl = `/administracion/incidencias/${retryCase.id}`;
          assert.equal(
            (await mutate(mod, retryUrl + "/asignarme", {})).status,
            200,
          );
          assert.equal(
            (
              await mutate(mod, retryUrl + "/resolver", {
                accion: "retomar_entrega",
                motivo: "Ambas empresas deben revisar y confirmar de nuevo.",
              })
            ).status,
            200,
          );
          assert.equal(
            await m.Confirmacion.count({
              where: { entrega_id: retryDelivery.body.id },
            }),
            0,
          );
          assert.equal(
            (await confirm(a, retryDelivery.body.id, "recepcion")).status,
            200,
          );
          assert.equal(
            (await confirm(b, retryDelivery.body.id, "recepcion")).status,
            200,
          );
          assert.equal(
            (await m.Oferta.findByPk(retryOffer.id)).cantidad_entregada,
            "1.000",
          );
          assert.ok(
            await m.Auditoria.count({
              where: {
                accion: "incidencia.resuelta",
                recurso_id: retryCase.id,
              },
            }),
          );
          const report = await mutate(b.a, "/incidencias", {
            oferta_id: String(o.id),
            motivo: "Información que debe revisarse",
          });
          assert.equal(report.status, 201);
          assert.equal(
            (
              await mutate(
                mod,
                `/administracion/incidencias/${report.body.id}/asignarme`,
                {},
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(
                mod,
                `/administracion/incidencias/${report.body.id}/resolver`,
                {
                  accion: "pausar_oferta",
                  motivo: "Pausar mientras la empresa corrige los datos.",
                },
              )
            ).status,
            200,
          );
          assert.equal((await m.Oferta.findByPk(o.id)).estado, "pausada");
          assert.ok(
            await m.Auditoria.count({
              where: { accion: "incidencia.resuelta", recurso_id: incident.id },
            }),
          );
        },
      );
      await t.test(
        "derechos propios, consentimientos y recuperación segura sin correo",
        async () => {
          const correo = `ap-${randomUUID()}@example.test`,
            admin = await m.Usuario.create({
              empresa_id: null,
              nombre: "Administración ficticia",
              correo,
              password_hash: await require("bcryptjs").hash(password, 12),
              estado: "activo",
            }),
            role = await m.Rol.findOne({
              where: { codigo: "administrador_plataforma" },
            });
          await m.UsuarioRol.create({
            usuario_id: admin.id,
            rol_id: role.id,
            asignado_por: admin.id,
            asignado_en: new Date(),
          });
          const ap = request.agent(app);
          assert.equal(
            (await mutate(ap, "/auth/login", { correo, password })).status,
            200,
          );
          assert.equal(
            (
              await mutate(
                c.a,
                "/mi-cuenta/consentimientos",
                { comunicaciones_opcionales: true },
                "put",
              )
            ).status,
            200,
          );
          assert.equal(
            (await c.a.get("/api/mi-cuenta/consentimientos")).body
              .comunicaciones_opcionales,
            true,
          );
          assert.equal(
            (
              await mutate(
                c.a,
                "/mi-cuenta/consentimientos",
                { comunicaciones_opcionales: false },
                "put",
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(c.a, "/mi-cuenta/exportacion", {
                password: "Incorrecta_12345",
              })
            ).status,
            400,
          );
          const exported = await mutate(c.a, "/mi-cuenta/exportacion", {
            password,
          });
          assert.equal(exported.status, 200);
          assert.equal(exported.body.perfil.id, c.user);
          assert.ok(!JSON.stringify(exported.body).includes("password_hash"));
          const requested = await mutate(c.a, "/mi-cuenta/derechos", {
            tipo: "baja",
            detalle: "Solicito revisar mi baja personal de prueba.",
            password,
          });
          assert.equal(requested.status, 201);
          assert.equal(requested.body.solicitud.estado, "recibida");
          assert.equal((await m.Usuario.findByPk(c.user)).estado, "activo");
          await a.a.get("/api/administracion/derechos").expect(403);
          const review = await mutate(
            ap,
            `/administracion/derechos/${requested.body.solicitud.id}/revisar`,
            {
              motivo:
                "Pendiente validar conservación de registros compartidos.",
            },
          );
          assert.equal(review.status, 200);
          assert.equal(review.body.estado, "en_revision");
          const own = await a.a.get("/api/mi-cuenta/derechos").expect(200);
          assert.ok(
            !own.body.solicitudes.some(
              (x) => String(x.id) === String(requested.body.solicitud.id),
            ),
          );
          const generic1 = await mutate(
              request.agent(app),
              "/auth/recuperacion",
              { correo: `op-C-${tag}@example.test` },
            ),
            generic2 = await mutate(request.agent(app), "/auth/recuperacion", {
              correo: "inexistente@example.test",
            });
          assert.equal(generic1.status, 202);
          assert.deepEqual(generic1.body, generic2.body);
          assert.equal(generic1.body.correo_enviado, false);
          const payload = {
            usuario_id: c.user,
            identidad_verificada: true,
            motivo: "Identidad ficticia confirmada por canal independiente.",
          };
          assert.equal(
            (await mutate(a.a, "/administracion/recuperacion", payload)).status,
            403,
          );
          assert.equal(
            (
              await mutate(a.a, "/administracion/recuperacion", {
                ...payload,
                usuario_id: "999999999999999999",
              })
            ).status,
            403,
          );
          const first = await mutate(
            ap,
            "/administracion/recuperacion",
            payload,
          );
          assert.equal(first.status, 201);
          assert.equal(first.body.entrega.correo_enviado, false);
          const token1 = new URL(first.body.entrega.enlace).hash.split(
            "token=",
          )[1];
          const second = await mutate(
            ap,
            "/administracion/recuperacion",
            payload,
          );
          assert.equal(second.status, 201);
          const token2 = new URL(second.body.entrega.enlace).hash.split(
            "token=",
          )[1];
          const anon = request.agent(app),
            nextPassword = "NuevaFicticia_123456";
          assert.equal(
            (
              await mutate(anon, "/auth/restablecer", {
                token: token1,
                password: nextPassword,
              })
            ).status,
            410,
          );
          assert.equal(
            (
              await mutate(anon, "/auth/restablecer", {
                token: token2,
                password: nextPassword,
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(anon, "/auth/restablecer", {
                token: token2,
                password: nextPassword,
              })
            ).status,
            410,
          );
          await c.a.get("/api/auth/sesion").expect(401);
          const renewed = request.agent(app);
          assert.equal(
            (
              await mutate(renewed, "/auth/login", {
                correo: `op-C-${tag}@example.test`,
                password: nextPassword,
              })
            ).status,
            200,
          );
          await renewed.get("/api/auth/sesion").expect(200);
          const expired = randomBytes(32).toString("hex");
          await m.TokenAccion.create({
            usuario_id: c.user,
            tipo: "recuperacion",
            token_hash: require("node:crypto")
              .createHash("sha256")
              .update(expired)
              .digest("hex"),
            vence_en: new Date(Date.now() - 1000),
          });
          assert.equal(
            (
              await mutate(anon, "/auth/restablecer", {
                token: expired,
                password: nextPassword,
              })
            ).status,
            410,
          );
          const rawAudit = await m.Auditoria.findAll({
            where: { recurso_id: c.user },
          });
          assert.ok(!JSON.stringify(rawAudit).includes(token2));
          const inactive = await m.Usuario.create({
              empresa_id: a.id,
              nombre: "Integrante ficticio",
              correo: `inactive-${tag}@example.test`,
              password_hash: await require("bcryptjs").hash(password, 12),
              estado: "inactivo",
            }),
            memberRole = await m.Rol.findOne({
              where: { codigo: "gestor_materiales" },
            });
          await m.UsuarioRol.create({
            usuario_id: inactive.id,
            rol_id: memberRole.id,
            asignado_por: a.user,
            asignado_en: new Date(),
          });
          assert.equal(
            (
              await mutate(b.a, `/equipo/miembros/${inactive.id}/reactivar`, {
                motivo: "Reactivación ajena prohibida",
              })
            ).status,
            404,
          );
          assert.equal(
            (
              await mutate(a.a, `/equipo/miembros/${inactive.id}/reactivar`, {
                motivo: "Reactivar acceso del integrante",
              })
            ).status,
            200,
          );
          assert.equal(
            (await m.Usuario.findByPk(inactive.id)).estado,
            "activo",
          );
        },
      );
      await t.test(
        "cuentas globales aisladas, último administrador concurrente y políticas inmutables",
        async () => {
          const users = [];
          for (let i = 0; i < 2; i++) {
            const u = await m.Usuario.create({
                empresa_id: null,
                nombre: "Administración de prueba",
                correo: `global-${randomUUID()}@example.test`,
                password_hash: await require("bcryptjs").hash(password, 12),
                estado: "activo",
              }),
              r = await m.Rol.findOne({
                where: { codigo: "administrador_plataforma" },
              });
            await m.UsuarioRol.create({
              usuario_id: u.id,
              rol_id: r.id,
              asignado_por: u.id,
              asignado_en: new Date(),
            });
            users.push(u);
          }
          // Scope the persisted test universe to these two fixtures, preserving all
          // pre-existing accounts. Real role row locks and transactions are used.
          const scoped = {
              ...m,
              Usuario: m.Usuario.scope({
                where: { id: users.map((u) => u.id) },
              }),
            },
            svc =
              require("../src/services/platform.service").createPlatformService(
                scoped,
              ),
            auths = users.map((user) => ({
              user,
              company: null,
              permissions: ["roles_globales.gestionar", "politicas.gestionar"],
            }));
          const result = await Promise.allSettled(
            auths.map((auth, i) =>
              svc.update(
                auth,
                users[i].id,
                {
                  funciones: ["moderador"],
                  estado: "activo",
                  motivo: "Delegación concurrente ficticia comprobada.",
                },
                randomUUID(),
              ),
            ),
          );
          assert.equal(
            result.filter((r) => r.status === "fulfilled").length,
            1,
          );
          assert.equal(
            result.find((r) => r.status === "rejected").reason.status,
            409,
          );
          const remaining = await scoped.Usuario.count({
            where: { estado: "activo" },
            include: [
              {
                model: m.Rol,
                as: "roles",
                where: { codigo: "administrador_plataforma" },
                required: true,
              },
            ],
            distinct: true,
          });
          assert.equal(remaining, 1);
          const winnerIndex = result[0].status === "rejected" ? 0 : 1,
            auth = auths[winnerIndex],
            all =
              require("../src/services/platform.service").createPlatformService(
                m,
              );
          await assert.rejects(
            () =>
              all.update(auth, a.user, {
                funciones: ["moderador"],
                estado: "activo",
                motivo: "No convertir una cuenta empresarial.",
              }),
            (e) => e.status === 404,
          );
          const created = await all.create(
            auth,
            {
              nombre: "Moderación nueva ficticia",
              correo: `newglobal-${randomUUID()}@example.test`,
              password,
              funciones: ["moderador"],
              motivo: "Crear cuenta global específica de revisión.",
            },
            randomUUID(),
          );
          assert.equal(created.correo_enviado, false);
          await assert.rejects(
            () =>
              all.users({
                user: { id: created.id },
                company: null,
                permissions: [],
              }),
            (e) => e.status === 403,
          );
          const version = "local-borrador-prueba-" + randomUUID().slice(0, 8),
            before = await m.Politica.findAll({ where: { tipo: "terminos" } }),
            policy = await all.policy(
              auth,
              {
                tipo: "terminos",
                version,
                contenido:
                  "Borrador ficticio exclusivo de pruebas. No constituye términos definitivos.",
                motivo: "Versionado inmutable de un borrador ficticio.",
              },
              randomUUID(),
            );
          assert.equal(policy.estado, "borrador");
          await assert.rejects(
            () =>
              all.policy(auth, {
                tipo: "terminos",
                version,
                contenido: "No se permite reescribir esta versión.",
                motivo: "Intento de reescritura de prueba.",
              }),
            (e) => e.status === 409,
          );
          await policy.update({ vigente: false });
          for (const old of before) {
            await m.Politica.update(
              { vigente: old.vigente },
              { where: { id: old.id } },
            );
            assert.equal(
              (await m.Politica.findByPk(old.id)).contenido,
              old.contenido,
            );
          }
        },
      );
      await t.test(
        "limpieza local: revisión sin cambios y purga solo de metadatos vencidos hace 30 días",
        async () => {
          const old = new Date(Date.now() - 32 * 86400000),
            token = randomBytes(32).toString("hex");
          const row = await m.TokenAccion.create({
            usuario_id: a.user,
            tipo: "recuperacion",
            token_hash: require("node:crypto")
              .createHash("sha256")
              .update(token)
              .digest("hex"),
            vence_en: old,
            created_at: old,
            updated_at: old,
          });
          await m.sequelize
            .getQueryInterface()
            .bulkUpdate(
              "tokens_accion",
              { created_at: old, updated_at: old },
              { id: row.id },
            );
          const service =
              require("../src/services/token-retention.service").retainTokens,
            review = await service(m);
          assert.equal(review.tokens_eliminados, 0);
          assert.ok(await m.TokenAccion.findByPk(row.id));
          const applied = await service(m, { apply: true });
          assert.ok(applied.tokens_eliminados >= 1);
          assert.equal(await m.TokenAccion.findByPk(row.id), null);
          assert.ok(await m.Usuario.findByPk(a.user));
        },
      );
      await t.test(
        "fallo de auditoría revierte acuerdo y reservas",
        async () => {
          const o = await offer(a),
            r = await create(b, o, "1");
          m.Auditoria.addHook("beforeCreate", "fallo-op", (row) => {
            if (row.accion === "acuerdo.aceptado")
              throw new Error("Fallo controlado");
          });
          try {
            assert.equal(
              (
                await mutate(a.a, `/solicitudes/${r.id}/aceptar`, {
                  version: 1,
                })
              ).status,
              500,
            );
          } finally {
            m.Auditoria.removeHook("beforeCreate", "fallo-op");
          }
          assert.equal(
            (await m.Oferta.findByPk(o.id)).cantidad_reservada,
            "0.000",
          );
          assert.equal(
            await m.Acuerdo.count({ where: { solicitud_id: r.id } }),
            0,
          );
        },
      );
    } finally {
      await m.sequelize.close();
    }
  },
);
