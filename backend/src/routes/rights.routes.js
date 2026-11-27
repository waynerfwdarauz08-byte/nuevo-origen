const { Router } = require("express"),
  { z } = require("zod");
const { validate } = require("../schemas/identity"),
  { id } = require("../schemas/materials");
module.exports = ({ models, config, auth, protection, limiter }) => {
  const r = Router(),
    s = require("../services/rights.service").createRightsService(
      models,
      config,
    ),
    change = [protection.protect, auth];
  const reason = z.string().trim().min(10).max(4000),
    password = z
      .string()
      .min(12)
      .max(72)
      .refine((v) => Buffer.byteLength(v, "utf8") <= 72);
  r.get("/mi-cuenta/consentimientos", auth, async (req, res) =>
    res.json(await s.preferences(req.auth)),
  );
  r.put(
    "/mi-cuenta/consentimientos",
    ...change,
    validate(z.object({ comunicaciones_opcionales: z.boolean() }).strict()),
    async (req, res) =>
      res.json(
        await s.consent(
          req.auth,
          req.validated.comunicaciones_opcionales,
          req.requestId,
        ),
      ),
  );
  r.post(
    "/mi-cuenta/exportacion",
    ...change,
    limiter(10),
    validate(z.object({ password: z.string().min(1).max(72) }).strict()),
    async (req, res) =>
      res
        .set("Content-Disposition", 'attachment; filename="mis-datos.json"')
        .json(await s.export(req.auth, req.validated.password, req.requestId)),
  );
  r.get("/mi-cuenta/derechos", auth, async (req, res) =>
    res.json(await s.own(req.auth)),
  );
  r.post(
    "/mi-cuenta/derechos",
    ...change,
    limiter(10),
    validate(
      z
        .object({
          password: z.string().min(1).max(72),
          tipo: z.enum([
            "acceso",
            "rectificacion",
            "eliminacion",
            "baja",
            "baja_empresa",
          ]),
          detalle: reason,
        })
        .strict(),
    ),
    async (req, res) =>
      res
        .status(201)
        .json(await s.request(req.auth, req.validated, req.requestId)),
  );
  r.get("/administracion/derechos", auth, async (req, res) =>
    res.json(await s.queue(req.auth)),
  );
  r.post(
    "/administracion/derechos/:id/revisar",
    ...change,
    validate(z.object({ motivo: reason }).strict()),
    async (req, res) => {
      if (!id.safeParse(req.params.id).success)
        throw new (require("../services/identity.service").IdentityError)(
          404,
          "NOT_FOUND",
          "No encontramos esta solicitud.",
        );
      res.json(
        await s.review(req.auth, req.params.id, req.validated, req.requestId),
      );
    },
  );
  r.post(
    "/auth/recuperacion",
    protection.protect,
    limiter(5),
    validate(
      z
        .object({ correo: z.string().trim().toLowerCase().email().max(254) })
        .strict(),
    ),
    async (req, res) =>
      res
        .status(202)
        .json({
          aviso:
            "No se envió correo. El canal de recuperación por correo está pendiente; en desarrollo, contactá a la administración de plataforma para verificar tu identidad.",
          correo_enviado: false,
        }),
  );
  r.post(
    "/administracion/recuperacion",
    ...change,
    limiter(10),
    validate(
      z
        .object({
          usuario_id: id,
          identidad_verificada: z.literal(true),
          motivo: reason,
        })
        .strict(),
    ),
    async (req, res) =>
      res
        .status(201)
        .json(await s.recovery(req.auth, req.validated, req.requestId)),
  );
  r.post(
    "/auth/restablecer",
    protection.protect,
    limiter(10),
    validate(
      z
        .object({ token: z.string().regex(/^[0-9a-f]{64}$/), password })
        .strict(),
    ),
    async (req, res) => res.json(await s.reset(req.validated, req.requestId)),
  );
  return r;
};
