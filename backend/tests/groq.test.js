const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createGroq } = require("../src/services/agents/groq");
const input = {
  instruction: "Asiste con evidencia.",
  context: [],
  question: "¿Qué evidencia hay?",
  sourceIds: ["doc:1"],
};
const env = {
  GROQ_API_KEY: "clave-ficticia-pruebas",
  GROQ_ZDR_CONFIRMED: "true",
};
const reply = (value, finish = "stop") =>
  new Response(
    JSON.stringify({
      choices: [
        { finish_reason: finish, message: { content: JSON.stringify(value) } },
      ],
    }),
  );
test("Groq: bloquea falta de clave y contexto privado sin confirmación ZDR antes de llamar", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    throw Error("No debe llamar");
  };
  await assert.rejects(createGroq({ env: {}, fetchImpl }).generate(input), {
    code: "AI_NOT_CONFIGURED",
  });
  await assert.rejects(
    createGroq({ env: { GROQ_API_KEY: env.GROQ_API_KEY }, fetchImpl }).generate(
      input,
    ),
    { code: "AI_PRIVATE_DATA_BLOCKED" },
  );
  assert.equal(calls, 0);
});
test("Groq: envío limitado al proveedor autorizado, esquema estricto y sin herramientas", async () => {
  const client = createGroq({
    env,
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(options.redirect, "error");
      const body = JSON.parse(options.body);
      assert.equal(body.model, "openai/gpt-oss-120b");
      assert.equal(body.tools, undefined);
      assert.equal(body.response_format.json_schema.strict, true);
      return reply({
        respuesta: "Falta evidencia.",
        fuentes: ["doc:1"],
        limitaciones: ["Revisión humana necesaria."],
      });
    },
  });
  assert.deepEqual((await client.generate(input)).fuentes, ["doc:1"]);
  assert.equal(client.status().conexion_verificada, false);
  assert.ok(!JSON.stringify(client.status()).includes(env.GROQ_API_KEY));
});
test("Groq: rechaza fuentes inventadas, campos de acción y respuestas truncadas", async () => {
  for (const [value, finish, code] of [
    [
      { respuesta: "Dato.", fuentes: ["otra-empresa"], limitaciones: [] },
      "stop",
      "AI_RESPONSE_INVALID",
    ],
    [
      {
        respuesta: "Dato.",
        fuentes: [],
        limitaciones: [],
        ejecutar: "publicar",
      },
      "stop",
      "AI_RESPONSE_INVALID",
    ],
    [
      { respuesta: "Dato.", fuentes: [], limitaciones: [] },
      "length",
      "AI_RESPONSE_INCOMPLETE",
    ],
  ])
    await assert.rejects(
      createGroq({ env, fetchImpl: async () => reply(value, finish) }).generate(
        input,
      ),
      { code },
    );
});
test("Groq: errores del proveedor no exponen su contenido ni secretos", async () => {
  for (const status of [429, 500])
    await assert.rejects(
      createGroq({
        env,
        fetchImpl: async () => new Response("secreto-ficticio", { status }),
      }).generate(input),
      (error) => {
        assert.equal(
          error.code,
          status === 429 ? "AI_RATE_LIMITED" : "AI_PROVIDER_UNAVAILABLE",
        );
        assert.ok(!String(error).includes("secreto-ficticio"));
        return true;
      },
    );
});

test("Groq: credenciales rechazadas devuelven un código seguro", async () => {
  for (const status of [401, 403])
    await assert.rejects(
      createGroq({
        env,
        fetchImpl: async () => new Response("detalle-privado", { status }),
      }).generate(input),
      { code: "AI_AUTH_FAILED" },
    );
});

test("configuración Groq conserva variables ajenas y elimina duplicados propios", () => {
  const { updateEnv } = require("../scripts/configure-groq");
  const dotenv = require("dotenv");
  const content =
    '# Configuración ficticia\r\nDB_PASSWORD="dato ficticio"\r\nGROQ_API_KEY=anterior\r\nexport GROQ_API_KEY=duplicada\r\nJWT_SECRET=valor-ficticio\r\n';
  const result = updateEnv(content, {
    GROQ_API_KEY: "gsk_valor_ficticio",
    GROQ_MODEL: "openai/gpt-oss-120b",
    GROQ_ZDR_CONFIRMED: "false",
  });
  const parsed = dotenv.parse(result);
  assert.equal(parsed.DB_PASSWORD, "dato ficticio");
  assert.equal(parsed.JWT_SECRET, "valor-ficticio");
  assert.equal(parsed.GROQ_API_KEY, "gsk_valor_ficticio");
  assert.equal(parsed.GROQ_ZDR_CONFIRMED, "false");
  assert.equal((result.match(/^GROQ_API_KEY=/gm) || []).length, 1);
  assert.ok(!result.includes("anterior") && !result.includes("duplicada"));
});
