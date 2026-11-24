// Instancia de verificación aislada. No instala servicios ni usa MySQL80.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn, spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const mysql = require("mysql2/promise");
const root = path.resolve(__dirname, "../..");
const local = path.join(root, ".local");
const adminFile = path.join(local, "mysql-admin.json");
const exe =
  process.env.MYSQLD_PATH ||
  "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function start() {
  if (!fs.existsSync(exe))
    throw new Error("Definí MYSQLD_PATH con el ejecutable MySQL instalado.");
  if (
    !fs.existsSync(adminFile) &&
    fs.existsSync(path.resolve(__dirname, "../.env"))
  )
    throw new Error("Ya existe backend/.env; no se sobrescribe.");
  if (fs.existsSync(adminFile)) {
    const admin = JSON.parse(fs.readFileSync(adminFile));
    const db = await mysql.createConnection(admin);
    await db.ping();
    await db.end();
    console.log("Instancia aislada ya disponible.");
    return;
  }
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () =>
      reject(
        new Error(
          "El puerto 3307 está ocupado; no se modificó ningún servidor.",
        ),
      ),
    );
    probe.listen(3307, "127.0.0.1", () => probe.close(resolve));
  });
  const data = path.join(local, "mysql-data");
  if (fs.existsSync(data))
    throw new Error(
      "Ya existe un directorio de datos. Revisalo manualmente; no se elimina ni reinicializa.",
    );
  fs.mkdirSync(local, { recursive: true });
  const initialized = spawnSync(
    exe,
    ["--no-defaults", "--initialize-insecure", `--datadir=${data}`],
    { windowsHide: true, encoding: "utf8" },
  );
  if (initialized.status !== 0)
    throw new Error("No se pudo inicializar MySQL; revisá .local/mysql-data.");
  const password = () => randomBytes(24).toString("hex");
  const adminPassword = password();
  const devPassword = password();
  const testPassword = password();
  const initFile = path.join(local, "mysql-init.sql");
  fs.writeFileSync(
    initFile,
    [
      `ALTER USER 'root'@'localhost' IDENTIFIED BY '${adminPassword}';`,
      "CREATE DATABASE nuevo_origen_development CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;",
      "CREATE DATABASE nuevo_origen_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;",
      `CREATE USER 'nuevo_origen_dev'@'localhost' IDENTIFIED BY '${devPassword}';`,
      `CREATE USER 'nuevo_origen_test'@'localhost' IDENTIFIED BY '${testPassword}';`,
      "GRANT ALL ON nuevo_origen_development.* TO 'nuevo_origen_dev'@'localhost';",
      "GRANT ALL ON nuevo_origen_test.* TO 'nuevo_origen_test'@'localhost';",
    ].join("\n"),
  );
  const admin = {
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: adminPassword,
    connectTimeout: 2000,
  };
  fs.writeFileSync(adminFile, JSON.stringify(admin));
  const child = spawn(
    exe,
    [
      "--no-defaults",
      `--datadir=${data}`,
      "--bind-address=127.0.0.1",
      "--port=3307",
      "--mysqlx=OFF",
      `--init-file=${initFile}`,
      `--log-error=${path.join(local, "mysql.log")}`,
      `--pid-file=${path.join(local, "mysql.pid")}`,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  child.on("error", () =>
    console.error("No se pudo iniciar el ejecutable MySQL."),
  );
  for (let i = 0; i < 40; i++) {
    try {
      const db = await mysql.createConnection(admin);
      await db.ping();
      await db.end();
      fs.unlinkSync(initFile);
      const envPath = path.resolve(__dirname, "../.env");
      if (fs.existsSync(envPath))
        throw new Error("Ya existe backend/.env; no se sobrescribe.");
      fs.writeFileSync(
        envPath,
        `NODE_ENV=development\nPORT=3001\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_NAME=nuevo_origen_development\nDB_USER=nuevo_origen_dev\nDB_PASSWORD=${devPassword}\nTEST_DB_HOST=127.0.0.1\nTEST_DB_PORT=3307\nTEST_DB_NAME=nuevo_origen_test\nTEST_DB_USER=nuevo_origen_test\nTEST_DB_PASSWORD=${testPassword}\n`,
      );
      console.log(
        "MySQL aislado disponible en 127.0.0.1:3307; bases y usuarios separados, secretos ignorados.",
      );
      return;
    } catch (error) {
      if (i === 39)
        throw new Error("MySQL aislado no inició; revisá .local/mysql.log.");
      await sleep(500);
    }
  }
}
async function stop() {
  if (!fs.existsSync(adminFile))
    throw new Error("No hay instancia aislada registrada.");
  const db = await mysql.createConnection(
    JSON.parse(fs.readFileSync(adminFile)),
  );
  try {
    await db.query("SHUTDOWN");
  } finally {
    await db.end().catch(() => {});
  }
  console.log("Instancia aislada detenida; datos conservados.");
}
async function resume() {
  const data = path.join(local, "mysql-data");
  if (!fs.existsSync(adminFile) || !fs.existsSync(data))
    throw new Error("Primero ejecutá start.");
  const child = spawn(
    exe,
    [
      "--no-defaults",
      `--datadir=${data}`,
      "--bind-address=127.0.0.1",
      "--port=3307",
      "--mysqlx=OFF",
      `--log-error=${path.join(local, "mysql.log")}`,
      `--pid-file=${path.join(local, "mysql.pid")}`,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  child.on("error", () =>
    console.error("No se pudo iniciar el ejecutable MySQL."),
  );
  console.log(
    "Inicio solicitado; mantener esta terminal abierta y comprobar /api/health/ready.",
  );
}
const action = process.argv[2] || "start";
(
  ({ start, stop, resume })[action] ||
  (() => Promise.reject(new Error("Usá start, stop o resume.")))
)().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
