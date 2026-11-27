import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeMessages, statusLabel } from "../src/services/presentation.js";
import { safeReturn } from "../src/services/returnTo.js";
test("historial fusiona paginación, polling y reintento sin duplicar ni perder precisión", () => {
  const a = { id: "9007199254740993", contenido: "uno" },
    b = { id: "9007199254740994", contenido: "dos" },
    c = { id: "9007199254740992", contenido: "anterior" };
  const rows = mergeMessages([a], [b, a, c]);
  assert.deepEqual(
    rows.map((r) => r.id),
    [c.id, a.id, b.id],
  );
  assert.equal(rows.length, 3);
  assert.equal(
    mergeMessages(rows, [{ ...b, contenido: "persistido" }]).at(-1).contenido,
    "persistido",
  );
});
test("acceso conserva conversación y presenta estados comprensibles", () => {
  for (const path of [
    "/mi-espacio/mensajes",
    "/mi-espacio/mensajes/12?pagina=2",
  ])
    assert.equal(safeReturn(path), path);
  assert.equal(safeReturn("/mi-espacio/mensajes/../../acceso"), "/mi-espacio");
  assert.equal(statusLabel("en_negociacion"), "En negociación");
});
