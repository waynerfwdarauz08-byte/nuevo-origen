module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const adapted = require("../src/config/postgres-migrations").adapt(
        q,
        S,
        transaction,
      );
      await require("../migrations/20261127000300-agentes-ejecuciones").up(
        adapted.q,
        adapted.S,
      );
    });
  },
  async down() {
    throw new Error("No eliminar trazabilidad automáticamente.");
  },
};
