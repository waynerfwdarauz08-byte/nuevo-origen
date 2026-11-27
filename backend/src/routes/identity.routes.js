const { Router } = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { createHash } = require("node:crypto");
const { createIdentityService } = require("../services/identity.service");
const { csrf } = require("../middlewares/csrf");
const schemas = require("../schemas/identity");
module.exports = (models, config) => {
  const router = Router();
  const service = createIdentityService(models, config);
  const controller = require("../controllers/identity.controller")(
    service,
    config,
  );
  const protection = csrf(config);
  const denied = (req, res) =>
    res.status(429).json({
      error: {
        code: "TOO_MANY_ATTEMPTS",
        message:
          "Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.",
      },
      requestId: req.requestId,
    });
  const limiter = (limit, extra = {}) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: denied,
      ...extra,
    });
  const auth = async (req, res, next) => {
    req.auth = await service.authenticate(req.cookies[config.cookieName]);
    next();
  };
  const ipLimit = limiter(config.ipLimit);
  const loginLimit = limiter(config.loginLimit, {
    keyGenerator: (req) =>
      ipKeyGenerator(req.ip) +
      ":" +
      createHash("sha256")
        .update(
          typeof req.body?.correo === "string"
            ? req.body.correo.trim().toLowerCase().slice(0, 254)
            : "invalid",
        )
        .digest("hex"),
  });
  router.get("/auth/csrf", protection.issue);
  router.get("/politicas", controller.policies);
  router.post(
    "/auth/registro",
    protection.protect,
    limiter(config.registerLimit),
    schemas.validate(schemas.registro),
    controller.register,
  );
  router.post(
    "/auth/login",
    protection.protect,
    ipLimit,
    loginLimit,
    schemas.validate(schemas.login),
    controller.login,
  );
  router.get("/auth/sesion", auth, controller.session);
  router.post("/auth/logout", protection.protect, auth, controller.logout);
  router.get("/mi-cuenta", auth, controller.account);
  router.patch(
    "/mi-cuenta",
    protection.protect,
    auth,
    schemas.validate(schemas.perfil),
    controller.updateAccount,
  );
  router.get("/mi-empresa", auth, controller.company);
  router.patch(
    "/mi-empresa",
    protection.protect,
    auth,
    schemas.validate(schemas.perfilEmpresa),
    controller.updateCompany,
  );
  router.get("/empresas/:id", auth, controller.company);
  router.patch(
    "/empresas/:id",
    protection.protect,
    auth,
    schemas.validate(schemas.perfilEmpresa),
    controller.updateCompany,
  );
  router.use(
    require("./team.routes")({
      models,
      config,
      identity: service,
      auth,
      protection,
      limiter,
    }),
  );
  router.use(
    require("./materials.routes")({
      models,
      identity: service,
      auth,
      protection,
      limiter,
    }),
  );
  router.use(
    require("./operations.routes")({ models, auth, protection, limiter }),
  );
  router.use(
    require("./messaging.routes")({ models, auth, protection, limiter }),
  );
  router.use(
    require("./incidents.routes")({ models, auth, protection, limiter }),
  );
  router.use(
    require("./rights.routes")({ models, config, auth, protection, limiter }),
  );
  router.use(
    require("./platform.routes")({ models, auth, protection, limiter }),
  );
  return router;
};
