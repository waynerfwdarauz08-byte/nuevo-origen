const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { randomUUID, randomBytes, createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { readSecurity } = require("../src/config/security");
test("cookies previstas para HTTPS y validación de configuración de identidad", () => {
  const c = readSecurity({
    NODE_ENV: "production",
    JWT_SECRET: "x".repeat(64),
    APP_ORIGINS: "https://app.example.test",
  });
  assert.equal(c.secure, true);
  assert.ok(c.cookieName.startsWith("__Host-"));
  assert.throws(() => readSecurity({ JWT_SECRET: "corta" }));
  assert.throws(() =>
    readSecurity({
      JWT_SECRET: "x".repeat(64),
      NODE_ENV: "production",
      APP_ORIGINS: "http://app.example.test",
    }),
  );
  assert.notEqual(
    readSecurity({ NODE_ENV: "test", JWT_SECRET: "x".repeat(64) }).jwtSecret,
    readSecurity({ NODE_ENV: "development", JWT_SECRET: "x".repeat(64) })
      .jwtSecret,
  );
});
test(
  "identidad real con MySQL exclusivo: registro, sesión, permisos y aislamiento",
  { skip: process.env.RUN_MYSQL_TESTS !== "1" },
  async (t) => {
    process.env.NODE_ENV = "test";
    const { readConfig } = require("../src/config/env");
    assert.equal(readConfig().database.database, "nuevo_origen_test");
    const cli = path.resolve("node_modules/sequelize-cli/lib/sequelize");
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, "--env", "test"], {
        env: { ...process.env, NODE_ENV: "test" },
        stdio: "pipe",
      });
    run("db:migrate");
    run("db:seed:all");
    const m = require("../src/models");
    const { createApp } = require("../src/app");
    const security = {
      ...readSecurity({ JWT_SECRET: randomBytes(48).toString("hex") }),
      loginLimit: 100,
      ipLimit: 300,
      registerLimit: 100,
    };
    const app = createApp({ database: m.sequelize, models: m, security });
    const origin = "http://127.0.0.1:5173";
    const a = request.agent(app),
      b = request.agent(app);
    const tag = randomUUID().slice(0, 8);
    const password = "PruebaLocal_segura_123";
    let first, second, policies;
    const draft = await request(app).get("/api/politicas").expect(200);
    policies = draft.body.politicas;
    const body = (label) => ({
      empresa: {
        nombre: `Empresa ficticia ${label} ${tag}`,
        sector: "Pruebas",
        correo_contacto: `contacto-${label}-${tag}@example.test`,
        ubicacion_publica: "Cantón ficticio",
      },
      usuario: {
        nombre: `Persona ficticia ${label}`,
        correo: `persona-${label}-${tag}@example.test`,
        password,
      },
      aceptaciones: policies.map((p) => ({
        tipo: p.tipo,
        version: p.version,
        aceptada: true,
      })),
      comunicaciones_opcionales: false,
    });
    const challenge = async (agent) =>
      (await agent.get("/api/auth/csrf").expect(200)).body.csrfToken;
    const mutate = async (agent, url, data, method = "post") => {
      const token = await challenge(agent);
      return agent[method](url)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send(data);
    };
    try {
      await t.test(
        "políticas identificadas como borradores, con dos tipos y versión",
        async () => {
          assert.equal(policies.length, 2);
          assert.ok(
            policies.every(
              (p) =>
                p.estado === "borrador" &&
                p.version.startsWith("local-borrador"),
            ),
          );
          assert.match(draft.body.aviso, /BORRADORES/);
        },
      );
      await t.test(
        "CSRF exige origen, token y JSON, incluso en registro y login",
        async () => {
          await request(app)
            .post("/api/auth/registro")
            .send(body("csrf"))
            .expect(403);
          await a
            .post("/api/auth/login")
            .set("Origin", "https://ajeno.example.test")
            .set("X-CSRF-Token", await challenge(a))
            .send({ correo: "nadie@example.test", password })
            .expect(403);
          await a
            .post("/api/auth/login")
            .set("Origin", origin)
            .set("X-CSRF-Token", "0".repeat(64))
            .send({ correo: "nadie@example.test", password })
            .expect(403);
        },
      );
      await t.test(
        "registro de dos empresas transaccional, hash seguro y cookie HttpOnly",
        async () => {
          const r1 = await mutate(a, "/api/auth/registro", body("a"));
          assert.equal(r1.status, 201);
          first = r1.body;
          const r2 = await mutate(b, "/api/auth/registro", body("b"));
          assert.equal(r2.status, 201);
          second = r2.body;
          assert.notEqual(first.empresa.id, second.empresa.id);
          assert.deepEqual(first.roles, ["administrador_empresa"]);
          assert.ok(first.permisos.includes("equipo.gestionar"));
          assert.ok(!first.permisos.includes("roles_globales.gestionar"));
          assert.ok(
            r1.headers["set-cookie"].some(
              (c) =>
                c.startsWith("no_session=") &&
                c.includes("HttpOnly") &&
                c.includes("SameSite=Lax"),
            ),
          );
          assert.doesNotMatch(r1.text, /password_hash|refresh_hash|JWT_SECRET/);
          const user = await m.Usuario.unscoped().findByPk(first.usuario.id);
          assert.notEqual(user.password_hash, password);
          assert.ok(
            await require("bcryptjs").compare(password, user.password_hash),
          );
          assert.equal(
            await m.Aceptacion.count({ where: { usuario_id: user.id } }),
            2,
          );
          assert.equal(
            (await m.Consentimiento.findOne({ where: { usuario_id: user.id } }))
              .otorgado,
            false,
          );
        },
      );
      await t.test(
        "recarga de sesión y perfil mantiene identidad persistida",
        async () => {
          const s = await a.get("/api/auth/sesion").expect(200);
          assert.equal(s.body.usuario.id, first.usuario.id);
          assert.equal(
            (await a.get("/api/mi-empresa").expect(200)).body.id,
            first.empresa.id,
          );
        },
      );
      await t.test(
        "duplicados, versiones antiguas, aceptación ausente y datos inválidos",
        async () => {
          const companiesBefore = await m.Empresa.count();
          assert.equal(
            (await mutate(a, "/api/auth/registro", body("a"))).status,
            409,
          );
          assert.equal(await m.Empresa.count(), companiesBefore);
          const stale = body("stale");
          stale.aceptaciones[0].version = "anterior";
          assert.equal(
            (await mutate(a, "/api/auth/registro", stale)).status,
            409,
          );
          for (const change of [
            (v) => (v.aceptaciones[0].aceptada = false),
            (v) => (v.usuario.password = "corta"),
            (v) => (v.usuario.correo = "invalido"),
            (v) => (v.empresa.nombre = " "),
            (v) => (v.usuario.password = "ñ".repeat(40)),
          ]) {
            const value = body("invalid");
            change(value);
            assert.equal(
              (await mutate(a, "/api/auth/registro", value)).status,
              400,
            );
          }
        },
      );
      await t.test(
        "registro público y edición rechazan roles, empresa y estado inyectados; último administrador no se puede retirar",
        async () => {
          const value = body("injected");
          value.usuario.roles = ["administrador_plataforma"];
          assert.equal(
            (await mutate(a, "/api/auth/registro", value)).status,
            400,
          );
          for (const data of [
            { estado: "inactivo" },
            { empresa_id: second.empresa.id },
            { roles: [] },
          ])
            assert.equal(
              (await mutate(a, "/api/mi-cuenta", data, "patch")).status,
              400,
            );
          assert.equal(
            (
              await mutate(
                a,
                "/api/mi-empresa",
                { nombre: "Otro", estado: "inactiva" },
                "patch",
              )
            ).status,
            400,
          );
          await a.delete("/api/mi-cuenta").expect(404);
          assert.ok(
            (await a.get("/api/auth/sesion").expect(200)).body.roles.includes(
              "administrador_empresa",
            ),
          );
        },
      );
      await t.test(
        "fallo al crear aceptación revierte empresa, usuario, roles y sesión sin purgar datos",
        async () => {
          const counts = async () =>
            Promise.all([
              m.Empresa.count(),
              m.Usuario.count(),
              m.UsuarioRol.count(),
              m.Aceptacion.count(),
              m.Sesion.count(),
              m.Consentimiento.count(),
            ]);
          const before = await counts();
          m.Aceptacion.addHook("beforeCreate", "rollback-test", () => {
            throw new Error("fallo-interno-privado");
          });
          try {
            const response = await mutate(
              a,
              "/api/auth/registro",
              body("rollback"),
            );
            assert.equal(response.status, 500);
            assert.doesNotMatch(response.text, /fallo-interno|INSERT|password/);
          } finally {
            m.Aceptacion.removeHook("beforeCreate", "rollback-test");
          }
          assert.deepEqual(await counts(), before);
        },
      );
      await t.test(
        "sin sesión no hay acceso privado; una empresa no consulta ni modifica a otra",
        async () => {
          await request(app).get("/api/mi-cuenta").expect(401);
          await request(app).get("/api/mi-empresa").expect(401);
          await a.get("/api/empresas/" + second.empresa.id).expect(404);
          assert.equal(
            (
              await mutate(
                a,
                "/api/empresas/" + second.empresa.id,
                { nombre: "Intrusión" },
                "patch",
              )
            ).status,
            404,
          );
          assert.equal(
            (await b.get("/api/mi-empresa").expect(200)).body.nombre,
            body("b").empresa.nombre,
          );
        },
      );
      await t.test(
        "edición autorizada persiste y no devuelve hashes ni campos ajenos",
        async () => {
          const r = await mutate(
            a,
            "/api/mi-cuenta",
            { nombre: "Nombre de prueba actualizado" },
            "patch",
          );
          assert.equal(r.status, 200);
          assert.equal(
            (await a.get("/api/mi-cuenta").expect(200)).body.nombre,
            "Nombre de prueba actualizado",
          );
          assert.equal(
            (
              await mutate(
                a,
                "/api/mi-empresa",
                {
                  descripcion: "Descripción persistida",
                  direccion_privada: "Dirección de prueba privada",
                },
                "patch",
              )
            ).status,
            200,
          );
          const own = await a.get("/api/mi-empresa").expect(200);
          assert.equal(
            own.body.direccion_privada,
            "Dirección de prueba privada",
          );
          assert.ok(
            !(await b.get("/api/mi-empresa").expect(200)).text.includes(
              "Dirección de prueba privada",
            ),
          );
        },
      );
      await t.test(
        "roles combinados unen permisos; revocación se refleja sin esperar a que venza el JWT",
        async () => {
          const specialist = await m.Usuario.create({
            empresa_id: first.empresa.id,
            nombre: "Especialista ficticio",
            correo: `especialista-${tag}@example.test`,
            password_hash: await require("bcryptjs").hash(password, 12),
            estado: "activo",
          });
          const roles = await m.Rol.findAll({
            where: { codigo: ["gestor_materiales", "analista_impacto"] },
          });
          for (const role of roles)
            await m.UsuarioRol.create({
              usuario_id: specialist.id,
              rol_id: role.id,
              asignado_por: first.usuario.id,
              asignado_en: new Date(),
            });
          const agent = request.agent(app);
          assert.equal(
            (
              await mutate(agent, "/api/auth/login", {
                correo: specialist.correo,
                password,
              })
            ).status,
            200,
          );
          let s = (await agent.get("/api/auth/sesion").expect(200)).body;
          assert.equal(s.roles.length, 2);
          assert.ok(
            s.permisos.includes("materiales.gestionar") &&
              s.permisos.includes("reportes.exportar"),
          );
          assert.equal(
            (
              await mutate(
                agent,
                "/api/mi-empresa",
                { nombre: "Prohibido" },
                "patch",
              )
            ).status,
            403,
          );
          const materialRole = roles.find(
            (r) => r.codigo === "gestor_materiales",
          );
          await m.UsuarioRol.destroy({
            where: { usuario_id: specialist.id, rol_id: materialRole.id },
          });
          s = (await agent.get("/api/auth/sesion").expect(200)).body;
          assert.ok(!s.permisos.includes("materiales.gestionar"));
          assert.ok(s.permisos.includes("reportes.exportar"));
        },
      );
      await t.test(
        "contraseña incorrecta y cuenta inexistente comparten mensaje genérico",
        async () => {
          const wrong = await mutate(a, "/api/auth/login", {
            correo: body("a").usuario.correo,
            password: "Incorrecta_123456",
          });
          const absent = await mutate(a, "/api/auth/login", {
            correo: `ausente-${tag}@example.test`,
            password,
          });
          assert.equal(wrong.status, 401);
          assert.equal(absent.status, 401);
          assert.deepEqual(wrong.body.error, absent.body.error);
        },
      );
      await t.test(
        "logout revoca en MySQL; cookie capturada no vuelve a autorizar",
        async () => {
          const agent = request.agent(app);
          const pre = await challenge(agent);
          const login = await agent
            .post("/api/auth/login")
            .set("Origin", origin)
            .set("X-CSRF-Token", pre)
            .send({ correo: body("a").usuario.correo, password })
            .expect(200);
          const captured = login.headers["set-cookie"]
            .find((c) => c.startsWith("no_session="))
            .split(";")[0];
          await agent
            .patch("/api/mi-cuenta")
            .set("Origin", origin)
            .set("X-CSRF-Token", pre)
            .send({ nombre: "CSRF antiguo" })
            .expect(403);
          assert.equal(
            (await mutate(agent, "/api/auth/logout", {})).status,
            204,
          );
          await agent.get("/api/auth/sesion").expect(401);
          await request(app)
            .get("/api/auth/sesion")
            .set("Cookie", captured)
            .expect(401);
        },
      );
      await t.test(
        "sesión vencida en base y JWT manipulado son rechazados",
        async () => {
          await m.Sesion.update(
            { vence_en: new Date(Date.now() - 60000) },
            { where: { usuario_id: second.usuario.id } },
          );
          await b.get("/api/auth/sesion").expect(401);
          await request(app)
            .get("/api/auth/sesion")
            .set("Cookie", "no_session=alterado")
            .expect(401);
          const agent = request.agent(app);
          const entered = await mutate(agent, "/api/auth/login", {
            correo: body("b").usuario.correo,
            password,
          });
          assert.equal(entered.status, 200);
          const cookie = entered.headers["set-cookie"]
            .find((c) => c.startsWith("no_session="))
            .split(";")[0]
            .slice("no_session=".length);
          const jwt = require("jsonwebtoken");
          const payload = jwt.decode(cookie);
          const expired = jwt.sign({ sid: payload.sid }, security.jwtSecret, {
            algorithm: "HS256",
            subject: payload.sub,
            issuer: "nuevo-origen",
            audience: "nuevo-origen-web",
            expiresIn: -1,
          });
          await m.Sesion.update(
            {
              refresh_hash: createHash("sha256").update(expired).digest("hex"),
            },
            { where: { id: payload.sid } },
          );
          await request(app)
            .get("/api/auth/sesion")
            .set("Cookie", "no_session=" + expired)
            .expect(401);
        },
      );
      await t.test("límite de intentos detiene login repetido", async () => {
        const limitedApp = createApp({
          database: m.sequelize,
          models: m,
          security: { ...security, loginLimit: 2, ipLimit: 3 },
        });
        const agent = request.agent(limitedApp);
        for (let i = 0; i < 2; i++)
          assert.equal(
            (
              await mutate(agent, "/api/auth/login", {
                correo: `limit-${tag}@example.test`,
                password,
              })
            ).status,
            401,
          );
        assert.equal(
          (
            await mutate(agent, "/api/auth/login", {
              correo: `limit-${tag}@example.test`,
              password,
            })
          ).status,
          429,
        );
      });
    } finally {
      await m.sequelize.close();
    }
  },
);
