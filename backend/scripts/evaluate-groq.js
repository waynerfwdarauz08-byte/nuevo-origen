// Evaluación técnica real, exclusivamente con fixtures nuevos en SQL de pruebas.
// No ejecuta sobre desarrollo ni lee registros empresariales como contexto.
process.env.NODE_ENV = "test";
require("dotenv").config({ quiet: true });
const fs = require("node:fs/promises"),
  path = require("node:path"),
  { randomUUID, randomBytes } = require("node:crypto");
async function run() {
  const config = require("../src/config/env").readConfig();
  if (config.database.database !== "nuevo_origen_test")
    throw Error("UNSAFE_DATABASE");
  const provider = require("../src/services/agents/groq").createGroq();
  if (
    !provider.status().configurado ||
    !provider.status().retencion_cero_confirmada
  )
    throw Error("CONFIG_PENDING");
  const m = require("../src/models");
  try {
    const tag = randomUUID(),
      role = await m.Rol.findOne({
        where: { codigo: "administrador_empresa" },
      }),
      password = await require("bcryptjs").hash(
        randomBytes(32).toString("hex"),
        12,
      );
    const company = async (name) =>
      m.sequelize.transaction(async (transaction) => {
        const c = await m.Empresa.create(
          {
            nombre: "Evaluación IA ficticia " + name,
            sector: "Pruebas IA",
            correo_contacto: `groq-${name}-${tag}@example.test`,
            ubicacion_publica: "Ubicación ficticia",
            estado: "activa",
          },
          { transaction },
        );
        const u = await m.Usuario.create(
          {
            empresa_id: c.id,
            nombre: "Persona ficticia de evaluación",
            correo: `groq-user-${name}-${tag}@example.test`,
            password_hash: password,
            estado: "activo",
          },
          { transaction },
        );
        await m.UsuarioRol.create(
          {
            usuario_id: u.id,
            rol_id: role.id,
            asignado_por: u.id,
            asignado_en: new Date(),
          },
          { transaction },
        );
        return {
          user: { id: u.id },
          company: { id: c.id },
          permissions: (
            await m.Permiso.findAll({
              include: [
                {
                  model: m.Rol,
                  required: true,
                  where: { id: role.id },
                  through: { attributes: [] },
                },
              ],
              transaction,
            })
          ).map((p) => p.codigo),
        };
      });
    const a = await company("A"),
      b = await company("B"),
      category = await m.Categoria.findOne({ where: { activo: true } }),
      unit = await m.Unidad.findOne({ where: { codigo: "kg", activo: true } });
    const offer = async (auth, estado) =>
      m.Oferta.create({
        empresa_id: auth.company.id,
        autor_id: auth.user.id,
        categoria_id: category.id,
        unidad_id: unit.id,
        titulo: "Cartón de evaluación ficticia " + tag,
        composicion:
          "Cartón declarado; composición no verificada. Sin ficha técnica adjunta.",
        estado_material: "retazo",
        cantidad_total: "10.000",
        modalidad: "donacion",
        frecuencia: "puntual",
        ubicacion: "Ubicación ficticia",
        estado,
        declaracion_no_peligroso: true,
        declaracion_aprovechable: true,
      });
    const own = await offer(a, "borrador"),
      publicOffer = await offer(b, "publicada");
    const n = await m.Necesidad.create({
      empresa_id: a.company.id,
      autor_id: a.user.id,
      categoria_id: category.id,
      unidad_id: unit.id,
      titulo: "Necesidad ficticia de cartón " + tag,
      descripcion:
        "Se necesita cartón para evaluar coincidencias. Datos ficticios.",
      cantidad: "2.000",
      ubicacion: "Ubicación ficticia",
      estado: "activa",
    });
    const request = await require("../src/services/operations.service")
      .createOperationsService(m)
      .create(
        a,
        {
          oferta_id: String(publicOffer.id),
          cantidad: "2.000",
          condiciones:
            "Coordinación ficticia; no representa un compromiso comercial.",
        },
        randomUUID(),
      );
    const service =
      require("../src/services/agents.service").createAgentsService(m, {
        provider,
      });
    const cases = [
      {
        agente: "AG-01",
        pregunta:
          "¿Qué herramientas de asistencia tengo disponibles con mi función?",
      },
      {
        agente: "AG-02",
        pregunta:
          "Prepará un borrador de ficha y señalá datos desconocidos sin certificar.",
        oferta_id: String(own.id),
      },
      {
        agente: "AG-03",
        pregunta:
          "Explicá las ofertas candidatas y las condiciones pendientes de comprobar.",
        necesidad_id: String(n.id),
      },
      {
        agente: "AG-06",
        pregunta:
          "Resumí la etapa y proponé un borrador de seguimiento sin enviarlo.",
        solicitud_id: String(request.id),
      },
      {
        agente: "AG-07",
        pregunta:
          "Explicá los indicadores del periodo sin inventar impacto ni hacer cálculos adicionales.",
        desde: "2090-01-01",
        hasta: "2090-01-31",
      },
      {
        agente: "AG-08",
        pregunta:
          "Revisá el borrador y señalá campos pendientes sin publicarlo.",
        oferta_id: String(own.id),
      },
    ];
    const selected = process.argv[2];
    if (selected && !cases.some((c) => c.agente === selected))
      throw Error("INVALID_AGENT");
    const results = [];
    for (const input of cases.filter(
      (c) => !selected || c.agente === selected,
    )) {
      try {
        const r = await service.execute(a, {
          ...input,
          clave_cliente: randomUUID(),
        });
        results.push({
          agente: input.agente,
          resultado: "respuesta_validada",
          ejecucion: r.ejecucion.id,
          duracion_ms: r.ejecucion.duracion_ms,
          tokens_entrada: r.ejecucion.tokens_entrada,
          tokens_salida: r.ejecucion.tokens_salida,
          fuentes: r.fuentes.length,
        });
      } catch (error) {
        results.push({
          agente: input.agente,
          resultado: "fallida",
          codigo: error.code || "EVALUATION_FAILED",
        });
      }
    }
    const report = {
      fecha: new Date().toISOString(),
      modelo: provider.status().modelo,
      base: "nuevo_origen_test",
      datos: "ficticios nuevos",
      casos: results,
      aprobadas: results.filter((r) => r.resultado === "respuesta_validada")
        .length,
      total: results.length,
      calidad_semantica:
        "pendiente de evaluación humana; no equivale al banco de 40 casos",
      rag: "AG-04/05 pendientes; sin corpus autorizado",
    };
    const dir = path.resolve(__dirname, "../../.local");
    await fs.mkdir(dir, { recursive: true });
    const json = JSON.stringify(report, null, 2);
    await fs.writeFile(
      path.join(
        dir,
        "groq-evaluation-" + report.fecha.replace(/[:.]/g, "-") + ".json",
      ),
      json,
      { mode: 0o600 },
    );
    await fs.writeFile(path.join(dir, "groq-evaluation.json"), json, {
      mode: 0o600,
    });
    console.log(json);
    if (report.aprobadas !== report.total) process.exitCode = 1;
  } finally {
    await m.sequelize.close();
  }
}
run().catch(() => {
  console.error(
    "No se completó la evaluación técnica. Revisar configuración y migraciones de pruebas sin compartir credenciales.",
  );
  process.exitCode = 1;
});
