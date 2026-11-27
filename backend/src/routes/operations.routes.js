const { Router } = require("express"),
  multer = require("multer");
const { validate } = require("../schemas/identity");
const schemas = require("../schemas/operations");
const { id } = require("../schemas/materials");
const { IdentityError } = require("../services/identity.service");
module.exports = ({ models, auth, protection, limiter }) => {
  const router = Router(),
    s = require("../services/operations.service").createOperationsService(
      models,
    ),
    metrics = require("../services/metrics.service").createMetricsService(
      models,
    ),
    c = require("../controllers/operations.controller")(s, metrics);
  const ids = (req, res, next) => {
    for (const key of ["id", "fileId"])
      if (req.params[key] && !id.safeParse(req.params[key]).success)
        throw new IdentityError(
          404,
          "NOT_FOUND",
          "No encontramos este recurso.",
        );
    next();
  };
  const page = (req, res, next) => {
    const p = schemas.page.safeParse(req.query);
    if (!p.success)
      throw new IdentityError(400, "INVALID_PAGE", "Revisá la página.");
    req.page = p.data.pagina;
    next();
  };
  const period = (req, res, next) => {
    const p = schemas.period.safeParse(req.query);
    if (!p.success)
      throw new IdentityError(
        400,
        "INVALID_PERIOD",
        "Revisá fechas desde/hasta.",
      );
    req.period = p.data;
    next();
  };
  const change = [protection.protect, auth, ids];
  router.get("/solicitudes", auth, page, c.list);
  router.post(
    "/solicitudes",
    ...change,
    limiter(30),
    validate(schemas.request),
    c.create,
  );
  router.get("/solicitudes/:id", auth, ids, c.get);
  router.put(
    "/solicitudes/:id/condiciones",
    ...change,
    validate(schemas.proposal),
    c.revise,
  );
  router.post(
    "/solicitudes/:id/aceptar",
    ...change,
    validate(schemas.accept),
    c.accept,
  );
  router.post(
    "/solicitudes/:id/rechazar",
    ...change,
    validate(schemas.reason),
    c.close("rechazada"),
  );
  router.post(
    "/solicitudes/:id/cancelar",
    ...change,
    validate(schemas.reason),
    c.close("cancelada"),
  );
  router.get("/solicitudes/:id/mensajes", auth, ids, page, c.messages);
  router.post(
    "/solicitudes/:id/mensajes",
    ...change,
    limiter(60),
    validate(schemas.message),
    c.message,
  );
  router.get("/acuerdos/:id", auth, ids, c.agreement);
  router.post(
    "/acuerdos/:id/cancelar",
    ...change,
    validate(schemas.reason),
    c.cancel,
  );
  router.post(
    "/acuerdos/:id/entregas",
    ...change,
    validate(schemas.delivery),
    c.delivery,
  );
  router.post(
    "/entregas/:id/confirmaciones",
    ...change,
    validate(schemas.confirmation),
    c.confirm,
  );
  router.get("/entregas/:id/evidencias/:fileId", auth, ids, c.evidence);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  }).single("foto");
  router.post(
    "/entregas/:id/evidencias",
    protection.protectMultipart,
    auth,
    ids,
    limiter(30),
    async (req, res, next) => {
      const d = await models.Entrega.findByPk(req.params.id);
      if (!d)
        throw new IdentityError(
          404,
          "NOT_FOUND",
          "No encontramos este recurso.",
        );
      await s.agreementAccess(req.auth, d.acuerdo_id);
      next();
    },
    (req, res, next) =>
      upload(req, res, (e) =>
        next(
          e
            ? new IdentityError(
                e.code === "LIMIT_FILE_SIZE" ? 413 : 400,
                "INVALID_UPLOAD",
                "Subí una fotografía de hasta 5 MiB.",
              )
            : undefined,
        ),
      ),
    c.upload,
  );
  router.get("/indicadores", auth, period, c.indicators);
  router.get("/indicadores/exportacion", auth, period, c.export);
  router.get("/seguimiento/embudo", auth, c.funnel);
  router.get(
    "/seguimiento/atencion",
    auth,
    (req, res, next) => {
      const days = Number(req.query.dias || 3);
      if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > 365 ||
        Object.keys(req.query).some((k) => k !== "dias")
      )
        throw new IdentityError(
          400,
          "INVALID_DAYS",
          "Indicá entre 1 y 365 días.",
        );
      req.days = days;
      next();
    },
    c.attention,
  );
  router.get("/notificaciones", auth, page, c.notifications);
  router.post(
    "/notificaciones/:id/leida",
    ...change,
    validate(require("zod").z.object({}).strict()),
    c.readNotification,
  );
  return router;
};
