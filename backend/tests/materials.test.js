const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { randomUUID, randomBytes } = require("node:crypto");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const sharp = require("sharp");
const { scaled, available } = require("../src/services/decimal");
test("cantidades exactas sin redondeo binario", () => {
  assert.equal(
    available({
      cantidad_total: "99999999999.999",
      cantidad_reservada: "0.001",
      cantidad_entregada: "0.002",
    }),
    "99999999999.996",
  );
  assert.equal(scaled("1.000"), 1000n);
  assert.equal(scaled("-0.5000", 4), -5000n);
  const { id } = require("../src/schemas/materials");
  for (const value of ["abc", "1e2", "0", "-1", "18446744073709551616"])
    assert.equal(id.safeParse(value).success, false);
});
test(
  "materiales y catálogo con MySQL exclusivo",
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
        ipLimit: 200,
        loginLimit: 100,
      };
    const app = require("../src/app").createApp({
      database: m.sequelize,
      models: m,
      security,
    });
    const tag = randomUUID(),
      password = "PruebaMateriales_12345",
      origin = "http://127.0.0.1:5173";
    const ps = (await request(app).get("/api/politicas")).body.politicas.map(
      (p) => ({ tipo: p.tipo, version: p.version, aceptada: true }),
    );
    const csrf = async (a) =>
      (await a.get("/api/auth/csrf").expect(200)).body.csrfToken;
    async function mutate(a, url, body, method = "post") {
      const token = await csrf(a);
      return a[method]("/api" + url)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send(body);
    }
    async function company(suffix) {
      const a = request.agent(app),
        correo = `materiales-${tag}-${suffix}@example.test`;
      const r = await mutate(a, "/auth/registro", {
        empresa: {
          nombre: "Empresa ficticia materiales " + suffix,
          sector: "Prueba",
          correo_contacto: correo,
          ubicacion_publica: "Cantón ficticio",
          direccion_privada: "Dirección privada de prueba",
        },
        usuario: { nombre: "Persona ficticia", correo, password },
        aceptaciones: ps,
        comunicaciones_opcionales: false,
      });
      assert.equal(r.status, 201);
      return { a, session: r.body };
    }
    let a, b, admin, meta, offerId, photoId, needId, category, property;
    const createdKeys = [];
    const photo = await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#354638" },
    })
      .png()
      .toBuffer();
    async function upload(
      agent,
      id,
      buffer = photo,
      name = "material.png",
      type = "image/png",
    ) {
      const token = await csrf(agent);
      return agent
        .post(`/api/ofertas/${id}/fotos`)
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .attach("foto", buffer, { filename: name, contentType: type });
    }
    const fields = () => ({
      titulo: "Material ficticio " + tag,
      categoria_id: String(category.id),
      unidad_id: String(meta.unidades.find((u) => u.codigo === "kg").id),
      composicion: "Cartón conocido, sin tratamientos declarados",
      estado_material: "retazo",
      cantidad_total: "12.345",
      modalidad: "venta",
      precio_unitario: "123.45",
      moneda: "CRC",
      frecuencia: "puntual",
      ubicacion: "Puntarenas, Esparza",
      declaracion_no_peligroso: true,
      declaracion_aprovechable: true,
      propiedades: [
        { propiedad_id: String(property.id), valor_numero: "2.5000" },
      ],
    });
    try {
      a = await company("A");
      b = await company("B");
      const globalRole = await m.Rol.findOne({
        where: { codigo: "administrador_plataforma" },
      });
      const globalUser = await m.Usuario.create({
        empresa_id: null,
        nombre: "Plataforma ficticia",
        correo: `plataforma-${tag}@example.test`,
        password_hash: await require("bcryptjs").hash(password, 12),
        estado: "activo",
      });
      await m.UsuarioRol.create({
        usuario_id: globalUser.id,
        rol_id: globalRole.id,
        asignado_por: globalUser.id,
        asignado_en: new Date(),
      });
      admin = request.agent(app);
      assert.equal(
        (
          await mutate(admin, "/auth/login", {
            correo: globalUser.correo,
            password,
          })
        ).status,
        200,
      );
      meta = (await request(app).get("/api/catalogos/materiales").expect(200))
        .body;
      await t.test(
        "catálogos dinámicos solo plataforma, tipos y unidades",
        async () => {
          assert.equal(
            (
              await mutate(a.a, "/administracion/categorias", {
                nombre: "No autorizada",
              })
            ).status,
            403,
          );
          let r = await mutate(admin, "/administracion/categorias", {
            nombre: "Categoría ficticia " + tag,
            descripcion: "Prueba",
            activo: true,
          });
          assert.equal(r.status, 201);
          category = r.body;
          r = await mutate(admin, "/administracion/propiedades", {
            nombre: "Espesor ficticio " + tag,
            tipo_dato: "numero",
            unidad_id: meta.unidades.find((u) => u.codigo === "mm").id,
            activo: true,
          });
          assert.equal(r.status, 201);
          property = r.body;
          assert.equal(
            (
              await mutate(
                admin,
                `/administracion/categorias/${category.id}/propiedades`,
                {
                  propiedades: [{ propiedad_id: property.id, requerida: true }],
                },
                "put",
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(admin, "/administracion/categorias", {
                nombre: category.nombre,
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await mutate(admin, "/administracion/propiedades", {
                nombre: "Texto incompatible " + tag,
                tipo_dato: "texto",
                unidad_id: meta.unidades[0].id,
              })
            ).status,
            400,
          );
          const current = (await request(app).get("/api/catalogos/materiales"))
            .body;
          assert.ok(current.categorias.some((c) => c.id === category.id));
        },
      );
      await t.test(
        "unidades y propiedades administrables sin redefinir magnitudes existentes",
        async () => {
          const data = {
            codigo: "u_" + tag.slice(0, 8),
            nombre: "Unidad ficticia " + tag,
            magnitud: "piezas",
            activo: true,
          };
          const created = await mutate(admin, "/administracion/unidades", data);
          assert.equal(created.status, 201);
          assert.equal(
            (await mutate(admin, "/administracion/unidades", data)).status,
            409,
          );
          assert.equal(
            (
              await mutate(
                admin,
                "/administracion/unidades/" + created.body.id,
                { ...data, magnitud: "masa" },
                "put",
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(
                admin,
                "/administracion/unidades/" + created.body.id,
                { ...data, activo: false },
                "put",
              )
            ).status,
            200,
          );
          const prop = {
            nombre: property.nombre,
            tipo_dato: "texto",
            unidad_id: null,
            activo: true,
          };
          assert.equal(
            (
              await mutate(
                admin,
                "/administracion/propiedades/" + property.id,
                prop,
                "put",
              )
            ).status,
            400,
          );
        },
      );
      await t.test(
        "borradores privados y campos estrictos, cantidades y precios",
        async () => {
          await request(app).post("/api/ofertas").send(fields()).expect(403);
          const r = await mutate(a.a, "/ofertas", fields());
          assert.equal(r.status, 201);
          offerId = r.body.id;
          assert.equal(r.body.estado, "borrador");
          assert.equal(r.body.cantidad_disponible, "12.345");
          await request(app)
            .get("/api/catalogo/ofertas/" + offerId)
            .expect(404);
          await b.a.get("/api/ofertas/" + offerId).expect(404);
          for (const value of [
            { ...fields(), empresa_id: b.session.empresa.id },
            { ...fields(), cantidad_total: "-1" },
            { ...fields(), cantidad_total: "1e3" },
            { ...fields(), cantidad_total: "1.0001" },
            { ...fields(), cantidad_reservada: "1" },
            { ...fields(), estado: "publicada" },
            { ...fields(), modalidad: "donacion" },
          ])
            assert.equal((await mutate(a.a, "/ofertas", value)).status, 400);
          assert.equal(
            (await mutate(b.a, "/ofertas/" + offerId, fields(), "put")).status,
            404,
          );
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "publicada",
                motivo: "Publicar prueba",
              })
            ).status,
            400,
          );
        },
      );
      await t.test("fotografías verificadas, CSRF y aislamiento", async () => {
        assert.equal((await upload(b.a, offerId)).status, 404);
        assert.equal(
          (
            await upload(
              a.a,
              offerId,
              Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
              "falsa.png",
            )
          ).status,
          400,
        );
        assert.equal(
          (await upload(a.a, offerId, photo, "falsa.jpg", "image/jpeg")).status,
          400,
        );
        assert.equal(
          (
            await upload(
              a.a,
              offerId,
              Buffer.alloc(5 * 1024 * 1024 + 1),
              "grande.png",
            )
          ).status,
          413,
        );
        const r = await upload(a.a, offerId);
        assert.equal(r.status, 201);
        photoId = r.body.fotos[0].id;
        const file = await m.Archivo.findByPk(photoId);
        createdKeys.push(file.clave_objeto);
        assert.equal(file.mime, "image/webp");
        await request(app)
          .get(`/api/catalogo/ofertas/${offerId}/fotos/${photoId}`)
          .expect(404);
        await b.a.get(`/api/ofertas/${offerId}/fotos/${photoId}`).expect(404);
        const img = await a.a
          .get(`/api/ofertas/${offerId}/fotos/${photoId}`)
          .expect(200);
        const info = await sharp(img.body).metadata();
        assert.equal(info.format, "webp");
        assert.equal(info.exif, undefined);
        await a.a
          .post(`/api/ofertas/${offerId}/fotos`)
          .set("Origin", "https://ajeno.example")
          .attach("foto", photo, "material.png")
          .expect(403);
      });
      await t.test(
        "publicación válida, filtros, proyección pública y perfil público",
        async () => {
          const r = await mutate(a.a, `/ofertas/${offerId}/estado`, {
            estado: "publicada",
            motivo: "Publicación verificada",
          });
          assert.equal(r.status, 200);
          const pub = await request(app)
            .get("/api/catalogo/ofertas/" + offerId)
            .expect(200);
          const serialized = JSON.stringify(pub.body);
          for (const forbidden of [
            "correo_contacto",
            "direccion_privada",
            "autor_id",
            "clave_objeto",
            "hash_sha256",
            "password",
            "cantidad_reservada",
          ])
            assert.ok(!serialized.includes(forbidden));
          await request(app)
            .get(`/api/catalogo/ofertas/${offerId}/fotos/${photoId}`)
            .expect(200);
          const query = `?q=${encodeURIComponent(tag)}&categoria_id=${category.id}&unidad_id=${fields().unidad_id}&minimo=12.345&modalidad=venta&ubicacion=Esparza&frecuencia=puntual&estado_material=retazo`;
          const found = await request(app)
            .get("/api/catalogo/ofertas" + query)
            .expect(200);
          assert.equal(found.body.total, 1);
          assert.equal(
            (
              await request(app).get(
                "/api/catalogo/ofertas" + query.replace("12.345", "12.346"),
              )
            ).body.total,
            0,
          );
          await request(app).get("/api/catalogo/ofertas?minimo=2").expect(400);
          await request(app).get("/api/catalogo/ofertas?pagina=-1").expect(400);
          await request(app)
            .get("/api/catalogo/ofertas?empresa_id=1")
            .expect(400);
          const profile = await request(app)
            .get("/api/catalogo/empresas/" + a.session.empresa.id)
            .expect(200);
          assert.equal(profile.body.correo_contacto, undefined);
          assert.equal(profile.body.direccion_privada, undefined);
          const refreshed = await a.a
            .get("/api/ofertas/" + offerId)
            .expect(200);
          assert.equal(refreshed.body.titulo, fields().titulo);
        },
      );
      await t.test(
        "propiedades requeridas, declaraciones y estados se validan antes de persistir",
        async () => {
          assert.equal(
            (
              await mutate(
                a.a,
                "/ofertas/" + offerId,
                { ...fields(), propiedades: [] },
                "put",
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(
                a.a,
                "/ofertas/" + offerId,
                { ...fields(), declaracion_no_peligroso: false },
                "put",
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(
                a.a,
                "/ofertas/" + offerId,
                {
                  ...fields(),
                  propiedades: [
                    { propiedad_id: property.id, valor_texto: "texto falso" },
                  ],
                },
                "put",
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "cerrada",
                motivo: "Estado incompatible",
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await mutate(
                a.a,
                `/ofertas/${offerId}/fotos/${photoId}`,
                {},
                "delete",
              )
            ).status,
            409,
          );
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "pausada",
                motivo: "Pausa de prueba",
              })
            ).status,
            200,
          );
          await request(app)
            .get("/api/catalogo/ofertas/" + offerId)
            .expect(404);
          await request(app)
            .get(`/api/catalogo/ofertas/${offerId}/fotos/${photoId}`)
            .expect(404);
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "publicada",
                motivo: "Reanudar prueba",
              })
            ).status,
            200,
          );
        },
      );
      await t.test(
        "necesidades privadas con intervalos y transiciones",
        async () => {
          const data = {
            titulo: "Necesidad ficticia " + tag,
            categoria_id: category.id,
            unidad_id: fields().unidad_id,
            descripcion: "Cartón para prueba",
            cantidad: "4.500",
            ubicacion: "Alajuela",
            fecha_objetivo: "2027-01-10",
            propiedades: [
              { propiedad_id: property.id, minimo: "1", maximo: "3" },
            ],
          };
          let r = await mutate(a.a, "/necesidades", data);
          assert.equal(r.status, 201);
          needId = r.body.id;
          await b.a.get("/api/necesidades/" + needId).expect(404);
          await request(app)
            .get("/api/necesidades/" + needId)
            .expect(401);
          assert.equal(
            (
              await mutate(a.a, "/necesidades", {
                ...data,
                fecha_objetivo: "2027-02-30",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(a.a, "/necesidades", {
                ...data,
                propiedades: [
                  { propiedad_id: property.id, minimo: "4", maximo: "2" },
                ],
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(a.a, `/necesidades/${needId}/estado`, {
                estado: "activa",
                motivo: "Necesidad activa",
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(a.a, `/necesidades/${needId}/estado`, {
                estado: "cerrada",
                motivo: "Necesidad satisfecha",
              })
            ).status,
            200,
          );
          assert.equal(
            (await mutate(a.a, "/necesidades/" + needId, data, "put")).status,
            409,
          );
          assert.equal(
            (
              await request(app).get(
                "/api/catalogo/ofertas?q=" + encodeURIComponent(data.titulo),
              )
            ).body.total,
            0,
          );
        },
      );
      await t.test(
        "permisos vigentes en sesión abierta y especialista de lectura",
        async () => {
          const role = await m.Rol.findOne({
            where: { codigo: "analista_impacto" },
          });
          const user = await m.Usuario.create({
            empresa_id: a.session.empresa.id,
            nombre: "Analista ficticio",
            correo: `analista-${tag}@example.test`,
            password_hash: await require("bcryptjs").hash(password, 12),
            estado: "activo",
          });
          await m.UsuarioRol.create({
            usuario_id: user.id,
            rol_id: role.id,
            asignado_por: a.session.usuario.id,
            asignado_en: new Date(),
          });
          const agent = request.agent(app);
          assert.equal(
            (
              await mutate(agent, "/auth/login", {
                correo: user.correo,
                password,
              })
            ).status,
            200,
          );
          await agent.get("/api/ofertas/" + offerId).expect(200);
          assert.equal((await mutate(agent, "/ofertas", fields())).status, 403);
          await m.UsuarioRol.destroy({
            where: { usuario_id: user.id, rol_id: role.id },
          });
          await agent.get("/api/ofertas/" + offerId).expect(403);
        },
      );
      await t.test("rollback y auditoría del módulo", async () => {
        const before = await m.Oferta.count({
          where: { empresa_id: a.session.empresa.id },
        });
        m.Auditoria.addHook("beforeCreate", "fallo-materiales", () => {
          throw new Error("Fallo controlado");
        });
        try {
          assert.equal((await mutate(a.a, "/ofertas", fields())).status, 500);
        } finally {
          m.Auditoria.removeHook("beforeCreate", "fallo-materiales");
        }
        assert.equal(
          await m.Oferta.count({ where: { empresa_id: a.session.empresa.id } }),
          before,
        );
        assert.ok(
          await m.Auditoria.count({
            where: {
              empresa_id: a.session.empresa.id,
              accion: "oferta.estado",
            },
          }),
        );
        const stored = await m.Oferta.findByPk(offerId);
        await assert.rejects(stored.update({ cantidad_total: "-1" }));
      });
      await t.test(
        "paginación privada y filtros resistentes a entradas de SQL y comodines",
        async () => {
          const before = await m.Oferta.count({
            where: { empresa_id: a.session.empresa.id },
          });
          const { propiedades, ...fieldsOnly } = fields();
          await m.Oferta.bulkCreate(
            Array.from({ length: 13 }, (_, i) => ({
              ...fieldsOnly,
              titulo: "Paginación ficticia " + tag + " " + i,
              empresa_id: a.session.empresa.id,
              autor_id: a.session.usuario.id,
              estado: "borrador",
            })),
          );
          const listed = await a.a.get("/api/ofertas?pagina=2").expect(200);
          assert.equal(listed.body.total, before + 13);
          assert.ok(listed.body.registros.length > 0);
          assert.ok(
            listed.body.registros.every(
              (r) => r.empresa.id === a.session.empresa.id,
            ),
          );
          const publicList = await request(app)
            .get("/api/catalogo/ofertas?q=" + encodeURIComponent(tag))
            .expect(200);
          assert.equal(publicList.body.total, 1);
          const injection = await request(app)
            .get("/api/catalogo/ofertas?q=" + encodeURIComponent("' OR 1=1 --"))
            .expect(200);
          assert.equal(injection.body.total, 0);
          const exactUnit = await request(app)
            .get(
              `/api/catalogo/ofertas?q=${tag}&unidad_id=${meta.unidades.find((u) => u.codigo === "unidad").id}&minimo=1`,
            )
            .expect(200);
          assert.equal(exactUnit.body.total, 0);
        },
      );
      await t.test(
        "cambios de estado concurrentes no duplican transiciones",
        async () => {
          const results = await Promise.all([
            mutate(a.a, `/ofertas/${offerId}/estado`, {
              estado: "pausada",
              motivo: "Pausa simultánea A",
            }),
            mutate(a.a, `/ofertas/${offerId}/estado`, {
              estado: "pausada",
              motivo: "Pausa simultánea B",
            }),
          ]);
          assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "publicada",
                motivo: "Reanudar después de la carrera",
              })
            ).status,
            200,
          );
        },
      );
      await t.test(
        "archivo terminal, foto retirada y catálogos desactivados",
        async () => {
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "pausada",
                motivo: "Retirar foto",
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await mutate(
                a.a,
                `/ofertas/${offerId}/fotos/${photoId}`,
                {},
                "delete",
              )
            ).status,
            200,
          );
          await a.a.get(`/api/ofertas/${offerId}/fotos/${photoId}`).expect(404);
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "publicada",
                motivo: "Sin foto",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await mutate(a.a, `/ofertas/${offerId}/estado`, {
                estado: "archivada",
                motivo: "Archivo final",
              })
            ).status,
            200,
          );
          assert.equal(
            (await mutate(a.a, "/ofertas/" + offerId, fields(), "put")).status,
            409,
          );
          assert.equal(
            (
              await mutate(
                admin,
                "/administracion/categorias/" + category.id,
                {
                  nombre: category.nombre,
                  descripcion: "Desactivada",
                  activo: false,
                },
                "put",
              )
            ).status,
            200,
          );
          assert.equal((await mutate(a.a, "/ofertas", fields())).status, 400);
        },
      );
    } finally {
      await m.sequelize.close();
    }
  },
);
