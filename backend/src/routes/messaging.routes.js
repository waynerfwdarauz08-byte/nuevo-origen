const { Router } = require("express"),
  { z } = require("zod");
const { id } = require("../schemas/materials"),
  { validate } = require("../schemas/identity");
const { IdentityError } = require("../services/identity.service");
module.exports = ({ models, auth, protection, limiter }) => {
  const r = Router(),
    c = require("../controllers/messaging.controller")(
      require("../services/messaging.service").createMessagingService(models),
    );
  const query = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success)
      throw new IdentityError(
        400,
        "INVALID_QUERY",
        "Revisá los filtros de la conversación.",
      );
    req.queryValidated = result.data;
    next();
  };
  const identifier = (req, res, next) => {
    if (!id.safeParse(req.params.id).success)
      throw new IdentityError(
        404,
        "NOT_FOUND",
        "No encontramos esta conversación.",
      );
    next();
  };
  r.get(
    "/mensajeria/conversaciones",
    auth,
    query(
      z
        .object({
          pagina: z.coerce.number().int().min(1).max(10000).default(1),
        })
        .strict(),
    ),
    c.list,
  );
  r.get("/mensajeria/conversaciones/:id", auth, identifier, c.context);
  r.get(
    "/mensajeria/conversaciones/:id/mensajes",
    auth,
    identifier,
    query(
      z
        .object({ antes_de: id.optional(), despues_de: id.optional() })
        .strict()
        .refine((v) => !v.antes_de || !v.despues_de),
    ),
    c.messages,
  );
  r.post(
    "/mensajeria/conversaciones/:id/mensajes",
    protection.protect,
    auth,
    identifier,
    limiter(60),
    validate(
      z
        .object({
          contenido: z.string().trim().min(1).max(4000),
          clave_cliente: z.uuid(),
        })
        .strict(),
    ),
    c.send,
  );
  return r;
};
