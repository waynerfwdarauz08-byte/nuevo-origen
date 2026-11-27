const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../schemas/identity");
const { id } = require("../schemas/materials");
module.exports = ({ models, auth, protection, limiter }) => {
  const router = Router(),
    s = require("../services/incidents.service").createIncidentsService(models);
  const parsed = (schema, value) => {
    const r = schema.safeParse(value);
    if (!r.success)
      throw new (require("../services/identity.service").IdentityError)(
        400,
        "INVALID_INPUT",
        "Revisá los datos enviados.",
      );
    return r.data;
  };
  const identifier = (req, res, next) => {
    req.params.id = parsed(id, req.params.id);
    next();
  };
  const report = z
    .object({
      oferta_id: id.optional(),
      acuerdo_id: id.optional(),
      motivo: z.string().trim().min(5).max(4000),
    })
    .strict()
    .refine((v) => Boolean(v.oferta_id) !== Boolean(v.acuerdo_id));
  router.post(
    "/incidencias",
    protection.protect,
    auth,
    limiter(15),
    validate(report),
    async (req, res) =>
      res.status(201).json(await s.report(req.auth, req.validated, req.requestId)),
  );
  router.get("/administracion/incidencias", auth, async (req, res) => {
    const p = parsed(
      z
        .object({
          pagina: z.coerce.number().int().min(1).max(10000).default(1),
        })
        .strict(),
      req.query,
    );
    res.json(await s.list(req.auth, p.pagina));
  });
  router.get(
    "/administracion/incidencias/:id",
    auth,
    identifier,
    async (req, res) =>
      res.json(await s.detail(req.auth, req.params.id, req.requestId)),
  );
  router.post(
    "/administracion/incidencias/:id/asignarme",
    protection.protect,
    auth,
    identifier,
    validate(z.object({}).strict()),
    async (req, res) =>
      res.json(await s.claim(req.auth, req.params.id, req.requestId)),
  );
  router.post(
    "/administracion/incidencias/:id/resolver",
    protection.protect,
    auth,
    identifier,
    validate(
      z
        .object({
          accion: z.enum([
            "retomar_entrega",
            "anular_entrega",
            "pausar_oferta",
            "sin_cambio",
          ]),
          motivo: z.string().trim().min(10).max(4000),
        })
        .strict(),
    ),
    async (req, res) =>
      res.json(
        await s.resolve(req.auth, req.params.id, req.validated, req.requestId),
      ),
  );
  router.get(
    "/administracion/incidencias/:id/evidencias/:fileId",
    auth,
    identifier,
    async (req, res) => {
      const file = await s.evidence(
        req.auth,
        req.params.id,
        parsed(id, req.params.fileId),
        req.requestId,
      );
      const path = require("../services/photo.service")
        .createPhotoService()
        .path(file);
      res.set("Cache-Control", "private, no-store");
      res.type(file.mime);
      res.sendFile(path, { dotfiles: "allow" });
    },
  );
  return router;
};
