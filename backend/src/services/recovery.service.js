const fs = require("node:fs/promises"),
  path = require("node:path");
const {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} = require("node:crypto");
const { Transaction, DataTypes } = require("sequelize");
const local = path.resolve(__dirname, "../../../.local");
const digest = (v) => createHash("sha256").update(v).digest("hex");
function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
function kind(type) {
  const t = type.toUpperCase();
  return t.includes("JSON")
    ? "json"
    : /TINYINT\(1\)|BOOLEAN/.test(t)
      ? "boolean"
      : t === "DATE"
        ? "dateonly"
        : /DATE|TIME/.test(t)
          ? "date"
          : t.includes("BIGINT")
            ? "bigint"
            : /DECIMAL|NUMERIC/.test(t)
              ? "decimal"
              : "plain";
}
function normalize(row, columns) {
  const result = {};
  for (const [name, field] of Object.entries(columns)) {
    let value = row[name];
    if (value == null) {
      result[name] = null;
      continue;
    }
    if (field.kind === "bigint") {
      if (typeof value === "number" && !Number.isSafeInteger(value))
        throw new Error("Identificador fuera del rango exacto");
      value = String(value);
    }
    if (field.kind === "boolean")
      value = value === true || value === 1 || value === "1";
    if (field.kind === "date") value = new Date(value).toISOString();
    if (field.kind === "dateonly")
      value =
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : String(value).slice(0, 10);
    if (field.kind === "decimal") {
      const scale = field.scale ?? 3;
      const d = require("./decimal");
      value = d.format(d.scaled(String(value), scale), scale);
    }
    if (field.kind === "json" && typeof value === "string")
      value = JSON.parse(value);
    result[name] = value;
  }
  return result;
}
const hashRows = (rows) => digest(rows.map(canonical).sort().join("\n"));
async function capture(db, { files = true } = {}) {
  const result = {
    version: 1,
    creado_en: new Date().toISOString(),
    motor: db.getDialect(),
    tablas: {},
    archivos: [],
    migraciones: [],
    seeders: [],
  };
  await db.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const q = db.getQueryInterface(),
        names = (await q.showAllTables({ transaction })).map((n) =>
          typeof n === "string" ? n : n.tableName,
        );
      const [precision] = await db.query(
        "SELECT table_name AS table_name,column_name AS column_name,numeric_scale AS numeric_scale FROM information_schema.columns WHERE table_schema=:schema",
        {
          replacements: {
            schema:
              db.getDialect() === "postgres" ? "public" : db.config.database,
          },
          transaction,
        },
      );
      for (const name of names) {
        if (["sequelizemeta", "sequelizedata"].includes(name.toLowerCase())) {
          const [rows] = await db.query(
            "SELECT * FROM " + q.queryGenerator.quoteTable(name),
            { transaction },
          );
          result[
            name.toLowerCase() === "sequelizemeta" ? "migraciones" : "seeders"
          ] = rows.map((r) => r.name).sort();
          continue;
        }
        if (!/^[a-z_][a-z0-9_]*$/.test(name))
          throw new Error("Tabla inesperada");
        const description = await q.describeTable(name, { transaction }),
          columns = {},
          dependencies = new Set();
        for (const [key, c] of Object.entries(description)) {
          columns[key] = {
            kind: kind(c.type),
            scale: Number(
              precision.find(
                (p) => p.table_name === name && p.column_name === key,
              )?.numeric_scale ?? 3,
            ),
            primary: !!c.primaryKey,
          };
        }
        for (const fk of await q.getForeignKeyReferencesForTable(name, {
          transaction,
        }))
          if (fk.referencedTableName && fk.referencedTableName !== name)
            dependencies.add(fk.referencedTableName);
        const [rows] = await db.query(
          "SELECT * FROM " + q.queryGenerator.quoteTable(name),
          { transaction },
        );
        const records = rows.map((r) => normalize(r, columns));
        result.tablas[name] = {
          columns,
          dependencies: [...dependencies],
          rows: records,
          count: records.length,
          hash: hashRows(records),
        };
      }
    },
  );
  if (files) {
    const referenced = new Map(
      (result.tablas.archivos?.rows || []).map((r) => [
        r.clave_objeto,
        r.estado,
      ]),
    );
    const found = new Set();
    for (const folder of ["uploads", "documents"]) {
      const root = path.join(local, folder);
      let entries = [];
      try {
        entries = await fs.readdir(root, { withFileTypes: true });
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      for (const e of entries) {
        if (!referenced.has(e.name)) continue;
        if (!e.isFile() || e.isSymbolicLink())
          throw new Error("Archivo local inesperado");
        const data = await fs.readFile(path.join(root, e.name));
        found.add(e.name);
        result.archivos.push({
          folder,
          name: e.name,
          hash: digest(data),
          bytes: data.length,
          data: data.toString("base64"),
        });
      }
    }
    for (const [name, state] of referenced)
      if (state === "activo" && !found.has(name))
        throw new Error(
          "Falta un archivo activo; no se acredita respaldo completo",
        );
  }
  result.sources = {};
  for (const name of result.migraciones) {
    if (!/^[\w-]+\.js$/.test(name)) throw new Error("Migración inválida");
    const p = path.resolve(__dirname, "../../migrations", name);
    try {
      result.sources[name] = digest(await fs.readFile(p));
    } catch {
      result.sources[name] = null;
    }
  }
  return result;
}
async function key() {
  const p = path.join(local, "recovery.key");
  try {
    return await fs.readFile(p);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    const value = randomBytes(32);
    try {
      await fs.writeFile(p, value, { flag: "wx", mode: 0o600 });
      return value;
    } catch (e) {
      if (e.code === "EEXIST") return fs.readFile(p);
      throw e;
    }
  }
}
async function save(snapshot) {
  const raw = Buffer.from(JSON.stringify(snapshot));
  if (raw.length > 256 * 1024 * 1024)
    throw new Error(
      "Respaldo supera límite local; usar respaldo nativo por streaming.",
    );
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", await key(), iv),
    encrypted = Buffer.concat([cipher.update(raw), cipher.final()]);
  const dir = path.join(local, "backups");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(
    dir,
    new Date().toISOString().replace(/[:.]/g, "-") +
      "-" +
      randomBytes(4).toString("hex") +
      ".enc",
  );
  await fs.writeFile(
    file,
    Buffer.concat([Buffer.from("NOBK1"), iv, cipher.getAuthTag(), encrypted]),
    { flag: "wx", mode: 0o600 },
  );
  return file;
}
async function load(file) {
  const resolved = path.resolve(file),
    root = path.join(local, "backups");
  if (path.dirname(resolved) !== root || path.extname(resolved) !== ".enc")
    throw new Error("Respaldo fuera del directorio autorizado");
  const bytes = await fs.readFile(resolved);
  if (bytes.subarray(0, 5).toString() !== "NOBK1")
    throw new Error("Formato inválido");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    await fs.readFile(path.join(local, "recovery.key")),
    bytes.subarray(5, 17),
  );
  decipher.setAuthTag(bytes.subarray(17, 33));
  const result = JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(33)),
      decipher.final(),
    ]).toString(),
  );
  if (result.version !== 1) throw new Error("Versión no soportada");
  return result;
}
function ordered(snapshot) {
  const pending = new Set(Object.keys(snapshot.tablas)),
    done = [];
  while (pending.size) {
    const next = [...pending]
      .filter((name) =>
        snapshot.tablas[name].dependencies.every((d) => !pending.has(d)),
      )
      .sort();
    if (!next.length) throw new Error("Dependencias cíclicas de respaldo");
    for (const name of next) {
      pending.delete(name);
      done.push(name);
    }
  }
  return done;
}
async function compare(db, snapshot) {
  const q = db.getQueryInterface(),
    differences = [];
  for (const [name, t] of Object.entries(snapshot.tablas)) {
    const [rows] = await db.query(
      "SELECT * FROM " + q.queryGenerator.quoteTable(name),
    );
    const normalized = rows.map((r) => normalize(r, t.columns));
    if (normalized.length !== t.count || hashRows(normalized) !== t.hash)
      differences.push(name);
  }
  return {
    tablas_comparadas: Object.keys(snapshot.tablas).length,
    filas: Object.values(snapshot.tablas).reduce((n, t) => n + t.count, 0),
    coinciden: !differences.length,
    diferencias: differences,
  };
}
async function insert(db, snapshot) {
  const q = db.getQueryInterface();
  const initialized = new Set();
  for (const name of Object.keys(snapshot.tablas)) {
    const [count] = await db.query(
      "SELECT COUNT(*) AS n FROM " + q.queryGenerator.quoteTable(name),
    );
    if (Number(count[0].n) > 0) {
      // Únicamente el catálogo determinista inicializado por la migración puede
      // reutilizarse, tras verificar coincidencia completa. Nunca se sobrescribe.
      if (
        name === "agentes" &&
        (await compare(db, { tablas: { [name]: snapshot.tablas[name] } }))
          .coinciden
      )
        initialized.add(name);
      else throw new Error("Destino contiene datos; no se sobrescribe.");
    }
  }
  await db.transaction(async (transaction) => {
    for (const name of ordered(snapshot)) {
      if (initialized.has(name)) continue;
      const t = snapshot.tablas[name],
        attrs = {};
      for (const [key, field] of Object.entries(t.columns)) {
        if (field.kind === "json") attrs[key] = { type: DataTypes.JSON() };
        if (
          db.getDialect() === "postgres" &&
          field.kind === "bigint" &&
          t.rows.some(
            (r) => r[key] != null && BigInt(r[key]) > 9223372036854775807n,
          )
        )
          throw new Error("BIGINT excede rango PostgreSQL");
      }
      for (let i = 0; i < t.rows.length; i += 100) {
        const batch = t.rows
          .slice(i, i + 100)
          .map((row) =>
            Object.fromEntries(
              Object.entries(row).map(([k, v]) => [
                k,
                v != null && t.columns[k].kind === "date" ? new Date(v) : v,
              ]),
            ),
          );
        await q.bulkInsert(name, batch, { transaction }, attrs);
      }
    }
  });
  if (db.getDialect() === "postgres") {
    for (const [name, t] of Object.entries(snapshot.tablas)) {
      if (!t.columns.id?.primary) continue;
      const [rows] = await db.query(
        "SELECT pg_get_serial_sequence(:table,:field) AS sequence",
        { replacements: { table: name, field: "id" } },
      );
      if (!rows[0]?.sequence) continue;
      const [max] = await db.query(
        "SELECT MAX(id)::text AS value FROM " +
          q.queryGenerator.quoteTable(name),
      );
      await db.query(
        "SELECT setval(:sequence,CAST(:value AS bigint),:called)",
        {
          replacements: {
            sequence: rows[0].sequence,
            value: max[0].value || "1",
            called: !!max[0].value,
          },
        },
      );
    }
  }
  const metadata = "SequelizeData";
  const names = await q.showAllTables();
  if (!names.includes(metadata) && !names.includes(metadata.toLowerCase()))
    await q.createTable(metadata, {
      name: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    });
  if (snapshot.seeders.length)
    await q.bulkInsert(
      metadata,
      snapshot.seeders.map((name) => ({ name })),
    );
}
async function restoreFiles(snapshot, destination) {
  const target = path.resolve(destination),
    allowed = path.join(local, "restored-files");
  if (!target.startsWith(allowed + path.sep))
    throw new Error("Destino de archivos no exclusivo");
  for (const file of snapshot.archivos) {
    if (
      !["uploads", "documents"].includes(file.folder) ||
      path.basename(file.name) !== file.name ||
      file.name === ".."
    )
      throw new Error("Ruta de archivo inválida");
    const data = Buffer.from(file.data, "base64");
    if (digest(data) !== file.hash || data.length !== file.bytes)
      throw new Error("Huella de archivo inválida");
    const folder = path.join(target, file.folder);
    await fs.mkdir(folder, { recursive: true });
    const destination = path.join(folder, file.name);
    await fs.writeFile(destination, data, { flag: "wx", mode: 0o600 });
    if (digest(await fs.readFile(destination)) !== file.hash)
      throw new Error("La copia de archivo no coincide");
  }
  return snapshot.archivos.length;
}
module.exports = {
  capture,
  save,
  load,
  insert,
  compare,
  restoreFiles,
  canonical,
};
