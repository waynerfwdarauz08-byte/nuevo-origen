const { z } = require("zod");
const { registro } = require("./identity");
const codes = [
  "administrador_empresa",
  "gestor_materiales",
  "gestor_acuerdos",
  "analista_impacto",
];
const functions = (minimum) =>
  z
    .array(z.enum(codes))
    .min(minimum)
    .max(4)
    .refine((v) => new Set(v).size === v.length);
const reason = z.string().trim().min(3).max(500);
const token = z.string().regex(/^[a-f0-9]{64}$/);
const invitation = z
  .object({
    correo: z.string().trim().toLowerCase().email().max(254),
    funciones: functions(1),
  })
  .strict();
const change = z.object({ funciones: functions(0), motivo: reason }).strict();
const deactivate = z.object({ motivo: reason }).strict();
const inspect = z.object({ token }).strict();
const accept = z
  .object({
    token,
    nombre: registro.shape.usuario.shape.nombre,
    password: registro.shape.usuario.shape.password,
    aceptaciones: registro.shape.aceptaciones,
    comunicaciones_opcionales: registro.shape.comunicaciones_opcionales,
  })
  .strict();
module.exports = { invitation, change, deactivate, inspect, accept, codes };
