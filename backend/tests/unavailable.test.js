const { test } = require("node:test"),
  assert = require("node:assert/strict");
test("fallo de conexión devuelve 503 comprensible sin datos internos", () => {
  const handler = require("../src/middlewares/errorHandler");
  for (const name of [
    "SequelizeConnectionRefusedError",
    "SequelizeConnectionAcquireTimeoutError",
    "SequelizeHostNotFoundError",
  ]) {
    let status, body;
    const res = {
      status(n) {
        status = n;
        return this;
      },
      json(v) {
        body = v;
      },
    };
    handler(
      {
        name,
        message: "credencial-ficticia-no-exponer",
        sql: "consulta-ficticia",
      },
      { requestId: "comprobacion" },
      res,
      () => assert.fail("No debe delegar"),
    );
    assert.equal(status, 503);
    assert.equal(body.error.code, "DATABASE_UNAVAILABLE");
    assert.equal(body.requestId, "comprobacion");
    assert.ok(!JSON.stringify(body).includes("credencial-ficticia"));
  }
});
