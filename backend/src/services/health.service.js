function createHealthService(database) {
  return {
    async readiness() {
      try {
        await database.authenticate();
        return { status: "ready", database: "up" };
      } catch {
        return { status: "unavailable", database: "down" };
      }
    },
  };
}
module.exports = { createHealthService };
