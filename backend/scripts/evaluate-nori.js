process.env.NODE_ENV = "test";
require("dotenv").config({ quiet: true });
const fs = require("node:fs/promises"),
  path = require("node:path"),
  { randomUUID, randomBytes } = require("node:crypto");
async function run() {
  if (
    require("../src/config/env").readConfig().database.database !==
    "nuevo_origen_test"
  )
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
      });
    const c = await m.Empresa.create({
      nombre: "Empresa Nori ficticia",
      sector: "Pruebas",
      correo_contacto: `nori-${tag}@example.test`,
      ubicacion_publica: "Ubicación ficticia",
      estado: "activa",
    });
    const u = await m.Usuario.create({
      empresa_id: c.id,
      nombre: "Persona ficticia de prueba",
      correo: `nori-user-${tag}@example.test`,
      password_hash: await require("bcryptjs").hash(
        randomBytes(32).toString("hex"),
        12,
      ),
      estado: "activo",
    });
    await m.UsuarioRol.create({
      usuario_id: u.id,
      rol_id: role.id,
      asignado_por: u.id,
      asignado_en: new Date(),
    });
    const permissions = (
        await m.Permiso.findAll({
          include: [
            {
              model: m.Rol,
              required: true,
              where: { id: role.id },
              through: { attributes: [] },
            },
          ],
        })
      ).map((p) => p.codigo),
      auth = { user: { id: u.id }, company: { id: c.id }, permissions };
    const service = require("../src/services/nori.service").createNoriService(
        m,
        { provider },
      ),
      chat = await service.create(auth, {
        clave_cliente: randomUUID(),
        contexto: { agente: "AG-01" },
      });
    const results = [];
    for (const pregunta of [
      "Hola, ¿cómo te llamás y en qué podés ayudarme?",
      "¿Podés resumir lo que acabás de explicar?",
    ]) {
      const response = await service.send(auth, chat.id, {
        clave_cliente: randomUUID(),
        pregunta,
      });
      results.push({
        estado: response.turno.estado,
        fuentes: response.turno.respuesta?.fuentes.length,
        nori_identificada:
          response.turno.respuesta?.respuesta.includes("Nori") || false,
      });
    }
    const recovered = await service.detail(auth, chat.id),
      report = {
        fecha: new Date().toISOString(),
        modelo: provider.status().modelo,
        base: "nuevo_origen_test",
        datos: "ficticios nuevos",
        conversacion: chat.id,
        turnos: recovered.turnos.length,
        resultados: results,
        persistencia:
          recovered.turnos.length === 2 &&
          recovered.turnos.every((t) => t.respuesta),
        calidad_amplia: "pendiente de evaluación humana",
      };
    const dir = path.resolve(__dirname, "../../.local");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "nori-evaluation.json"),
      JSON.stringify(report, null, 2),
      { mode: 0o600 },
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await m.sequelize.close();
  }
}
run().catch((error) => {
  console.error(
    "No se completó la evaluación real de Nori. Código: " +
      (error.code || "EVALUATION_FAILED") +
      ". No compartir credenciales.",
  );
  process.exitCode = 1;
});
