const { z } = require("zod");
const { id } = require("./materials");
const text = (max) => z.string().trim().min(1).max(max);
const qty = z
  .string()
  .regex(/^(0|[1-9]\d{0,10})(\.\d{1,3})?$/)
  .refine((v) => /[1-9]/.test(v));
const factor = z
  .string()
  .regex(/^(0|[1-9]\d{0,7})(\.\d{1,6})?$/)
  .refine((v) => /[1-9]/.test(v));
const fields = {
  cantidad: qty,
  condiciones: text(4000),
  fecha_prevista: z.iso.datetime({ offset: true }).nullable().default(null),
  oferta_intercambio_id: id.nullable().default(null),
  cantidad_intercambio: qty.nullable().default(null),
  precio_unitario_acordado: z
    .string()
    .regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  moneda: z.enum(["CRC", "USD"]).nullable().optional(),
};
const request = z
  .object({
    oferta_id: id,
    necesidad_id: id.nullable().default(null),
    ...fields,
  })
  .strict();
const proposal = z
  .object({ version: z.number().int().min(1).max(2147483647), ...fields })
  .strict();
const accept = z
  .object({ version: z.number().int().min(1).max(2147483647) })
  .strict();
const message = z.object({ contenido: text(4000) }).strict();
const reason = z.object({ motivo: text(1000) }).strict();
const deliveryLine = z
  .object({
    acuerdo_linea_id: id,
    cantidad: qty,
    masa_kg: qty.nullable().default(null),
    metodo_masa: z.enum(["medido", "estimado"]).nullable().default(null),
    factor_kg: factor.nullable().default(null),
    fuente_factor: text(255).nullable().default(null),
  })
  .strict()
  .refine((v) =>
    v.metodo_masa === "medido"
      ? v.masa_kg !== null && v.factor_kg === null && v.fuente_factor === null
      : v.metodo_masa === "estimado"
        ? v.factor_kg !== null && v.fuente_factor !== null && v.masa_kg === null
        : v.masa_kg === null &&
          v.factor_kg === null &&
          v.fuente_factor === null,
  );
const delivery = z
  .object({
    clave_idempotencia: z.uuid(),
    fecha: z.iso.datetime({ offset: true }),
    lineas: z.array(deliveryLine).min(1).max(2),
  })
  .strict()
  .refine(
    (v) =>
      new Set(v.lineas.map((l) => l.acuerdo_linea_id)).size === v.lineas.length,
  );
const confirmation = z
  .object({
    tipo: z.enum(["recepcion", "aprovechamiento"]),
    conforme: z.boolean(),
    observacion: z.string().trim().max(4000).default(""),
  })
  .strict()
  .refine((v) => v.conforme || v.observacion.length > 0);
const page = z
  .object({ pagina: z.coerce.number().int().min(1).max(10000).default(1) })
  .strict();
const period = z
  .object({ desde: z.iso.date(), hasta: z.iso.date() })
  .strict()
  .refine((v) => v.desde <= v.hasta && Number(v.desde.slice(0, 4)) >= 1000);
module.exports = {
  request,
  proposal,
  accept,
  message,
  reason,
  delivery,
  confirmation,
  page,
  period,
};
