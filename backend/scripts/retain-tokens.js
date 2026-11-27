require("../src/config/env").readConfig();
const m = require("../src/models");
(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.some((a) => a !== "--apply"))
      throw new Error(
        "Argumento inválido. Usar sin argumentos para revisión o --apply para aplicar.",
      );
    console.log(
      JSON.stringify(
        await require("../src/services/token-retention.service").retainTokens(
          m,
          { apply: args.includes("--apply") },
        ),
        null,
        2,
      ),
    );
  } catch {
    console.error(
      "No se completó la limpieza local. Revisá configuración y base exclusiva.",
    );
    process.exitCode = 1;
  } finally {
    await m.sequelize.close();
  }
})();
