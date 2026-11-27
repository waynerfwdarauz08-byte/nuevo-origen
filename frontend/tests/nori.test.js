import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeNoriTurns } from "../src/services/nori.js";
test("Nori: concilia mensaje optimista, respuesta y recarga sin duplicar", () => {
  const optimistic = {
      id: "pendiente-x",
      clave_cliente: "x",
      estado: "pendiente",
    },
    saved = {
      id: "9007199254740994",
      clave_cliente: "x",
      estado: "completada",
    },
    older = {
      id: "9007199254740993",
      clave_cliente: "y",
      estado: "completada",
    };
  assert.deepEqual(mergeNoriTurns([optimistic], [saved]), [saved]);
  assert.deepEqual(mergeNoriTurns([saved], [older, saved]), [older, saved]);
});
test("Nori: actualización conserva historial anterior y no pierde un envío pendiente", () => {
  const old = { id: "1", clave_cliente: "old" },
    recent = { id: "2", clave_cliente: "recent" },
    pending = {
      id: "pendiente-z",
      clave_cliente: "z",
      fecha: "2026-11-27T00:00:00Z",
    };
  assert.deepEqual(mergeNoriTurns([old, recent, pending], [recent]), [
    old,
    recent,
    pending,
  ]);
});
