import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturn } from "../src/services/returnTo.js";
test("retorno conserva ruta pública e intención sin ejecutar acciones", () => {
  assert.equal(
    safeReturn("/?intencion=publicar#materiales"),
    "/?intencion=publicar#materiales",
  );
  assert.equal(safeReturn("/estado"), "/estado");
});
test("retorno impide orígenes externos, rutas de login y URLs ambiguas", () => {
  for (const value of [
    "https://ajeno.test",
    "//ajeno.test",
    "/\\ajeno.test",
    "/acceso",
    "/%2f%2fajeno.test",
    "/ruta-inexistente",
    null,
    "/\n//ajeno.test",
  ])
    assert.equal(safeReturn(value), "/mi-espacio");
});
