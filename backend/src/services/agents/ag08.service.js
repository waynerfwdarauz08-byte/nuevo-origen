const { Op } = require("sequelize");
const { IdentityError } = require("../identity.service");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
module.exports = async (m, { materials, operations, source }, auth, input) => {
  let sources = [],
    extra = {};

  let o;
  if (input.caso_id) {
    if (
      auth.company ||
      !auth.permissions.includes("ag08.caso") ||
      input.oferta_id
    )
      fail(403, "AI_FORBIDDEN", "No podés revisar ese caso.");
    const c = await m.Incidencia.findOne({
      where: {
        id: input.caso_id,
        revisor_id: auth.user.id,
        estado: { [Op.notIn]: ["resuelta", "cerrada"] },
      },
    });
    if (!c || !c.oferta_id)
      fail(404, "NOT_FOUND", "No encontramos un caso de publicación asignado.");
    // Solo publicación pública. Evidencia privada exige otro flujo con motivo.
    o = await materials.publicGet(c.oferta_id);
  } else {
    if (
      !auth.company ||
      !auth.permissions.includes("ag08.borrador") ||
      !input.oferta_id
    )
      fail(
        400,
        "AI_CONTEXT_REQUIRED",
        "Seleccioná un borrador propio o un caso asignado.",
      );
    o = await materials.get(auth, "oferta", input.oferta_id);
    if (o.estado !== "borrador")
      fail(
        409,
        "AI_DRAFT_REQUIRED",
        "La revisión empresarial requiere una oferta en borrador.",
      );
  }
  const { empresa, fotos, ...ficha } = o;
  const findings = [];
  if (!o.composicion?.trim()) findings.push("composicion: falta descripción");
  if (!o.declaracion_no_peligroso)
    findings.push(
      "declaracion_no_peligroso: falta declaración; no equivale a certificación",
    );
  if (!o.declaracion_aprovechable)
    findings.push("declaracion_aprovechable: falta declaración");
  if (
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s-]?){8,}/i.test(
      o.composicion + " " + o.titulo,
    )
  )
    findings.push(
      "titulo/composicion: posible dato de contacto; revisar manualmente",
    );
  sources = [
    source(
      "oferta:" + o.id,
      o.titulo,
      input.caso_id ? "/mi-espacio/incidencias" : "/mi-espacio/ofertas/" + o.id,
      { ...ficha, hallazgos: findings },
    ),
  ];
  extra = { hallazgos: findings };

  return { sources, extra };
};
