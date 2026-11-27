const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline");
const { Writable } = require("node:stream");
const dotenv = require("dotenv");

function updateEnv(content, values) {
  // Eliminar duplicados de estas variables; conservar todas las demás líneas.
  const keys = new Set(Object.keys(values));
  const rest = content
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(
        /^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=/,
      );
      return !match || !keys.has(match[1]);
    })
    .join("\n")
    .trimEnd();
  return (
    rest +
    "\n" +
    Object.entries(values)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join("\n") +
    "\n"
  );
}

async function configure() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("TTY_REQUIRED");
  const file = path.resolve(__dirname, "../.env");
  const content = await fs.readFile(file, "utf8");
  const current = dotenv.parse(content);
  let hidden = false;
  const output = new Writable({
    write(chunk, encoding, done) {
      if (!hidden) process.stdout.write(chunk, encoding);
      done();
    },
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output,
    terminal: true,
    historySize: 0,
  });
  const question = (prompt, secret = false) =>
    new Promise((resolve, reject) => {
      process.stdout.write(prompt);
      hidden = secret;
      const cancel = () => {
        hidden = false;
        reject(new Error("CANCELLED"));
        rl.close();
      };
      rl.once("SIGINT", cancel);
      rl.question("", (answer) => {
        rl.removeListener("SIGINT", cancel);
        hidden = false;
        if (secret) process.stdout.write("\n");
        resolve(answer.trim());
      });
    });
  try {
    console.log(
      "Configuración local de Groq. No se enviarán solicitudes en este paso.",
    );
    const answer = await question(
      current.GROQ_API_KEY
        ? "Clave nueva (oculta; Enter conserva la actual): "
        : "Clave de Groq (oculta): ",
      true,
    );
    const key = answer || current.GROQ_API_KEY;
    if (!key || !/^gsk_[A-Za-z0-9_-]{20,}$/.test(key))
      throw new Error("INVALID_KEY");
    console.log(
      "Retención cero: activar los controles en la cuenta de Groq antes de confirmar.",
    );
    const zdr =
      (await question(
        "¿Confirmaste retención cero en la cuenta? Escribí CONFIRMO, o Enter para mantener datos privados bloqueados: ",
      )) === "CONFIRMO";
    // Comprobar que nadie haya cambiado .env mientras se respondía.
    if ((await fs.readFile(file, "utf8")) !== content)
      throw new Error("ENV_CHANGED");
    await fs.writeFile(
      file,
      updateEnv(content, {
        GROQ_API_KEY: key,
        GROQ_MODEL: "openai/gpt-oss-120b",
        GROQ_ZDR_CONFIRMED: String(zdr),
      }),
      { mode: 0o600 },
    );
    console.log(
      "Guardado en backend/.env. La clave no se muestra. Reiniciar backend después de configurar.",
    );
    console.log(
      zdr
        ? "Confirmación humana registrada; falta verificar la conexión."
        : "Contexto privado bloqueado; se permite la prueba con datos ficticios.",
    );
  } finally {
    hidden = false;
    rl.close();
    output.end();
  }
}
if (require.main === module)
  configure().catch((error) => {
    const messages = {
      TTY_REQUIRED:
        "Ejecutar directamente en una terminal interactiva, sin redirecciones.",
      INVALID_KEY:
        "Clave vacía o formato no reconocido. No se guardaron cambios.",
      CANCELLED: "Configuración cancelada.",
      ENV_CHANGED:
        ".env cambió durante la configuración. Repetir sin sobrescribir cambios ajenos.",
    };
    console.error(
      messages[error.message] ||
        "No se completó la configuración. Revisar permisos y existencia de backend/.env; no compartir su contenido.",
    );
    process.exitCode = 1;
  });
module.exports = { updateEnv };
