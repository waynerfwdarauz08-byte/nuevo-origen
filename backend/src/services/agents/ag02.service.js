const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
module.exports = async (m, { materials, operations, source }, auth, input) => {
  let sources = [],
    extra = {};

  if (!input.oferta_id)
    fail(400, "AI_CONTEXT_REQUIRED", "Seleccioná una oferta propia.");
  const o = await materials.get(auth, "oferta", input.oferta_id),
    meta = await materials.metadata(auth);
  // No incluir fotos ni datos de contacto/direcciones empresariales.
  const { empresa, fotos, ...ficha } = o;
  sources = [
    source("oferta:" + o.id, o.titulo, "/mi-espacio/ofertas/" + o.id, ficha),
    source(
      "catalogos",
      "Categorías y propiedades",
      "/mi-espacio/ofertas",
      meta,
    ),
  ];

  return { sources, extra };
};
