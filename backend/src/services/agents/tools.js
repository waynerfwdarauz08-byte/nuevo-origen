const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
const names = [
  "Orquestador",
  "Caracterización de materiales",
  "Compatibilidad",
  "Aprovechamiento",
  "Asistente documental RAG",
  "Seguimiento de acuerdos",
  "Analista de impacto",
  "Revisor de publicaciones",
];
const permissions = {
  "AG-01": ["ag01.usar"],
  "AG-02": ["ag02.usar"],
  "AG-03": ["ag03.usar"],
  "AG-04": ["ag04.usar"],
  "AG-05": ["ag05.usar"],
  "AG-06": ["ag06.usar"],
  "AG-07": ["ag07.empresa", "ag07.global"],
  "AG-08": ["ag08.borrador", "ag08.caso"],
};
const has = (auth, code) =>
  permissions[code]?.some((p) => auth.permissions.includes(p));
const catalog = (auth) =>
  Object.keys(permissions)
    .filter((code) => has(auth, code))
    .map((codigo) => ({
      codigo,
      nombre: names[Number(codigo.slice(-1)) - 1],
      disponible: !["AG-04", "AG-05"].includes(codigo),
      motivo: ["AG-04", "AG-05"].includes(codigo)
        ? "Pendiente de corpus autorizado e integración RAG."
        : null,
    }));
function createTools(m) {
  const materials = require("../materials.service").createMaterialsService(m),
    operations = require("../operations.service").createOperationsService(m);
  const source = (id, titulo, ruta, datos) => ({ id, titulo, ruta, datos });
  async function prepare(auth, input) {
    if (!has(auth, input.agente))
      fail(403, "AI_FORBIDDEN", "Tu función no permite usar este agente.");
    let selected = input.agente;
    if (selected === "AG-01") {
      selected = require("./ag01.service")(input);
      if (!has(auth, selected))
        fail(
          403,
          "AI_FORBIDDEN",
          "Tu función no permite consultar el contexto solicitado.",
        );
    }
    if (["AG-04", "AG-05"].includes(selected))
      fail(
        503,
        "AI_CORPUS_PENDING",
        "Este agente necesita documentos autorizados y RAG; todavía no están conectados.",
      );
    const permittedFields = {
      "AG-01": [],
      "AG-02": ["oferta_id"],
      "AG-03": ["necesidad_id"],
      "AG-06": ["solicitud_id"],
      "AG-07": ["desde", "hasta"],
      "AG-08": ["oferta_id", "caso_id"],
    }[selected];
    for (const field of [
      "oferta_id",
      "necesidad_id",
      "solicitud_id",
      "caso_id",
      "desde",
      "hasta",
    ])
      if (input[field] && !permittedFields.includes(field))
        fail(
          400,
          "AI_CONTEXT_INVALID",
          "Combinación de campos no permitida para este agente.",
        );
    let sources = [],
      extra = {};
    if (selected === "AG-01")
      sources = [
        source(
          "capacidades",
          "Capacidades de tu sesión",
          "/mi-espacio/ia",
          catalog(auth),
        ),
      ];
    if (selected === "AG-02") {
      ({ sources, extra } = await require("./ag02.service")(
        m,
        { materials, operations, source },
        auth,
        input,
      ));
    }
    if (selected === "AG-03") {
      ({ sources, extra } = await require("./ag03.service")(
        m,
        { materials, operations, source },
        auth,
        input,
      ));
    }
    if (selected === "AG-06") {
      ({ sources, extra } = await require("./ag06.service")(
        m,
        { materials, operations, source },
        auth,
        input,
      ));
    }
    if (selected === "AG-07") {
      ({ sources, extra } = await require("./ag07.service")(
        m,
        { materials, operations, source },
        auth,
        input,
      ));
    }
    if (selected === "AG-08") {
      ({ sources, extra } = await require("./ag08.service")(
        m,
        { materials, operations, source },
        auth,
        input,
      ));
    }
    return { selected, sources, extra };
  }
  return { prepare };
}
module.exports = { createTools, catalog, has };
