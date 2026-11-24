require("dotenv").config({ quiet: true });
function readConfig(env = process.env) {
  const mode = env.NODE_ENV || "development";
  if (!["development", "test"].includes(mode))
    throw new Error("Esta etapa solo permite desarrollo local y pruebas.");
  const prefix = mode === "test" ? "TEST_DB_" : "DB_";
  const name = env[`${prefix}NAME`] || `nuevo_origen_${mode}`;
  if (mode === "test" && name !== "nuevo_origen_test")
    throw new Error(
      "Las pruebas requieren la base exclusiva nuevo_origen_test.",
    );
  const dbHost = env[`${prefix}HOST`] || "127.0.0.1";
  if (!["127.0.0.1", "localhost", "::1"].includes(dbHost))
    throw new Error("Solo se permite MySQL local en esta etapa.");
  const port = Number(env.PORT || 3001);
  const dbPort = Number(env[`${prefix}PORT`] || 3307);
  if (![port, dbPort].every((x) => Number.isInteger(x) && x > 0 && x <= 65535))
    throw new Error("Puerto inválido.");
  return {
    mode,
    host: "127.0.0.1",
    port,
    database: {
      database: name,
      username:
        env[`${prefix}USER`] ||
        (mode === "test" ? "nuevo_origen_test" : "nuevo_origen_dev"),
      password: env[`${prefix}PASSWORD`] || "",
      host: dbHost,
      port: dbPort,
      dialect: "mysql",
      logging: false,
      dialectOptions: { connectTimeout: 2000 },
      pool: { max: 5, min: 0, acquire: 3000, idle: 1000 },
    },
  };
}
module.exports = { readConfig };
