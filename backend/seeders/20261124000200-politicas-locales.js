const fs = require("node:fs");
const path = require("node:path");
module.exports = {
  async up(q) {
    // Instantáneas inmutables: cualquier cambio posterior requiere otra versión y seeder.
    const version = "local-borrador-0.1-20261124";
    await q.bulkInsert(
      "politicas",
      [
        ["terminos", "terminos-de-uso.md"],
        ["privacidad", "privacidad.md"],
      ].map(([tipo, file]) => ({
        tipo,
        version,
        contenido: fs.readFileSync(
          path.resolve(__dirname, "../../docs/politicas", file),
          "utf8",
        ),
        vigente: true,
        estado: "borrador",
        publicada_en: null,
      })),
    );
  },
  async down() {
    throw new Error(
      "Las versiones con aceptaciones no se retiran automáticamente. Crear una nueva versión.",
    );
  },
};
