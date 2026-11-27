module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const a = require("../src/config/postgres-migrations").adapt(
        q,
        S,
        transaction,
      );
      await require("../migrations/20261127000400-chat-nori").up(a.q, a.S);
    });
  },
  async down() {
    throw new Error("No eliminar conversaciones automáticamente.");
  },
};
