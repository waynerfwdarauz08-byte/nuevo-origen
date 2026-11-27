require("dotenv").config({ quiet: true });
const fs = require("node:fs/promises"),
  path = require("node:path"),
  { randomBytes, createHash } = require("node:crypto"),
  { Sequelize } = require("sequelize");
const root = path.resolve(__dirname, "../.."),
  local = path.join(root, ".local"),
  service = require("../src/services/recovery.service");
const hash = (b) => createHash("sha256").update(b).digest("hex");
async function schema(db, snapshot) {
  const q = db.getQueryInterface();
  for (const name of snapshot.migraciones) {
    if (!/^[\w-]+\.js$/.test(name) || !snapshot.sources[name])
      throw new Error("Migración de origen no verificable");
    const file = path.resolve(__dirname, "../migrations", name);
    if (hash(await fs.readFile(file)) !== snapshot.sources[name])
      throw new Error("Cambió una migración histórica");
    await require(file).up(q, require("sequelize"));
  }
}
async function run() {
  const [action, archive] = process.argv.slice(2),
    opened = [];
  const started = Date.now();
  try {
    if (!["backup", "restore-mysql", "copy-postgres"].includes(action))
      throw new Error("Acción no permitida");
    if (action === "backup") {
      const config = require("../src/config/env").readConfig();
      if (
        config.mode !== "development" ||
        config.database.dialect !== "mysql" ||
        config.database.database !== "nuevo_origen_development" ||
        config.database.port !== 3307
      )
        throw new Error("Origen local no autorizado");
      const db = new Sequelize(config.database);
      opened.push(db);
      const snapshot = await service.capture(db);
      const file = await service.save(snapshot);
      console.log(
        JSON.stringify({
          respaldo: path.relative(root, file),
          cifrado: "AES-256-GCM",
          tablas: Object.keys(snapshot.tablas).length,
          filas: Object.values(snapshot.tablas).reduce(
            (n, t) => n + t.count,
            0,
          ),
          archivos: snapshot.archivos.length,
          segundos: (Date.now() - started) / 1000,
        }),
      );
      return;
    }
    if (!archive) throw new Error("Indicar respaldo cifrado de .local/backups");
    const snapshot = await service.load(path.resolve(root, archive));
    let db, target;
    if (action === "restore-mysql") {
      const admin = JSON.parse(
        await fs.readFile(path.join(local, "mysql-admin.json")),
      );
      if (admin.host !== "127.0.0.1" || admin.port !== 3307)
        throw new Error("Instancia no autorizada");
      const connection = {
        dialect: "mysql",
        host: admin.host,
        port: admin.port,
        username: admin.user,
        password: admin.password,
        logging: false,
        dialectOptions: { supportBigNumbers: true, bigNumberStrings: true },
      };
      const manager = new Sequelize({ ...connection, database: "mysql" });
      opened.push(manager);
      target = "nuevo_origen_restore_" + randomBytes(6).toString("hex");
      await manager.query(
        "CREATE DATABASE `" +
          target +
          "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci",
      );
      db = new Sequelize({ ...connection, database: target });
      opened.push(db);
      await schema(db, snapshot);
    } else {
      const cfg = JSON.parse(
        await fs.readFile(path.join(local, "postgres-local.json")),
      );
      if (
        cfg.host !== "127.0.0.1" ||
        cfg.port !== 5433 ||
        cfg.development.database !== "nuevo_origen_development"
      )
        throw new Error("Destino PostgreSQL no autorizado");
      target = cfg.development.database;
      db = new Sequelize({
        dialect: "postgres",
        host: cfg.host,
        port: cfg.port,
        database: target,
        username: cfg.development.user,
        password: cfg.development.password,
        logging: false,
      });
      opened.push(db);
      const [baseline] = await db.query('SELECT name FROM "SequelizeMeta"');
      if (!baseline.some((r) => r.name === "20261127000200-baseline-local.js"))
        throw new Error("Aplicar baseline PostgreSQL antes de importar");
    }
    await service.insert(db, snapshot);
    const result = await service.compare(db, snapshot);
    if (!result.coinciden) throw new Error("Comparación de datos no coincide");
    const filesRoot = path.join(
        local,
        "restored-files",
        action + "-" + randomBytes(6).toString("hex"),
      ),
      files = await service.restoreFiles(snapshot, filesRoot);
    if (action === "copy-postgres") {
      await db.transaction(async (transaction) => {
        await db.query(
          "UPDATE sesiones SET revocada_en=CURRENT_TIMESTAMP WHERE revocada_en IS NULL",
          { transaction },
        );
        await db.query(
          "UPDATE tokens_accion SET revocado_en=CURRENT_TIMESTAMP WHERE usado_en IS NULL AND revocado_en IS NULL",
          { transaction },
        );
        await db.query(
          "UPDATE invitaciones SET estado='revocada' WHERE estado='pendiente'",
          { transaction },
        );
      });
    }
    const report = {
      accion: action,
      destino: target,
      ...result,
      archivos_verificados: files,
      archivos_destino: path.relative(root, filesRoot),
      accesos_revocados_en_copia: action === "copy-postgres",
      segundos: (Date.now() - started) / 1000,
      origen_conservado: true,
      backend_activo: "mysql",
    };
    await fs.mkdir(path.join(local, "recovery-reports"), { recursive: true });
    await fs.writeFile(
      path.join(
        local,
        "recovery-reports",
        new Date().toISOString().replace(/[:.]/g, "-") + ".json",
      ),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
  } finally {
    for (const db of opened.reverse()) await db.close();
  }
}
run().catch(() => {
  console.error(
    "No se completó la operación de recuperación. No se sobrescribió ni eliminó la base original. Revisar configuración/consistencia sin compartir datos privados.",
  );
  process.exitCode = 1;
});
