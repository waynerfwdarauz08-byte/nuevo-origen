const { z } = require("zod");
const id = z.string().regex(/^[1-9]\d{0,17}$/);
const context = require("./agents")
  .execution.omit({ pregunta: true, clave_cliente: true })
  .refine((v) => v.agente !== "AG-01" || Object.keys(v).length === 1);
module.exports = {
  id,
  context,
  create: z.object({ clave_cliente: z.uuid(), contexto: context }).strict(),
  message: z
    .object({
      clave_cliente: z.uuid(),
      pregunta: z.string().trim().min(1).max(2000),
    })
    .strict(),
  page: z.object({ antes: id.optional() }).strict(),
};
