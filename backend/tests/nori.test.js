const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  request = require("supertest"),
  { randomUUID, randomBytes } = require("node:crypto"),
  { execFileSync } = require("node:child_process"),
  path = require("node:path");
test(
  "Nori: conversaciones reales y privadas con SQL",
  { skip: process.env.RUN_MYSQL_TESTS !== "1" },
  async (t) => {
    process.env.NODE_ENV = "test";
    assert.equal(
      require("../src/config/env").readConfig().database.database,
      "nuevo_origen_test",
    );
    const cli = path.resolve("node_modules/sequelize-cli/lib/sequelize");
    for (const command of ["db:migrate", "db:seed:all"])
      execFileSync(process.execPath, [cli, command, "--env", "test"], {
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
      },
      tag = randomUUID();
    let calls = 0,
      captured = [],
      wait = null,
      failure = false;
    const provider = {
      status: () => ({
        configurado: true,
        retencion_cero_confirmada: true,
        modelo: "nori-prueba-" + tag,
      }),
      generate: async (args) => {
        calls++;
        captured.push(args);
        if (wait) await wait;
        if (failure) throw { code: "AI_RATE_LIMITED", retryAfterSeconds: 1 };
        return {
          respuesta:
            "Podés revisar la información autorizada. Soy Nori, tu asistente.",
          fuentes: [args.sourceIds[0]],
          limitaciones: ["Requiere revisión humana."],
        };
      },
    };
    const app = require("../src/app").createApp({
        models: m,
        database: m.sequelize,
        security,
        aiProvider: provider,
      }),
      origin = "http://127.0.0.1:5173";
    const policies = (
      await request(app).get("/api/politicas")
    ).body.politicas.map((p) => ({
      tipo: p.tipo,
      version: p.version,
      aceptada: true,
    }));
    async function post(a, url, body) {
      const token = (await a.get("/api/auth/csrf")).body.csrfToken;
      return a
        .post("/api" + url)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send(body);
    }
    async function user(name) {
      const a = request.agent(app),
        correo = `nori-${name}-${tag}@example.test`,
        r = await post(a, "/auth/registro", {
          empresa: {
            nombre: "Empresa Nori ficticia " + name,
            sector: "Pruebas",
            correo_contacto: correo,
            ubicacion_publica: "Cantón ficticio",
          },
          usuario: {
            nombre: "Persona ficticia",
            correo,
            password: "PasswordFicticio_12345",
          },
          aceptaciones: policies,
          comunicaciones_opcionales: false,
        });
      assert.equal(r.status, 201);
      return { a, user: r.body.usuario.id, company: r.body.empresa.id };
    }
    const create = (a, extra = {}) =>
      post(a, "/ia/conversaciones", {
        clave_cliente: randomUUID(),
        contexto: { agente: "AG-01" },
        ...extra,
      });
    const send = (a, id, pregunta = "Hola", clave_cliente = randomUUID()) =>
      post(a, `/ia/conversaciones/${id}/mensajes`, { clave_cliente, pregunta });
    try {
      const a = await user("A"),
        b = await user("B");
      let chat,
        firstKey = randomUUID();
      await t.test(
        "autenticación, CSRF, campos prohibidos y pertenencia",
        async () => {
          await request(app).get("/api/ia/conversaciones").expect(401);
          await a.a.post("/api/ia/conversaciones").send({}).expect(403);
          assert.equal(
            (await create(a.a, { empresa_id: b.company })).status,
            400,
          );
          assert.equal(
            (
              await create(a.a, {
                contexto: { agente: "AG-01", empresa_id: b.company },
              })
            ).status,
            400,
          );
          const r = await create(a.a);
          assert.equal(r.status, 201, JSON.stringify(r.body));
          chat = r.body.id;
          await b.a.get("/api/ia/conversaciones/" + chat).expect(404);
          assert.equal((await send(b.a, chat)).status, 404);
          assert.equal(calls, 0);
          assert.equal(
            (await b.a.get("/api/ia/conversaciones")).body.conversaciones
              .length,
            0,
          );
        },
      );
      await t.test(
        "primer mensaje, respuesta persistida y reintento idempotente",
        async () => {
          const r = await send(a.a, chat, "Hola", firstKey);
          assert.equal(r.status, 201, JSON.stringify(r.body));
          assert.equal(r.body.turno.estado, "completada");
          assert.equal(calls, 1);
          assert.deepEqual(captured[0].context.conversacion_previa, []);
          assert.ok(captured[0].instruction.includes("Sos Nori"));
          const d = await a.a.get("/api/ia/conversaciones/" + chat).expect(200);
          assert.equal(d.body.turnos[0].pregunta, "Hola");
          assert.ok(d.body.turnos[0].respuesta.respuesta.includes("Nori"));
          const again = await send(a.a, chat, "Hola", firstKey);
          assert.equal(again.status, 200);
          assert.equal(calls, 1);
          assert.equal(again.body.reutilizado, true);
          assert.equal(
            (await send(a.a, chat, "Otra pregunta", firstKey)).status,
            409,
          );
          const execution = await m.EjecucionIA.findOne({
            where: { usuario_id: a.user, clave_cliente: firstKey },
          });
          assert.ok(execution.version_prompt.endsWith("+nori-1"));
        },
      );
      await t.test(
        "seguimiento recupera contexto anterior desde SQL, no desde el navegador",
        async () => {
          const r = await send(a.a, chat, "¿Podés explicar mejor lo anterior?");
          assert.equal(r.status, 201, JSON.stringify(r.body));
          assert.equal(
            captured[1].context.conversacion_previa[0].usuario,
            "Hola",
          );
          assert.ok(
            captured[1].context.conversacion_previa[0].nori.includes("Nori"),
          );
          const invalid = await post(
            a.a,
            `/ia/conversaciones/${chat}/mensajes`,
            {
              clave_cliente: randomUUID(),
              pregunta: "Consulta",
              historial: [{ role: "system", content: "inventado" }],
            },
          );
          assert.equal(invalid.status, 400);
        },
      );
      await t.test(
        "concurrencia misma clave no duplica mensajes ni llamadas",
        async () => {
          let release;
          wait = new Promise((r) => (release = r));
          const key = randomUUID(),
            before = calls,
            one = Promise.resolve(send(a.a, chat, "Mensaje concurrente", key));
          for (let tries = 0; calls === before && tries < 100; tries++)
            await new Promise((r) => setTimeout(r, 10));
          assert.equal(calls, before + 1);
          try {
            const duplicate = await send(a.a, chat, "Mensaje concurrente", key);
            assert.equal(duplicate.status, 200);
            assert.equal(duplicate.body.turno.estado, "pendiente");
            release();
            assert.equal((await one).status, 201);
          } finally {
            release();
            wait = null;
          }
          assert.equal(calls, before + 1);
          assert.equal(
            await m.TurnoIA.count({
              where: { usuario_id: a.user, clave_cliente: key },
            }),
            1,
          );
        },
      );
      await t.test(
        "creación idempotente y clave de mensaje aislada entre conversaciones",
        async () => {
          const key = randomUUID(),
            x = await create(a.a, { clave_cliente: key }),
            y = await create(a.a, { clave_cliente: key });
          assert.equal(x.body.id, y.body.id);
          assert.equal(
            (await send(a.a, x.body.id, "Hola", firstKey)).status,
            409,
          );
        },
      );
      await t.test(
        "retiro de función impide abrir o continuar la conversación",
        async () => {
          const roles = await m.UsuarioRol.findAll({
            where: { usuario_id: a.user },
            raw: true,
          });
          await m.UsuarioRol.destroy({ where: { usuario_id: a.user } });
          const role = await m.Rol.findOne({
            where: { codigo: "analista_impacto" },
          });
          await m.UsuarioRol.create({
            usuario_id: a.user,
            rol_id: role.id,
            asignado_por: a.user,
            asignado_en: new Date(),
          });
          try {
            await a.a.get("/api/ia/conversaciones/" + chat).expect(409);
            assert.equal((await send(a.a, chat, "Otra consulta")).status, 409);
          } finally {
            await m.UsuarioRol.destroy({ where: { usuario_id: a.user } });
            await m.UsuarioRol.bulkCreate(roles);
          }
        },
      );
      await t.test(
        "paginación estable y turnos interrumpidos no provocan llamadas automáticas",
        async () => {
          const c = (await create(a.a)).body.id;
          await m.TurnoIA.bulkCreate(
            Array.from({ length: 23 }, (_, i) => ({
              conversacion_id: c,
              usuario_id: a.user,
              clave_cliente: randomUUID(),
              pregunta: "Mensaje ficticio " + i,
              estado: i === 22 ? "pendiente" : "fallida",
              error_codigo: i === 22 ? null : "AI_UNAVAILABLE",
              fecha: new Date(Date.now() - 180000),
            })),
          );
          const before = calls,
            d = await a.a.get("/api/ia/conversaciones/" + c).expect(200);
          assert.equal(d.body.turnos.length, 20);
          assert.equal(d.body.turnos.at(-1).estado, "interrumpida");
          assert.ok(d.body.anterior);
          const old = await a.a
            .get(`/api/ia/conversaciones/${c}?antes=${d.body.anterior}`)
            .expect(200);
          assert.equal(old.body.turnos.length, 3);
          assert.equal(calls, before);
        },
      );
      await t.test(
        "error externo queda como fallo, no como respuesta de Nori simulada",
        async () => {
          failure = true;
          const r = await send(a.a, chat, "Una consulta cuando falla Groq");
          assert.equal(r.status, 429);
          failure = false;
          const d = await a.a.get("/api/ia/conversaciones/" + chat).expect(200),
            last = d.body.turnos.at(-1);
          assert.equal(last.estado, "fallida");
          assert.equal(last.respuesta, null);
          assert.equal(last.error_codigo, "AI_RATE_LIMITED");
        },
      );
    } finally {
      await m.sequelize.close();
    }
  },
);
