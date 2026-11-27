const { Router } = require("express"),
  { z } = require("zod");
const { validate } = require("../schemas/identity");
const { IdentityError } = require("../services/identity.service");
module.exports = ({ models, auth, protection, limiter }) => {
  const r = Router(),
    s = require("../services/platform.service").createPlatformService(models),
    change = [protection.protect, auth],
    motivo = z.string().trim().min(10).max(4000),
    functions = z
      .array(z.enum(["administrador_plataforma", "moderador"]))
      .min(1)
      .max(2)
      .refine((a) => new Set(a).size === a.length);
  const id = (req, res, next) => {
    if (!/^[1-9]\d{0,17}$/.test(req.params.id))
      throw new IdentityError(404, "NOT_FOUND", "No encontramos esta cuenta.");
    next();
  };
  r.get("/administracion/cuentas", auth, async (req, res) =>
    res.json(await s.users(req.auth)),
  );
  r.post(
    "/administracion/cuentas",
    ...change,
    limiter(10),
    validate(
      z
        .object({
          nombre: z.string().trim().min(1).max(120),
          correo: z.string().trim().toLowerCase().email().max(254),
          password: z
            .string()
            .min(12)
            .max(72)
            .refine((v) => Buffer.byteLength(v, "utf8") <= 72),
          funciones: functions,
          motivo,
        })
        .strict(),
    ),
    async (req, res) =>
      res
        .status(201)
        .json(await s.create(req.auth, req.validated, req.requestId)),
  );
  r.put(
    "/administracion/cuentas/:id",
    ...change,
    id,
    validate(
      z
        .object({
          funciones: functions,
          estado: z.enum(["activo", "inactivo"]),
          motivo,
        })
        .strict(),
    ),
    async (req, res) =>
      res.json(
        await s.update(req.auth, req.params.id, req.validated, req.requestId),
      ),
  );
  r.get("/administracion/politicas", auth, async (req, res) =>
    res.json(await s.policies(req.auth)),
  );
  r.post(
    "/administracion/politicas",
    ...change,
    validate(
      z
        .object({
          tipo: z.enum(["terminos", "privacidad"]),
          version: z.string().trim().min(1).max(40),
          contenido: z.string().trim().min(20).max(12000),
          motivo,
        })
        .strict(),
    ),
    async (req, res) =>
      res
        .status(201)
        .json(await s.policy(req.auth, req.validated, req.requestId)),
  );
  r.get("/administracion/auditoria", auth, async (req, res) => {
    const page = Number(req.query.pagina || 1);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10000 ||
      Object.keys(req.query).some((k) => k !== "pagina")
    )
      throw new IdentityError(400, "INVALID_PAGE", "Revisá la página.");
    res.json(await s.log(req.auth, page));
  });
  return r;
};
