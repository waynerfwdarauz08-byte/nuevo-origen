require("dotenv").config({ quiet: true });
function readConfig(env = process.env) {
  const mode = env.NODE_ENV || "development";
  if (!["development", "test"].includes(mode))
    throw new Error("Esta etapa solo permite desarrollo local y pruebas.");
  const prefix = mode === "test" ? "TEST_DB_" : "DB_";
  const dialect = env[`${prefix}DIALECT`] || "mysql";
  if (!["mysql", "postgres"].includes(dialect))
    throw new Error("Motor SQL no permitido.");
  const name = env[`${prefix}NAME`] || `nuevo_origen_${mode}`;
  if (mode === "test" && name !== "nuevo_origen_test")
    throw new Error(
      "Las pruebas requieren la base exclusiva nuevo_origen_test.",
    );
  const dbHost = env[`${prefix}HOST`] || "127.0.0.1";
  if (!["127.0.0.1", "localhost", "::1"].includes(dbHost))
    throw new Error("Solo se permiten bases locales en esta etapa.");
  const port = Number(env.PORT || 3001);
  const dbPort = Number(
    env[`${prefix}PORT`] || (dialect === "postgres" ? 5433 : 3307),
  );
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
      dialect,
      logging: false,
      dialectOptions:
        dialect === "postgres"
          ? { connectionTimeoutMillis: 2000 }
          : {
              connectTimeout: 2000,
              supportBigNumbers: true,
              bigNumberStrings: true,
            },
      pool: { max: 5, min: 0, acquire: 3000, idle: 1000 },
    },
  };
}
module.exports = { readConfig };
