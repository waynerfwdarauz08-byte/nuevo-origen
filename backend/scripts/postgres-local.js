const fs = require("node:fs"),
  path = require("node:path"),
  net = require("node:net");
const { spawnSync } = require("node:child_process"),
  { randomBytes } = require("node:crypto"),
  { Client } = require("pg");
const local = path.resolve(__dirname, "../../.local"),
  data = path.join(local, "postgres-data"),
  file = path.join(local, "postgres-local.json");
const bin = (name) => path.join(local, "postgresql/bin", name + ".exe");
function run(name, args) {
  const fd = fs.openSync(path.join(local, "postgres-setup.log"), "a");
  try {
    const result = spawnSync(bin(name), args, {
      stdio: ["ignore", fd, fd],
      windowsHide: true,
      timeout: 120000,
    });
    if (result.status !== 0)
      throw new Error(
        "No se completó " + name + "; revisar registro local depurado.",
      );
  } finally {
    fs.closeSync(fd);
  }
}
async function unused() {
  await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", () =>
      reject(
        new Error("El puerto 5433 está ocupado; no se modifica otro servicio."),
      ),
    );
    s.listen(5433, "127.0.0.1", () => s.close(resolve));
  });
}
async function setup() {
  if (fs.existsSync(file)) {
    await resume();
    return;
  }
  if (fs.existsSync(data))
    throw new Error(
      "Hay datos PostgreSQL sin configuración registrada; no se reinicializan.",
    );
  if (!fs.existsSync(bin("initdb")))
    throw new Error(
      "Faltan binarios oficiales PostgreSQL en .local/postgresql.",
    );
  await unused();
  const cfg = {
    host: "127.0.0.1",
    port: 5433,
    admin: {
      user: "postgres",
      password: randomBytes(32).toString("hex"),
      database: "postgres",
    },
    development: {
      user: "nuevo_origen_dev",
      password: randomBytes(32).toString("hex"),
      database: "nuevo_origen_development",
    },
    test: {
      user: "nuevo_origen_test",
      password: randomBytes(32).toString("hex"),
      database: "nuevo_origen_test",
    },
  };
  const password = path.join(local, "postgres-init.pw");
  fs.writeFileSync(password, cfg.admin.password, { flag: "wx", mode: 0o600 });
  try {
    run("initdb", [
      "-D",
      data,
      "-U",
      "postgres",
      "-A",
      "scram-sha-256",
      "--pwfile=" + password,
      "--encoding=UTF8",
      "--locale=C",
    ]);
  } finally {
    fs.unlinkSync(password);
  }
  fs.writeFileSync(file, JSON.stringify(cfg), { flag: "wx", mode: 0o600 });
  await resume();
}
async function resume() {
  if (!fs.existsSync(file) || !fs.existsSync(data))
    throw new Error("No existe instancia aislada registrada; ejecutar setup.");
  const status = spawnSync(bin("pg_ctl"), ["-D", data, "status"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (status.status !== 0) {
    await unused();
    run("pg_ctl", [
      "-D",
      data,
      "-l",
      path.join(local, "postgres.log"),
      "-o",
      "-p 5433 -h 127.0.0.1",
      "-w",
      "start",
    ]);
  }
  const cfg = JSON.parse(fs.readFileSync(file)),
    client = new Client({
      ...cfg.admin,
      host: cfg.host,
      port: cfg.port,
      connectionTimeoutMillis: 5000,
    });
  try {
    await client.connect();
    await client.query("ALTER SYSTEM SET log_min_error_statement = 'panic'");
    await client.query(
      "ALTER SYSTEM SET log_parameter_max_length_on_error = '0'",
    );
    await client.query("ALTER SYSTEM SET log_error_verbosity = 'terse'");
    await client.query("SELECT pg_reload_conf()");
    for (const key of ["development", "test"]) {
      const role = cfg[key];
      if (
        !(
          await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [
            role.user,
          ])
        ).rowCount
      )
        await client.query(
          `CREATE ROLE ${role.user} LOGIN PASSWORD '${role.password}'`,
        );
      if (
        !(
          await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [
            role.database,
          ])
        ).rowCount
      )
        await client.query(
          `CREATE DATABASE ${role.database} OWNER ${role.user}`,
        );
      await client.query(`REVOKE ALL ON DATABASE ${role.database} FROM PUBLIC`);
      await client.query(
        `GRANT CONNECT ON DATABASE ${role.database} TO ${role.user}`,
      );
    }
    console.log(
      "PostgreSQL aislado disponible en 127.0.0.1:5433; desarrollo/pruebas separados. MySQL conservado.",
    );
  } finally {
    await client.end();
  }
}
async function stop() {
  if (!fs.existsSync(file)) throw new Error("No existe instancia registrada.");
  run("pg_ctl", ["-D", data, "-w", "stop", "-m", "fast"]);
  console.log("PostgreSQL aislado detenido; datos conservados.");
}
(
  ({ setup, resume, stop })[process.argv[2] || "resume"] ||
  (() => Promise.reject(new Error("Usar setup, resume o stop.")))
)().catch(() => {
  console.error(
    "No se completó la operación PostgreSQL local. Revisar .local/postgres-setup.log sin compartir credenciales.",
  );
  process.exitCode = 1;
});
