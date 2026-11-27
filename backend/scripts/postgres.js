const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const file = path.resolve(__dirname, "../../.local/postgres-local.json");
if (!fs.existsSync(file))
  throw new Error("Preparar la instancia PostgreSQL aislada primero.");
const cfg = JSON.parse(fs.readFileSync(file)),
  action = process.argv[2];
const base = {
  ...process.env,
  DB_DIALECT: "postgres",
  DB_HOST: cfg.host,
  DB_PORT: String(cfg.port),
  DB_NAME: cfg.development.database,
  DB_USER: cfg.development.user,
  DB_PASSWORD: cfg.development.password,
  TEST_DB_DIALECT: "postgres",
  TEST_DB_HOST: cfg.host,
  TEST_DB_PORT: String(cfg.port),
  TEST_DB_NAME: cfg.test.database,
  TEST_DB_USER: cfg.test.user,
  TEST_DB_PASSWORD: cfg.test.password,
};
const cli = path.resolve(
  __dirname,
  "../node_modules/sequelize-cli/lib/sequelize",
);
const commands = {
  migrate: [cli, "db:migrate"],
  seed: [cli, "db:seed:all"],
  test: [path.resolve(__dirname, "test-mysql.js")],
};
if (!commands[action])
  throw new Error("Usar migrate, seed o test. No se cambia el backend activo.");
const result = spawnSync(process.execPath, commands[action], {
  env: { ...base, NODE_ENV: action === "test" ? "test" : "development" },
  stdio: "inherit",
  windowsHide: true,
  cwd: path.resolve(__dirname, ".."),
});
process.exitCode = result.status ?? 1;
