const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
const file = require("node:path").resolve(__dirname, "../.env");
if (!fs.existsSync(file))
  throw new Error("Primero configurar backend/.env para la instancia aislada.");
const content = fs.readFileSync(file, "utf8");
const current = require("dotenv").parse(content).JWT_SECRET;
if (!current || /CAMBIAR|ficticio/i.test(current)) {
  const line = `JWT_SECRET=${randomBytes(48).toString("hex")}`;
  fs.writeFileSync(
    file,
    /^JWT_SECRET=.*$/m.test(content)
      ? content.replace(/^JWT_SECRET=.*$/m, line)
      : content + "\n" + line + "\n",
  );
  console.log("Clave local generada en .env ignorado; no se muestra su valor.");
} else console.log("JWT_SECRET ya configurado; no se modifica.");
