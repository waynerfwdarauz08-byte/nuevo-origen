const { Router } = require("express");
const { IdentityError } = require("../services/identity.service");
const schemas = require("../schemas/nori"),
  { validate } = require("../schemas/identity");
module.exports = ({
  models,
  identity,
  config,
  auth,
  protection,
  limiter,
  provider,
}) => {
  const r = Router(),
    s = require("../services/nori.service").createNoriService(models, {
      provider,
    });
  const parse = (req, res, next) => {
    if (req.params.id && !schemas.id.safeParse(req.params.id).success)
      throw new IdentityError(
        404,
        "NOT_FOUND",
        "No encontramos esta conversación.",
      );
    const p = schemas.page.safeParse(req.query);
    if (!p.success)
      throw new IdentityError(400, "INVALID_PAGE", "Revisá la página.");
    req.cursor = p.data.antes;
    next();
  };
  r.get("/ia/conversaciones", auth, parse, async (req, res) =>
    res.json(await s.list(req.auth, req.cursor)),
  );
  r.post(
    "/ia/conversaciones",
    protection.protect,
    auth,
    limiter(60),
    validate(schemas.create),
    async (req, res) =>
      res.status(201).json(await s.create(req.auth, req.validated)),
  );
  r.get("/ia/conversaciones/:id", auth, parse, async (req, res) =>
    res.json(await s.detail(req.auth, req.params.id, req.cursor)),
  );
  r.post(
    "/ia/conversaciones/:id/mensajes",
    protection.protect,
    auth,
    parse,
    limiter(100),
    validate(schemas.message),
    async (req, res) => {
      const result = await s.send(req.auth, req.params.id, req.validated, () =>
        identity.authenticate(req.cookies[config.cookieName]),
      );
      res.status(result.reutilizado ? 200 : 201).json(result);
    },
  );
  return r;
};
