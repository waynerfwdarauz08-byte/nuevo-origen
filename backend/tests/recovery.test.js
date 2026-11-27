const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const service = require("../src/services/recovery.service");
test("respaldo: cifrado autenticado, recuperación y rechazo de manipulación", async () => {
  const snapshot = {
    version: 1,
    tablas: {},
    archivos: [],
    dato_ficticio: "NO_GUARDAR_EN_CLARO",
  };
  const file = await service.save(snapshot);
  const altered = path.join(
    path.dirname(file),
    "prueba-" + randomUUID() + ".enc",
  );
  try {
    const encrypted = await fs.readFile(file);
    assert.ok(!encrypted.includes(Buffer.from(snapshot.dato_ficticio)));
    assert.deepEqual(await service.load(file), snapshot);
    encrypted[encrypted.length - 1] ^= 1;
    await fs.writeFile(altered, encrypted, { flag: "wx" });
    await assert.rejects(service.load(altered));
  } finally {
    await fs.unlink(file);
    await fs.unlink(altered).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
});
test("respaldo: rutas y destinos no autorizados se rechazan", async () => {
  await assert.rejects(
    service.load(path.resolve("fuera.enc")),
    /fuera del directorio/,
  );
  await assert.rejects(
    service.restoreFiles({ archivos: [] }, path.resolve("uploads")),
    /no exclusivo/,
  );
  const target = path.resolve(
    "../.local/restored-files/prueba-" + randomUUID(),
  );
  await assert.rejects(
    service.restoreFiles(
      { archivos: [{ folder: "uploads", name: "../secreto" }] },
      target,
    ),
    /Ruta/,
  );
});
test("respaldo: destino con datos no se sobrescribe ni inicia importación", async () => {
  let transaction = false;
  const db = {
    getQueryInterface: () => ({
      queryGenerator: { quoteTable: () => "tabla_prueba" },
    }),
    query: async () => [[{ n: 1 }]],
    transaction: async () => {
      transaction = true;
    },
  };
  await assert.rejects(
    service.insert(db, { tablas: { prueba: {} } }),
    /no se sobrescribe/,
  );
  assert.equal(transaction, false);
});
