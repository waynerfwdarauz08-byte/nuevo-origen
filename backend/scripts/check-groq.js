const fs = require("node:fs/promises");
const path = require("node:path");
const { createGroq } = require("../src/services/agents/groq");
async function check() {
  const provider = createGroq();
  if (!provider.status().configurado) {
    console.error(
      "Falta configurar Groq. Ejecutar npm run groq:configure. No enviar la clave por chat.",
    );
    process.exitCode = 1;
    return;
  }
  const start = Date.now();
  await provider.generate({
    instruction:
      "Prueba técnica con información ficticia. Resume el dato suministrado y cita su identificador. No agregues hechos.",
    question: "¿Qué material declara la ficha ficticia?",
    context: [
      {
        id: "prueba:1",
        texto:
          "Ficha ficticia: material declarado cartón. No certifica composición ni seguridad.",
      },
    ],
    sourceIds: ["prueba:1"],
    privateData: false,
  });
  const report = {
    fecha: new Date().toISOString(),
    proveedor: "groq",
    modelo: provider.status().modelo,
    resultado: "conexion_y_esquema_verificados",
    contexto: "ficticio",
    duracion_ms: Date.now() - start,
    retencion_cero_confirmada_por_operador:
      provider.status().retencion_cero_confirmada,
  };
  const dir = path.resolve(__dirname, "../../.local");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "groq-check.json"),
    JSON.stringify(report, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(
    "No acredita calidad de los ocho agentes ni verificación remota de retención cero.",
  );
}
if (require.main === module)
  check().catch((error) => {
    const messages = {
      AI_AUTH_FAILED: "Groq rechazó la clave. Revisarla localmente.",
      AI_RATE_LIMITED:
        "Groq limitó la solicitud; revisar cuotas antes de repetir.",
      AI_TIMEOUT: "Groq no respondió dentro de 30 segundos.",
      AI_MODEL_NOT_AUTHORIZED:
        "Modelo no autorizado: usar openai/gpt-oss-120b.",
      AI_RESPONSE_INVALID: "La respuesta no superó la validación.",
      AI_RESPONSE_INCOMPLETE: "Groq devolvió una respuesta incompleta.",
    };
    console.error(
      messages[error.code] ||
        "No se verificó la conexión de Groq. Revisar red, acceso al modelo y configuración; no compartir secretos.",
    );
    process.exitCode = 1;
  });
module.exports = { check };
