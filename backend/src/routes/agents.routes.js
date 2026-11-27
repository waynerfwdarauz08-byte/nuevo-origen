const { Router } = require("express");
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
    s = require("../services/agents.service").createAgentsService(models, {
      provider,
    });
  r.get("/ia", auth, async (req, res) => res.json(await s.catalog(req.auth)));
  r.get("/ia/ejecuciones", auth, async (req, res) =>
    res.json(await s.history(req.auth)),
  );
  r.post(
    "/ia/ejecuciones",
    protection.protect,
    auth,
    limiter(100),
    require("../schemas/identity").validate(
      require("../schemas/agents").execution,
    ),
    async (req, res) => {
      const data = await s.execute(req.auth, req.validated, () =>
        identity.authenticate(req.cookies[config.cookieName]),
      );
      res.status(data.reutilizada ? 200 : 201).json(data);
    },
  );
  return r;
};
