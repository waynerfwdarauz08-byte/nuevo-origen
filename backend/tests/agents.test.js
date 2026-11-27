const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  request = require("supertest"),
  { randomUUID, randomBytes } = require("node:crypto"),
  { execFileSync } = require("node:child_process"),
  path = require("node:path");
test(
  "agentes: SQL exclusivo, permisos, cuotas y aislamiento",
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
      };
    let calls = 0,
      mode = "normal",
      wait = null;
    const providerModel = "prueba-aislada-" + randomUUID();
    const provider = {
      status: () => ({
        configurado: true,
        retencion_cero_confirmada: true,
        modelo: providerModel,
        conexion_verificada: false,
      }),
      generate: async (args) => {
        calls++;
        if (wait) await wait;
        if (mode === "failure") throw { code: "AI_RATE_LIMITED" };
        if (mode === "injection")
          return {
            respuesta: "Inventado",
            fuentes: ["empresa-ajena"],
            limitaciones: [],
          };
        return {
          respuesta:
            mode === "numbers"
              ? "Impacto: 999999999 kg."
              : "Borrador: revisá los datos declarados. Falta evidencia para certificar.",
          fuentes: [args.sourceIds[0]],
          limitaciones: ["Revisión humana necesaria."],
          uso: { entrada: 40, salida: 20 },
        };
      },
    };
    const app = require("../src/app").createApp({
        models: m,
        database: m.sequelize,
        security,
        aiProvider: provider,
      }),
      tag = randomUUID(),
      origin = "http://127.0.0.1:5173";
    const policies = (
      await request(app).get("/api/politicas")
    ).body.politicas.map((p) => ({
      tipo: p.tipo,
      version: p.version,
      aceptada: true,
    }));
    async function mutate(a, url, body) {
      const token = (await a.get("/api/auth/csrf")).body.csrfToken;
      return a
        .post("/api" + url)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send(body);
    }
    async function company(name) {
      const a = request.agent(app),
        correo = `ia-${name}-${tag}@example.test`;
      const r = await mutate(a, "/auth/registro", {
        empresa: {
          nombre: "Empresa IA ficticia " + name,
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
      return {
        a,
        id: r.body.empresa.id,
        user: r.body.usuario.id,
        auth: {
          user: { id: r.body.usuario.id },
          company: { id: r.body.empresa.id },
          permissions: r.body.permisos,
        },
      };
    }
    try {
      const a = await company("a"),
        b = await company("b"),
        meta = (await request(app).get("/api/catalogos/materiales")).body,
        unit = meta.unidades.find((u) => u.codigo === "kg").id,
        category = meta.categorias[0].id;
      async function offer(owner, state = "borrador") {
        return m.Oferta.create({
          empresa_id: owner.id,
          autor_id: owner.user,
          categoria_id: category,
          unidad_id: unit,
          titulo: "Oferta IA ficticia " + randomUUID(),
          composicion: "Cartón declarado en prueba",
          estado_material: "retazo",
          cantidad_total: "10.000",
          modalidad: "donacion",
          frecuencia: "puntual",
          ubicacion: "Cantón ficticio",
          estado: state,
          declaracion_no_peligroso: true,
          declaracion_aprovechable: true,
        });
      }
      const own = await offer(a),
        other = await offer(b),
        publicOffer = await offer(b, "publicada");
      const need = await m.Necesidad.create({
        empresa_id: a.id,
        autor_id: a.user,
        categoria_id: category,
        unidad_id: unit,
        titulo: "Necesidad ficticia",
        descripcion: "Cartón para pruebas",
        cantidad: "2.000",
        ubicacion: "Cantón ficticio",
        estado: "activa",
      });
      const body = (agente, extra = {}) => ({
        agente,
        pregunta: "Revisá la información disponible.",
        clave_cliente: randomUUID(),
        ...extra,
      });
      await t.test(
        "sin sesión y sin CSRF se rechaza antes de llamar al proveedor",
        async () => {
          await request(app).get("/api/ia").expect(401);
          await a.a.post("/api/ia/ejecuciones").send(body("AG-01")).expect(403);
          assert.equal(calls, 0);
        },
      );
      await t.test(
        "catálogo real separa disponibles y RAG pendiente, sin clave expuesta",
        async () => {
          const r = await a.a.get("/api/ia").expect(200);
          assert.equal(r.body.agentes.length, 8);
          assert.equal(
            r.body.agentes.find((a) => a.codigo === "AG-05").disponible,
            false,
          );
          assert.ok(!JSON.stringify(r.body).includes("GROQ_API_KEY"));
        },
      );
      await t.test(
        "empresa ajena, campo empresa/rol y combinación no permitida se rechazan",
        async () => {
          for (const extra of [
            { oferta_id: String(other.id) },
            { oferta_id: String(own.id), empresa_id: b.id },
            { oferta_id: String(own.id), rol: "administrador_plataforma" },
            { oferta_id: String(own.id), solicitud_id: "1" },
          ]) {
            const r = await mutate(
              a.a,
              "/ia/ejecuciones",
              body("AG-02", extra),
            );
            assert.ok([400, 404].includes(r.status));
          }
          assert.equal(calls, 0);
        },
      );
      await t.test(
        "caracterización propia, cita autorizada, idempotencia y no publicación",
        async () => {
          const input = body("AG-02", { oferta_id: String(own.id) }),
            r = await mutate(a.a, "/ia/ejecuciones", input);
          assert.equal(r.status, 201, JSON.stringify(r.body));
          assert.equal(r.body.fuentes[0].id, "oferta:" + own.id);
          assert.equal(r.body.ejecucion.tokens_entrada, 40);
          const before = calls,
            replay = await mutate(a.a, "/ia/ejecuciones", input);
          assert.equal(replay.status, 200);
          assert.equal(calls, before);
          assert.equal(replay.body.reutilizada, true);
          assert.equal((await m.Oferta.findByPk(own.id)).estado, "borrador");
          assert.equal(
            (
              await mutate(a.a, "/ia/ejecuciones", {
                ...input,
                pregunta: "Otra pregunta diferente",
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "sin corpus los agentes 4/5 no inventan respuestas ni consumen IA",
        async () => {
          const before = calls;
          for (const agent of ["AG-04", "AG-05"]) {
            const r = await mutate(a.a, "/ia/ejecuciones", body(agent));
            assert.equal(r.status, 503);
            assert.equal(r.body.error.code, "AI_CORPUS_PENDING");
          }
          assert.equal(calls, before);
        },
      );
      await t.test(
        "compatibilidad usa necesidad propia y candidatos publicados; nunca borradores ajenos",
        async () => {
          const r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-03", { necesidad_id: String(need.id) }),
          );
          assert.equal(r.status, 201, JSON.stringify(r.body));
          assert.ok(
            r.body.datos_verificados.candidatos.some(
              (s) => s.id === "oferta:" + publicOffer.id,
            ),
          );
          assert.ok(
            !r.body.datos_verificados.candidatos.some(
              (s) => s.id === "oferta:" + other.id,
            ),
          );
        },
      );
      await t.test(
        "orquestador enruta solo a herramienta autorizada",
        async () => {
          const r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-01", {
              oferta_id: String(own.id),
              pregunta: "Caracterizá el material declarado.",
            }),
          );
          assert.equal(r.status, 201);
          assert.deepEqual(r.body.agentes_usados, ["AG-01", "AG-02"]);
        },
      );
      await t.test(
        "plataforma solo recibe agregados globales y moderación exige caso asignado",
        async () => {
          async function globalUser(code) {
            const role = await m.Rol.findOne({ where: { codigo: code } }),
              existing = await m.Usuario.unscoped().findByPk(a.user);
            const user = await m.Usuario.create({
              empresa_id: null,
              nombre: "Persona global ficticia",
              correo: `${code}-${tag}@example.test`,
              password_hash: existing.password_hash,
              estado: "activo",
            });
            await m.UsuarioRol.create({
              usuario_id: user.id,
              rol_id: role.id,
              asignado_por: user.id,
              asignado_en: new Date(),
            });
            const client = request.agent(app),
              login = await mutate(client, "/auth/login", {
                correo: user.correo,
                password: "PasswordFicticio_12345",
              });
            assert.equal(login.status, 200);
            return {
              client,
              user,
              auth: {
                user: { id: user.id },
                company: null,
                permissions: login.body.permisos,
              },
            };
          }
          const platform = await globalUser("administrador_plataforma"),
            moderator = await globalUser("moderador");
          const r = await mutate(
            platform.client,
            "/ia/ejecuciones",
            body("AG-07", { desde: "2090-01-01", hasta: "2090-01-31" }),
          );
          assert.equal(r.status, 201, JSON.stringify(r.body));
          assert.equal(
            r.body.datos_verificados.indicadores.alcance,
            "agregados_globales_sin_empresas",
          );
          assert.ok(
            !JSON.stringify(r.body.datos_verificados).includes("empresa_id"),
          );
          assert.equal(
            (
              await mutate(
                platform.client,
                "/ia/ejecuciones",
                body("AG-02", { oferta_id: String(own.id) }),
              )
            ).status,
            403,
          );
          const incident = await m.Incidencia.create({
            reportante_id: a.user,
            oferta_id: publicOffer.id,
            motivo: "Revisión ficticia",
            estado: "en_revision",
            revisor_id: moderator.user.id,
          });
          assert.equal(
            (
              await mutate(
                platform.client,
                "/ia/ejecuciones",
                body("AG-08", { caso_id: String(incident.id) }),
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await mutate(
                moderator.client,
                "/ia/ejecuciones",
                body("AG-08", { caso_id: String(incident.id) }),
              )
            ).status,
            201,
          );
          const after = await m.Incidencia.findByPk(incident.id);
          assert.equal(after.estado, "en_revision");
          assert.equal(after.resolucion, null);
        },
      );
      await t.test(
        "seguimiento consulta acuerdo real e historial sin enviar mensajes",
        async () => {
          const created = await mutate(a.a, "/solicitudes", {
            oferta_id: String(publicOffer.id),
            cantidad: "1.000",
            condiciones: "Coordinación ficticia de prueba",
          });
          assert.equal(created.status, 201);
          const accepted = await mutate(
            b.a,
            `/solicitudes/${created.body.id}/aceptar`,
            { version: 1 },
          );
          assert.equal(accepted.status, 201);
          const tool = await require("../src/services/agents/tools")
            .createTools(m)
            .prepare(a.auth, {
              agente: "AG-06",
              solicitud_id: String(created.body.id),
              pregunta: "Explicá el estado del acuerdo.",
            });
          assert.ok(
            tool.sources.some((s) => s.id === "acuerdo:" + accepted.body.id),
          );
          const count = await m.Mensaje.count({
            where: { solicitud_id: created.body.id },
          });
          const response = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-06", { solicitud_id: String(created.body.id) }),
          );
          assert.equal(response.status, 201);
          assert.equal(
            await m.Mensaje.count({ where: { solicitud_id: created.body.id } }),
            count,
          );
        },
      );
      await t.test(
        "fuentes inventadas y cifras ajenas a SQL no llegan al usuario",
        async () => {
          mode = "injection";
          let r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-02", { oferta_id: String(own.id) }),
          );
          assert.equal(r.status, 503);
          assert.equal(r.body.error.code, "AI_RESPONSE_INVALID");
          mode = "numbers";
          r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-07", { desde: "2026-01-01", hasta: "2026-12-31" }),
          );
          assert.equal(r.status, 503);
          assert.equal(r.body.error.code, "AI_RESPONSE_INVALID");
          mode = "normal";
        },
      );
      await t.test(
        "revisión de borrador no cambia estado y el historial es solo propio",
        async () => {
          const r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-08", { oferta_id: String(own.id) }),
          );
          assert.equal(r.status, 201);
          const h = await a.a.get("/api/ia/ejecuciones").expect(200),
            hb = await b.a.get("/api/ia/ejecuciones").expect(200);
          assert.ok(h.body.ejecuciones.length > 0);
          assert.equal(hb.body.ejecuciones.length, 0);
          assert.ok(
            h.body.ejecuciones.every(
              (r) => !("respuesta_json" in r) && !("entrada_hash" in r),
            ),
          );
        },
      );
      await t.test(
        "sesión con función retirada deja de poder usar el agente",
        async () => {
          const links = await m.UsuarioRol.findAll({
            where: { usuario_id: b.user },
            raw: true,
          });
          await m.UsuarioRol.destroy({ where: { usuario_id: b.user } });
          const role = await m.Rol.findOne({
            where: { codigo: "analista_impacto" },
          });
          await m.UsuarioRol.create({
            usuario_id: b.user,
            rol_id: role.id,
            asignado_por: b.user,
            asignado_en: new Date(),
          });
          const before = calls;
          const r = await mutate(
            b.a,
            "/ia/ejecuciones",
            body("AG-02", { oferta_id: String(other.id) }),
          );
          assert.equal(r.status, 403);
          assert.equal(calls, before);
          await m.UsuarioRol.destroy({ where: { usuario_id: b.user } });
          await m.UsuarioRol.bulkCreate(links);
        },
      );
      await t.test(
        "concurrencia misma clave hace una sola llamada y rollback de auditoría no consume proveedor",
        async () => {
          let release;
          wait = new Promise((r) => (release = r));
          const input = body("AG-02", { oferta_id: String(own.id) }),
            before = calls;
          const first = mutate(a.a, "/ia/ejecuciones", input);
          const pending = Promise.resolve(first);
          for (let tries = 0; calls === before && tries < 100; tries++)
            await new Promise((r) => setTimeout(r, 10));
          assert.equal(calls, before + 1);
          const second = await mutate(a.a, "/ia/ejecuciones", input);
          assert.equal(second.status, 409);
          release();
          const result = await pending;
          wait = null;
          assert.equal(result.status, 201);
          assert.equal(calls, before + 1);
          m.Auditoria.addHook("beforeCreate", "fail-ia", () => {
            throw new Error("Fallo ficticio");
          });
          const count = await m.EjecucionIA.count({
              where: { usuario_id: a.user },
            }),
            prior = calls;
          try {
            assert.equal(
              (
                await mutate(
                  a.a,
                  "/ia/ejecuciones",
                  body("AG-02", { oferta_id: String(own.id) }),
                )
              ).status,
              500,
            );
          } finally {
            m.Auditoria.removeHook("beforeCreate", "fail-ia");
          }
          assert.equal(calls, prior);
          assert.equal(
            await m.EjecucionIA.count({ where: { usuario_id: a.user } }),
            count,
          );
        },
      );
      await t.test(
        "baja durante consulta impide entregar respuesta aunque Groq ya haya procesado",
        async () => {
          let release;
          wait = new Promise((resolve) => (release = resolve));
          const before = calls,
            pending = Promise.resolve(
              mutate(
                a.a,
                "/ia/ejecuciones",
                body("AG-02", { oferta_id: String(own.id) }),
              ),
            );
          for (let tries = 0; calls === before && tries < 100; tries++)
            await new Promise((r) => setTimeout(r, 10));
          assert.equal(calls, before + 1);
          try {
            await m.Usuario.update(
              { estado: "inactivo" },
              { where: { id: a.user } },
            );
            release();
            const r = await pending;
            assert.equal(r.status, 401);
            assert.ok(!r.body.respuesta);
          } finally {
            wait = null;
            release();
            await m.Usuario.update(
              { estado: "activo" },
              { where: { id: a.user } },
            );
          }
        },
      );
      await t.test(
        "fallo de proveedor queda registrado, sin mensaje simulado ni efectos de negocio",
        async () => {
          mode = "failure";
          const r = await mutate(
            a.a,
            "/ia/ejecuciones",
            body("AG-02", { oferta_id: String(own.id) }),
          );
          mode = "normal";
          assert.equal(r.status, 429);
          const h = (await a.a.get("/api/ia/ejecuciones")).body.ejecuciones;
          assert.equal(h[0].estado, "fallida");
          assert.equal(h[0].error_codigo, "AI_RATE_LIMITED");
        },
      );
      await t.test(
        "tiempo de espera del proveedor persiste y evita nuevas llamadas",
        async () => {
          const before = calls,
            r = await mutate(a.a, "/ia/ejecuciones", body("AG-01"));
          assert.equal(r.status, 429);
          assert.equal(r.body.error.code, "AI_RATE_LIMITED");
          assert.equal(calls, before);
        },
      );
      await t.test(
        "cuota diaria persistida bloquea antes del proveedor",
        async () => {
          const agent = await m.Agente.findOne({ where: { codigo: "AG-01" } });
          const n = await m.EjecucionIA.count({
            where: {
              usuario_id: b.user,
              fecha: {
                [require("sequelize").Op.gte]: new Date(
                  new Date().setUTCHours(0, 0, 0, 0),
                ),
              },
            },
          });
          await m.EjecucionIA.bulkCreate(
            Array.from({ length: 20 - n }, () => ({
              agente_id: agent.id,
              usuario_id: b.user,
              empresa_id: b.id,
              modelo: "fixture",
              version_prompt: "1.0.0",
              clave_cliente: randomUUID(),
              entrada_hash: "a".repeat(64),
              contexto_hash: "b".repeat(64),
              estado: "fallida",
              fecha: new Date(),
              fuentes_json: [],
            })),
          );
          const before = calls,
            r = await mutate(b.a, "/ia/ejecuciones", body("AG-01"));
          assert.equal(r.status, 429);
          assert.equal(r.body.error.code, "AI_QUOTA");
          assert.equal(calls, before);
        },
      );
    } finally {
      await m.sequelize.close();
    }
  },
);
