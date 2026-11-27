import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturn } from "../src/services/returnTo.js";
test("retorno conserva ruta pública e intención sin ejecutar acciones", () => {
  assert.equal(
    safeReturn("/?intencion=publicar#materiales"),
    "/?intencion=publicar#materiales",
  );
  assert.equal(safeReturn("/estado"), "/estado");
  for (const route of [
    "/mi-espacio/solicitudes/nueva?oferta=12",
    "/mi-espacio/acuerdos/9",
    "/mi-espacio/solicitudes/9",
    "/mi-espacio/incidencias",
    "/mi-espacio/indicadores",
    "/mi-espacio/avisos",
  ])
    assert.equal(safeReturn(route), route);
  assert.equal(
    safeReturn("/catalogo?q=carton&pagina=2"),
    "/catalogo?q=carton&pagina=2",
  );
  assert.equal(
    safeReturn("/materiales/12?intencion=solicitar"),
    "/materiales/12?intencion=solicitar",
  );
  assert.equal(
    safeReturn("/mi-espacio/ofertas/nueva"),
    "/mi-espacio/ofertas/nueva",
  );
});
test("retorno impide orígenes externos, rutas de login y URLs ambiguas", () => {
  for (const value of [
    "https://ajeno.test",
    "//ajeno.test",
    "/\\ajeno.test",
    "/acceso",
    "/%2f%2fajeno.test",
    "/ruta-inexistente",
    "/materiales/12/../../acceso",
    "/mi-espacio/ofertas/../../acceso",
    null,
    "/\n//ajeno.test",
  ])
    assert.equal(safeReturn(value), "/mi-espacio");
});
