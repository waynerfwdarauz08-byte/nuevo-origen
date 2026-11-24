const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");
test("salud de proceso no depende de MySQL; caída devuelve 503 sin filtrar errores", async () => {
  const app = createApp({
    identity: false,
    database: {
      authenticate: async () => {
        throw new Error("password=secreto SELECT privado");
      },
    },
  });
  const live = await request(app).get("/api/health").expect(200);
  assert.equal(live.body.status, "ok");
  const ready = await request(app).get("/api/health/ready").expect(503);
  assert.equal(ready.body.database, "down");
  assert.equal(ready.body.requestId, ready.headers["x-request-id"]);
  assert.doesNotMatch(ready.text, /secreto|SELECT|password/);
});
test("MySQL disponible devuelve 200 y referencia independiente por petición", async () => {
  const app = createApp({
    identity: false,
    database: { authenticate: async () => {} },
  });
  const a = await request(app).get("/api/health/ready").expect(200);
  const b = await request(app).get("/api/health").expect(200);
  assert.equal(a.body.database, "up");
  assert.notEqual(a.body.requestId, b.body.requestId);
  assert.equal(a.headers["cache-control"], "no-store");
});
test("404 y JSON inválido tienen contrato seguro", async () => {
  const app = createApp({ identity: false, database: {} });
  const missing = await request(app).get("/api/roles").expect(404);
  assert.equal(missing.body.error.code, "NOT_FOUND");
  const invalid = await request(app)
    .post("/api/health")
    .set("Content-Type", "application/json")
    .send("{")
    .expect(400);
  assert.equal(invalid.body.error.code, "INVALID_JSON");
  assert.ok(invalid.body.requestId);
});
test("cuerpos excesivos se rechazan con 413 seguro", async () => {
  const app = createApp({
    identity: false,
    database: { authenticate: async () => {} },
  });
  const response = await request(app)
    .post("/api/health")
    .set("Content-Type", "application/json")
    .send("x".repeat(17000))
    .expect(413);
  assert.equal(response.body.error.code, "PAYLOAD_TOO_LARGE");
});
