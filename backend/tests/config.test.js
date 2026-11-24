const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readConfig } = require("../src/config/env");
test("producción y hosts externos rechazados en etapa local", () => {
  assert.throws(() => readConfig({ NODE_ENV: "production" }));
  assert.throws(() => readConfig({ DB_HOST: "example.com" }));
});
test("pruebas aisladas y puertos válidos", () => {
  assert.throws(() =>
    readConfig({ NODE_ENV: "test", TEST_DB_NAME: "produccion" }),
  );
  assert.throws(() => readConfig({ PORT: "abc" }));
  assert.equal(
    readConfig({ NODE_ENV: "test", DB_PASSWORD: "no-usar" }).database.password,
    "",
  );
  assert.equal(
    readConfig({ NODE_ENV: "test" }).database.database,
    "nuevo_origen_test",
  );
});
