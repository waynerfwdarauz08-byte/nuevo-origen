const { z } = require("zod");
const id = z.string().regex(/^[1-9]\d{0,17}$/);
const execution = z
  .object({
    agente: z.enum([
      "AG-01",
      "AG-02",
      "AG-03",
      "AG-04",
      "AG-05",
      "AG-06",
      "AG-07",
      "AG-08",
    ]),
    pregunta: z.string().trim().min(5).max(2000),
    clave_cliente: z.uuid(),
    oferta_id: id.optional(),
    necesidad_id: id.optional(),
    solicitud_id: id.optional(),
    caso_id: id.optional(),
    desde: z.string().optional(),
    hasta: z.string().optional(),
  })
  .strict();
module.exports = { execution };
