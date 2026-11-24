const { z } = require("zod");
const text = (max, min = 1) => z.string().trim().min(min).max(max);
const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(12)
  .max(72)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72);
const empresa = z
  .object({
    nombre: text(150),
    sector: text(80),
    descripcion: text(4000, 0).optional(),
    correo_contacto: email,
    telefono: text(30, 0).optional(),
    ubicacion_publica: text(160),
    direccion_privada: text(4000, 0).optional(),
  })
  .strict();
const policy = z
  .object({
    tipo: z.enum(["terminos", "privacidad"]),
    version: text(40),
    aceptada: z.literal(true),
  })
  .strict();
const registro = z
  .object({
    empresa,
    usuario: z.object({ nombre: text(120), correo: email, password }).strict(),
    aceptaciones: z.array(policy).length(2),
    comunicaciones_opcionales: z.boolean().default(false),
  })
  .strict();
const login = z
  .object({
    correo: email,
    password: z
      .string()
      .min(1)
      .max(72)
      .refine((v) => Buffer.byteLength(v, "utf8") <= 72),
  })
  .strict();
const perfil = z.object({ nombre: text(120) }).strict();
const perfilEmpresa = empresa
  .partial()
  .refine((v) => Object.keys(v).length > 0);
function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          error: {
            code: "INVALID_INPUT",
            message:
              "Revisá los campos obligatorios, su formato y los campos permitidos.",
          },
          requestId: req.requestId,
        });
    req.validated = parsed.data;
    next();
  };
}
module.exports = { registro, login, perfil, perfilEmpresa, validate };
