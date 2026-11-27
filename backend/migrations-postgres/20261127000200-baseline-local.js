const path = require("node:path");
const files = [
  "20261124000100-roles-permisos.js",
  "20261124000200-identidad-empresas.js",
  "20261124000300-equipo-invitaciones-auditoria.js",
  "20261126000100-materiales-catalogo.js",
  "20261126000200-operacion-empresarial.js",
  "20261126000300-solicitudes-derechos.js",
  "20261127000100-mensajeria-idempotente.js",
];
module.exports = {
  async up(q, S) {
    if (q.sequelize.getDialect() !== "postgres")
      throw new Error("Baseline exclusivo PostgreSQL.");
    await q.sequelize.transaction(async (transaction) => {
      const adapted = require("../src/config/postgres-migrations").adapt(
        q,
        S,
        transaction,
      );
      for (const name of files)
        await require(path.resolve(__dirname, "../migrations", name)).up(
          adapted.q,
          adapted.S,
        );
    });
  },
  async down() {
    throw new Error(
      "El baseline no se elimina automáticamente. Restaurar una copia en una base nueva exclusiva.",
    );
  },
};
