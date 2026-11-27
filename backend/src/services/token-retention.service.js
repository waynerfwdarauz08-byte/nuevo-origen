const { Op } = require("sequelize");
const { randomUUID } = require("node:crypto");
async function retainTokens(m, { apply = false, now = new Date() } = {}) {
  if (!["development", "test"].includes(process.env.NODE_ENV || "development"))
    throw new Error("Limpieza local exclusivamente.");
  const cutoff = new Date(now.getTime() - 30 * 86400000);
  return m.sequelize.transaction(async (t) => {
    const rows = await m.TokenAccion.findAll({
      where: {
        updated_at: { [Op.lte]: cutoff },
        [Op.or]: [
          { vence_en: { [Op.lte]: cutoff } },
          { usado_en: { [Op.lte]: cutoff } },
          { revocado_en: { [Op.lte]: cutoff } },
        ],
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    let eligible = 0;
    for (const row of rows) {
      const invites = await m.Invitacion.findAll({
        where: { token_accion_id: row.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (invites.some((i) => new Date(i.updated_at) > cutoff)) continue;
      eligible++;
      if (apply) {
        for (const invite of invites) {
          await m.InvitacionRol.destroy({
            where: { invitacion_id: invite.id },
            transaction: t,
          });
          await invite.destroy({ transaction: t });
        }
        await row.destroy({ transaction: t });
      }
    }
    if (apply && eligible)
      await m.Auditoria.create(
        {
          actor_id: null,
          empresa_id: null,
          accion: "tokens.metadatos_purgados",
          request_id: randomUUID(),
          recurso_tipo: "mantenimiento",
          recurso_id: null,
          fecha: now,
          motivo: "Conservación local de metadatos terminales a 30 días",
          detalle: { cantidad: eligible, corte: cutoff.toISOString() },
        },
        { transaction: t },
      );
    return {
      modo: apply ? "aplicado" : "simulacion_sin_cambios",
      tokens_elegibles: eligible,
      tokens_eliminados: apply ? eligible : 0,
      corte: cutoff.toISOString(),
      auditoria_conservada: true,
    };
  });
}
module.exports = { retainTokens };
