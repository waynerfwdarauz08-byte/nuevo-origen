// Alta explícita local: nunca desde registro público ni seeders.
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
function hidden(prompt) {
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    const finish = () => {
      stdin.off("data", read);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    function read(chunk) {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          finish();
          reject(new Error("cancel"));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value) {
            value = Array.from(value).slice(0, -1).join("");
            stdout.write("\b \b");
          }
        } else if (char >= " ") {
          value += char;
          stdout.write("*");
        }
      }
    }
    stdin.on("data", read);
  });
}
async function main() {
  if (!stdin.isTTY) throw new Error("terminal");
  const { readConfig } = require("../src/config/env");
  const config = readConfig();
  if (
    config.mode !== "development" ||
    config.database.database !== "nuevo_origen_development" ||
    config.database.port !== 3307
  )
    throw new Error("environment");
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const nombre = await rl.question("Nombre del administrador de plataforma: ");
  const correo = await rl.question(
    "Correo nuevo (no una cuenta empresarial existente): ",
  );
  rl.close();
  let password = await hidden("Contraseña (12 caracteres mínimo, oculta): ");
  const confirm = await hidden("Repetí contraseña: ");
  if (password !== confirm) throw new Error("password");
  const parsed =
    require("../src/schemas/identity").registro.shape.usuario.safeParse({
      nombre,
      correo,
      password,
    });
  if (!parsed.success) throw new Error("input");
  const m = require("../src/models");
  try {
    const password_hash = await bcrypt.hash(password, 12);
    password = "";
    await m.sequelize.transaction(async (transaction) => {
      const role = await m.Rol.findOne({
        where: { codigo: "administrador_plataforma", alcance: "plataforma" },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (
        !role ||
        (await m.Usuario.findOne({
          where: { correo: parsed.data.correo },
          transaction,
        }))
      )
        throw new Error("account");
      const user = await m.Usuario.create(
        {
          nombre: parsed.data.nombre,
          correo: parsed.data.correo,
          password_hash,
          empresa_id: null,
          estado: "activo",
        },
        { transaction },
      );
      await m.UsuarioRol.create(
        {
          usuario_id: user.id,
          rol_id: role.id,
          asignado_por: user.id,
          asignado_en: new Date(),
        },
        { transaction },
      );
      await m.Auditoria.create(
        {
          actor_id: user.id,
          empresa_id: null,
          accion: "plataforma.alta_local",
          recurso_tipo: "usuario",
          recurso_id: user.id,
          request_id: randomUUID(),
          fecha: new Date(),
          motivo: "Bootstrap local explícito del responsable",
          detalle: {},
        },
        { transaction },
      );
    });
    stdout.write(
      "Cuenta de plataforma creada. Ingresá desde /acceso; no se modificaron cuentas empresariales.\n",
    );
  } finally {
    await m.sequelize.close();
  }
}
main().catch(() => {
  console.error(
    "No se creó la cuenta. Usá una terminal interactiva, MySQL local disponible, un correo nuevo y contraseña válida. No se hicieron cambios parciales.",
  );
  process.exitCode = 1;
});
