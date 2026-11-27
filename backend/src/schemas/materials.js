const { z } = require("zod");
const id = z
  .string()
  .regex(/^[1-9]\d{0,19}$/)
  .refine(
    (v) => /^[1-9]\d{0,19}$/.test(v) && BigInt(v) <= 18446744073709551615n,
  );
const text = (max) => z.string().trim().min(1).max(max);
function decimal(scale, whole, positive = false) {
  return z
    .string()
    .regex(new RegExp(`^(0|[1-9]\\d{0,${whole - 1}})(\\.\\d{1,${scale}})?$`))
    .refine((v) => !positive || /[1-9]/.test(v));
}
const qty = decimal(3, 11, true),
  number = z.string().regex(/^-?(0|[1-9]\d{0,9})(\.\d{1,4})?$/),
  price = decimal(2, 12);
const category = z
  .object({
    nombre: text(80),
    descripcion: z.string().trim().max(4000).default(""),
    activo: z.boolean().default(true),
  })
  .strict();
const unit = z
  .object({
    codigo: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9²³_-]{1,15}$/),
    nombre: text(60),
    magnitud: z.enum(["masa", "longitud", "area", "volumen", "piezas"]),
    activo: z.boolean().default(true),
  })
  .strict();
const property = z
  .object({
    nombre: text(60),
    tipo_dato: z.enum(["numero", "texto"]),
    unidad_id: id.nullable().default(null),
    activo: z.boolean().default(true),
  })
  .strict()
  .refine((v) => v.tipo_dato === "numero" || v.unidad_id === null);
const mappings = z
  .object({
    propiedades: z
      .array(z.object({ propiedad_id: id, requerida: z.boolean() }).strict())
      .max(50),
  })
  .strict()
  .refine(
    (v) =>
      new Set(v.propiedades.map((p) => p.propiedad_id)).size ===
      v.propiedades.length,
  );
const offerValue = z
  .object({
    propiedad_id: id,
    valor_texto: text(255).optional(),
    valor_numero: number.optional(),
  })
  .strict()
  .refine(
    (v) => (v.valor_texto !== undefined) !== (v.valor_numero !== undefined),
  );
const needValue = z
  .object({
    propiedad_id: id,
    valor_texto: text(255).optional(),
    minimo: number.optional(),
    maximo: number.optional(),
  })
  .strict()
  .refine((v) =>
    v.valor_texto !== undefined
      ? v.minimo === undefined && v.maximo === undefined
      : v.minimo !== undefined || v.maximo !== undefined,
  );
const common = {
  categoria_id: id,
  unidad_id: id,
  titulo: text(160),
  ubicacion: text(160),
};
const offer = z
  .object({
    ...common,
    composicion: text(4000),
    estado_material: z.enum([
      "retazo",
      "sobrante",
      "usado_aprovechable",
      "nuevo_sin_uso",
    ]),
    cantidad_total: qty,
    modalidad: z.enum(["venta", "donacion", "intercambio"]),
    precio_unitario: price.nullable().default(null),
    moneda: z.enum(["CRC", "USD"]).nullable().default(null),
    frecuencia: z.enum(["puntual", "recurrente"]),
    declaracion_no_peligroso: z.boolean(),
    declaracion_aprovechable: z.boolean(),
    propiedades: z.array(offerValue).max(50).default([]),
  })
  .strict()
  .refine((v) =>
    v.modalidad === "venta"
      ? v.precio_unitario !== null && v.moneda !== null
      : v.precio_unitario === null && v.moneda === null,
  )
  .refine(
    (v) =>
      new Set(v.propiedades.map((p) => p.propiedad_id)).size ===
      v.propiedades.length,
  );
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return (
      Number(v.slice(0, 4)) >= 1000 &&
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === v
    );
  });
const need = z
  .object({
    ...common,
    descripcion: text(4000),
    cantidad: qty,
    fecha_objetivo: date.nullable().default(null),
    propiedades: z.array(needValue).max(50).default([]),
  })
  .strict()
  .refine(
    (v) =>
      new Set(v.propiedades.map((p) => p.propiedad_id)).size ===
      v.propiedades.length,
  );
const state = z
  .object({
    estado: z.enum(["publicada", "pausada", "archivada", "activa", "cerrada"]),
    motivo: text(500),
  })
  .strict();
const filters = z
  .object({
    q: z.string().trim().max(120).optional(),
    categoria_id: id.optional(),
    unidad_id: id.optional(),
    ubicacion: z.string().trim().max(160).optional(),
    modalidad: z.enum(["venta", "donacion", "intercambio"]).optional(),
    estado_material: offer.shape.estado_material.optional(),
    frecuencia: offer.shape.frecuencia.optional(),
    minimo: decimal(3, 11).optional(),
    pagina: z.coerce.number().int().min(1).max(10000).default(1),
    orden: z.enum(["reciente", "titulo"]).default("reciente"),
  })
  .strict()
  .refine((v) => v.minimo === undefined || v.unidad_id !== undefined);
module.exports = {
  id,
  category,
  unit,
  property,
  mappings,
  offer,
  need,
  state,
  filters,
};
