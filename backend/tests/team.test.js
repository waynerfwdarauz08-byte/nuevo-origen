const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { randomUUID, randomBytes, createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
test(
  "equipo e invitaciones con MySQL exclusivo",
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
    const m = require("../src/models");
    const security = {
      ...require("../src/config/security").readSecurity({
        JWT_SECRET: randomBytes(48).toString("hex"),
      }),
      registerLimit: 200,
      inviteLimit: 500,
      loginLimit: 200,
      ipLimit: 500,
    };
    const app = require("../src/app").createApp({
      database: m.sequelize,
      models: m,
      security,
    });
    const origin = "http://127.0.0.1:5173",
      tag = randomUUID(),
      password = "PruebaLocal_segura_123";
    let serial = 0;
    const policies = (await request(app).get("/api/politicas")).body.politicas;
    const accepts = policies.map((p) => ({
      tipo: p.tipo,
      version: p.version,
      aceptada: true,
    }));
    const agent = () => request.agent(app);
    async function mutate(a, url, body, method = "post") {
      const csrf = (await a.get("/api/auth/csrf").expect(200)).body.csrfToken;
      return a[method]("/api" + url)
        .set("Origin", origin)
        .set("X-CSRF-Token", csrf)
        .send(body);
    }
    const email = () => `equipo-${tag}-${++serial}@example.test`;
    async function company() {
      const a = agent(),
        correo = email();
      const r = await mutate(a, "/auth/registro", {
        empresa: {
          nombre: "Empresa ficticia equipo",
          sector: "Pruebas",
          correo_contacto: correo,
          ubicacion_publica: "Cantón ficticio",
        },
        usuario: { nombre: "Administrador ficticio", correo, password },
        aceptaciones: accepts,
        comunicaciones_opcionales: false,
      });
      assert.equal(r.status, 201);
      return { a, user: r.body.usuario, company: r.body.empresa, correo };
    }
    async function invite(owner, funciones = ["gestor_materiales"]) {
      const correo = email(),
        r = await mutate(owner.a, "/equipo/invitaciones", {
          correo,
          funciones,
        });
      assert.equal(r.status, 201);
      return {
        correo,
        id: r.body.invitacion.id,
        token: new URL(r.body.entrega.enlace).hash.slice(7),
        response: r.body,
      };
    }
    const body = (i) => ({
      token: i.token,
      nombre: "Integrante ficticio",
      password,
      aceptaciones: accepts,
      comunicaciones_opcionales: false,
    });
    async function accept(i) {
      const a = agent(),
        r = await mutate(a, "/invitaciones/aceptar", body(i));
      assert.equal(r.status, 201);
      return { a, user: r.body.usuario, company: r.body.empresa };
    }
    const funcs = (owner, target, functions) =>
      mutate(
        owner.a,
        `/equipo/miembros/${target.user.id}/funciones`,
        { funciones: functions, motivo: "Prueba de funciones" },
        "patch",
      );
    const deactivate = (owner, target) =>
      mutate(owner.a, `/equipo/miembros/${target.user.id}/desactivar`, {
        motivo: "Prueba de desactivación",
      });
    try {
      const a = await company(),
        b = await company();
      let member;
      await t.test(
        "invitación segura, aceptación transaccional, uso único y persistencia",
        async () => {
          const i = await invite(a, ["gestor_materiales", "analista_impacto"]);
          assert.equal(i.token.length, 64);
          assert.equal(i.response.entrega.correo_enviado, false);
          const row = await m.TokenAccion.unscoped().findOne({
            where: {
              token_hash: createHash("sha256").update(i.token).digest("hex"),
            },
          });
          assert.ok(row);
          assert.notEqual(row.token_hash, i.token);
          const list = await a.a.get("/api/equipo/invitaciones").expect(200);
          assert.ok(!JSON.stringify(list.body).includes(i.token));
          assert.ok(!JSON.stringify(list.body).includes("token_hash"));
          assert.ok(!JSON.stringify(list.body).includes("enlace"));
          assert.equal(
            (
              await mutate(agent(), "/invitaciones/consultar", {
                token: i.token,
              })
            ).status,
            200,
          );
          member = await accept(i);
          assert.equal(String(member.company.id), String(a.company.id));
          await member.a.get("/api/auth/sesion").expect(200);
          assert.equal(
            (await mutate(agent(), "/invitaciones/aceptar", body(i))).status,
            410,
          );
          assert.equal(
            await m.Aceptacion.count({ where: { usuario_id: member.user.id } }),
            2,
          );
          assert.equal((await a.a.get("/api/equipo")).body.total, 2);
        },
      );
      await t.test(
        "vencidas, revocadas, desconocidas y duplicadas",
        async () => {
          const i = await invite(a);
          assert.equal(
            (
              await mutate(a.a, "/equipo/invitaciones", {
                correo: i.correo,
                funciones: ["gestor_materiales"],
              })
            ).status,
            409,
          );
          const row = await m.Invitacion.findByPk(i.id);
          await m.TokenAccion.update(
            { vence_en: new Date(Date.now() - 10000) },
            { where: { id: row.token_accion_id } },
          );
          assert.equal(
            (await mutate(agent(), "/invitaciones/aceptar", body(i))).status,
            410,
          );
          const r = await invite(a);
          assert.equal(
            (
              await mutate(a.a, `/equipo/invitaciones/${r.id}/revocar`, {
                motivo: "Revocación de prueba",
              })
            ).status,
            200,
          );
          assert.equal(
            (await mutate(agent(), "/invitaciones/aceptar", body(r))).status,
            410,
          );
          assert.equal(
            (
              await mutate(agent(), "/invitaciones/consultar", {
                token: "a".repeat(64),
              })
            ).status,
            410,
          );
        },
      );
      await t.test(
        "permisos, roles globales, campos prohibidos y aislamiento",
        async () => {
          await request(app).get("/api/equipo").expect(401);
          await member.a.get("/api/equipo").expect(403);
          assert.equal(
            (
              await mutate(a.a, "/equipo/invitaciones", {
                correo: email(),
                funciones: ["administrador_plataforma"],
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(a.a, "/equipo/invitaciones", {
                correo: email(),
                funciones: ["gestor_materiales"],
                empresa_id: b.company.id,
              })
            ).status,
            400,
          );
          assert.equal(
            (await funcs(b, member, ["gestor_acuerdos"])).status,
            404,
          );
          assert.equal((await deactivate(b, member)).status, 404);
          const i = await invite(a);
          assert.equal(
            (
              await mutate(b.a, `/equipo/invitaciones/${i.id}/revocar`, {
                motivo: "Intento entre empresas",
              })
            ).status,
            404,
          );
          const list = await b.a
            .get("/api/equipo?empresa_id=" + a.company.id)
            .expect(200);
          assert.equal(list.body.total, 1);
          assert.equal(
            (
              await mutate(agent(), "/invitaciones/aceptar", {
                ...body(i),
                roles: ["administrador_empresa"],
              })
            ).status,
            400,
          );
        },
      );
      await t.test(
        "funciones combinables y retirada efectiva en sesiones abiertas",
        async () => {
          assert.equal(
            (
              await funcs(a, member, [
                "administrador_empresa",
                "gestor_acuerdos",
              ])
            ).status,
            200,
          );
          await member.a.get("/api/equipo").expect(200);
          const pending = await invite(member);
          assert.equal(
            (await funcs(a, member, ["analista_impacto", "gestor_materiales"]))
              .status,
            200,
          );
          await member.a.get("/api/equipo").expect(403);
          assert.equal(
            (await mutate(agent(), "/invitaciones/aceptar", body(pending)))
              .status,
            410,
          );
          assert.equal((await funcs(a, member, [])).status, 200);
          await member.a.get("/api/mi-empresa").expect(403);
          const session = await member.a.get("/api/auth/sesion").expect(200);
          assert.deepEqual(session.body.permisos, []);
          assert.equal(session.body.empresa.correo_contacto, undefined);
        },
      );
      await t.test(
        "desactivación revoca accesos sin borrar empresa ni usuario",
        async () => {
          assert.equal((await deactivate(a, member)).status, 200);
          await member.a.get("/api/auth/sesion").expect(401);
          const login = await mutate(agent(), "/auth/login", {
            correo: (await m.Usuario.findByPk(member.user.id)).correo,
            password,
          });
          assert.equal(login.status, 401);
          assert.ok(await m.Empresa.findByPk(a.company.id));
        },
      );
      await t.test(
        "último administrador: retiro y desactivación bloqueados",
        async () => {
          assert.equal((await funcs(a, a, [])).status, 409);
          assert.equal((await deactivate(a, a)).status, 409);
          await a.a.get("/api/equipo").expect(200);
        },
      );
      await t.test(
        "auditoría y reversión completa si falla el registro de auditoría",
        async () => {
          const before = await m.Invitacion.count({
              where: { empresa_id: a.company.id },
            }),
            tokens = await m.TokenAccion.count();
          m.Auditoria.addHook("beforeCreate", "fallo-prueba", () => {
            throw new Error("Fallo controlado de auditoría");
          });
          try {
            assert.equal(
              (
                await mutate(a.a, "/equipo/invitaciones", {
                  correo: email(),
                  funciones: ["gestor_materiales"],
                })
              ).status,
              500,
            );
          } finally {
            m.Auditoria.removeHook("beforeCreate", "fallo-prueba");
          }
          assert.equal(
            await m.Invitacion.count({ where: { empresa_id: a.company.id } }),
            before,
          );
          assert.equal(await m.TokenAccion.count(), tokens);
          const log = await a.a.get("/api/equipo/auditoria").expect(200);
          assert.ok(log.body.eventos.length > 0);
          assert.ok(log.body.eventos.every((e) => e.actor_id && e.request_id));
          assert.ok(!JSON.stringify(log.body).includes("token"));
          assert.equal((await b.a.get("/api/equipo/auditoria")).body.total, 0);
        },
      );
      await t.test(
        "aceptaciones concurrentes consumen el token una sola vez",
        async () => {
          const i = await invite(a),
            results = await Promise.all([
              mutate(agent(), "/invitaciones/aceptar", body(i)),
              mutate(agent(), "/invitaciones/aceptar", body(i)),
            ]);
          assert.deepEqual(results.map((r) => r.status).sort(), [201, 410]);
          assert.equal(
            await m.Usuario.count({ where: { correo: i.correo } }),
            1,
          );
        },
      );
      for (const mode of [
        "retiro propio",
        "retiro cruzado",
        "desactivación propia",
      ])
        await t.test("concurrencia: " + mode, async () => {
          const x = await company(),
            y = await accept(await invite(x, ["administrador_empresa"]));
          // Ambos pedidos se encolan detrás de la misma fila antes de liberar el bloqueo.
          const held = await m.sequelize.transaction();
          await m.Empresa.findByPk(x.company.id, {
            transaction: held,
            lock: held.LOCK.UPDATE,
          });
          let waiting = 0;
          m.Empresa.addHook("beforeFind", "barrera-equipo", (options) => {
            if (
              options.lock &&
              options.transaction &&
              options.transaction.id !== held.id
            )
              waiting++;
          });
          const resultsPromise = Promise.all(
            mode === "retiro propio"
              ? [funcs(x, x, []), funcs(y, y, [])]
              : mode === "retiro cruzado"
                ? [funcs(x, y, []), funcs(y, x, [])]
                : [deactivate(x, x), deactivate(y, y)],
          );
          try {
            for (let n = 0; n < 100 && waiting < 2; n++)
              await new Promise((resolve) => setTimeout(resolve, 20));
            assert.equal(waiting, 2);
          } finally {
            await held.commit();
            m.Empresa.removeHook("beforeFind", "barrera-equipo");
          }
          const statuses = (await resultsPromise).map((r) => r.status).sort();
          assert.deepEqual(
            statuses,
            mode === "retiro cruzado" ? [200, 403] : [200, 409],
          );
          const count = await m.Usuario.count({
            where: { empresa_id: x.company.id, estado: "activo" },
            include: [
              {
                model: m.Rol,
                as: "roles",
                where: { codigo: "administrador_empresa" },
                required: true,
              },
            ],
            distinct: true,
          });
          assert.equal(count, 1);
        });
      await t.test(
        "sin entrega manual habilitada no se simula correo",
        async () => {
          const disabled =
            require("../src/services/team.service").createTeamService(
              m,
              require("../src/services/identity.service").createIdentityService(
                m,
                security,
              ),
              { ...security, manualInvitations: false },
            );
          const user = await m.Usuario.findByPk(a.user.id),
            company = await m.Empresa.findByPk(a.company.id);
          await assert.rejects(
            disabled.create(
              {
                user,
                company,
                roles: ["administrador_empresa"],
                permissions: ["equipo.gestionar"],
              },
              { correo: email(), funciones: ["gestor_materiales"] },
              randomUUID(),
            ),
            (e) => e.status === 503,
          );
        },
      );
    } finally {
      await m.sequelize.close();
    }
  },
);
