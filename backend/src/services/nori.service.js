const { Op, Transaction } = require("sequelize");
const { IdentityError } = require("./identity.service");
const { createAgentsService, contextHash } = require("./agents.service");
const { createTools, has } = require("./agents/tools");
const fail = (status, code, message) => {
  throw new IdentityError(status, code, message);
};
function createNoriService(m, { provider } = {}) {
  const agents = createAgentsService(m, { provider }),
    tools = createTools(m);
  const owner = (auth) => ({
    usuario_id: auth.user.id,
    empresa_id: auth.company?.id || null,
  });
  const dto = (row) => ({
    id: String(row.id),
    contexto: row.contexto_json,
    creada_en: row.creada_en,
    actualizada_en: row.actualizada_en,
  });
  const executionInput = (c, t) => ({
    ...c.contexto_json,
    pregunta: t.pregunta,
    clave_cliente: t.clave_cliente,
  });
  async function access(auth, id) {
    const c = await m.ConversacionIA.findOne({ where: { id, ...owner(auth) } });
    if (!c) fail(404, "NOT_FOUND", "No encontramos esta conversación.");
    const prepared = await tools.prepare(auth, {
      ...c.contexto_json,
      pregunta: "Conversación con Nori",
    });
    if (contextHash(prepared.sources) !== c.contexto_hash)
      fail(
        409,
        "AI_CONTEXT_CHANGED",
        "La información o tus permisos cambiaron. Iniciá un nuevo chat para consultar los datos actuales.",
      );
    return c;
  }
  async function reconcile(c, t) {
    let e = t.ejecucion_id
      ? await m.EjecucionIA.findByPk(t.ejecucion_id)
      : await m.EjecucionIA.findOne({
          where: { usuario_id: t.usuario_id, clave_cliente: t.clave_cliente },
        });
    if (e) {
      const { clave_cliente, ...input } = executionInput(c, t);
      if (
        String(e.usuario_id) !== String(t.usuario_id) ||
        e.entrada_hash !== contextHash(input) ||
        e.contexto_hash !== c.contexto_hash ||
        !e.version_prompt.endsWith("+nori-1")
      )
        e = null;
      if (e && (!t.ejecucion_id || t.estado !== e.estado))
        await t.update({ ejecucion_id: e.id, estado: e.estado });
    }
    return e;
  }
  function turnDto(t, e) {
    const stale =
      (!e || e.estado === "pendiente") &&
      t.estado === "pendiente" &&
      Date.now() - new Date(t.fecha).getTime() > 120000;
    return {
      id: String(t.id),
      clave_cliente: t.clave_cliente,
      pregunta: t.pregunta,
      fecha: t.fecha,
      estado: stale ? "interrumpida" : e?.estado || t.estado,
      respuesta: e?.estado === "completada" ? e.respuesta_json : null,
      error_codigo:
        e?.error_codigo || t.error_codigo || (stale ? "AI_INTERRUPTED" : null),
      reintentar_en:
        e?.estado === "fallida"
          ? e.respuesta_json?.reintentar_en || null
          : null,
    };
  }
  return {
    async list(auth, before) {
      const rows = await m.ConversacionIA.findAll({
        where: {
          ...owner(auth),
          ...(before ? { id: { [Op.lt]: before } } : {}),
        },
        order: [["id", "DESC"]],
        limit: 21,
      });
      return {
        conversaciones: rows
          .slice(0, 20)
          .filter((c) => has(auth, c.contexto_json.agente))
          .map(dto),
        siguiente: rows.length > 20 ? String(rows[19].id) : null,
      };
    },
    async create(auth, data) {
      const prepared = await tools.prepare(auth, {
        ...data.contexto,
        pregunta: "Conversación con Nori",
      });
      return m.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
        async (transaction) => {
          const user = await m.Usuario.findOne({
            where: { id: auth.user.id, estado: "activo" },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!user)
            fail(401, "SESSION_REQUIRED", "Tu sesión ya no está disponible.");
          const prior = await m.ConversacionIA.findOne({
            where: {
              usuario_id: auth.user.id,
              clave_cliente: data.clave_cliente,
            },
            transaction,
          });
          if (prior) {
            if (contextHash(prior.contexto_json) !== contextHash(data.contexto))
              fail(409, "AI_KEY_CONFLICT", "La clave corresponde a otro chat.");
            return dto(prior);
          }
          const c = await m.ConversacionIA.create(
            {
              ...owner(auth),
              clave_cliente: data.clave_cliente,
              contexto_json: data.contexto,
              contexto_hash: contextHash(prepared.sources),
              creada_en: new Date(),
              actualizada_en: new Date(),
            },
            { transaction },
          );
          await m.Auditoria.create(
            {
              actor_id: auth.user.id,
              empresa_id: auth.company?.id || null,
              accion: "ia.chat_creado",
              recurso_tipo: "conversacion_ia",
              recurso_id: c.id,
              request_id: data.clave_cliente,
              fecha: new Date(),
              motivo: "Conversación privada solicitada por su titular",
              detalle: { agente: data.contexto.agente },
            },
            { transaction },
          );
          return dto(c);
        },
      );
    },
    async detail(auth, id, before) {
      const c = await access(auth, id),
        rows = await m.TurnoIA.findAll({
          where: {
            conversacion_id: id,
            ...(before ? { id: { [Op.lt]: before } } : {}),
          },
          order: [["id", "DESC"]],
          limit: 21,
        });
      const turns = [];
      for (const row of rows.slice(0, 20).reverse())
        turns.push(turnDto(row, await reconcile(c, row)));
      return {
        conversacion: dto(c),
        turnos: turns,
        anterior: rows.length > 20 ? String(rows[19].id) : null,
      };
    },
    async send(auth, id, data, refresh = async () => auth) {
      const c = await access(auth, id);
      const turn = await m.sequelize.transaction(async (transaction) => {
        await m.ConversacionIA.findByPk(c.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const prior = await m.TurnoIA.findOne({
          where: {
            usuario_id: auth.user.id,
            clave_cliente: data.clave_cliente,
          },
          transaction,
        });
        if (prior) {
          if (
            String(prior.conversacion_id) !== String(c.id) ||
            prior.pregunta !== data.pregunta
          )
            fail(
              409,
              "AI_KEY_CONFLICT",
              "La clave de reintento corresponde a otro mensaje.",
            );
          return { row: prior, existing: true };
        }
        if (
          await m.EjecucionIA.count({
            where: {
              usuario_id: auth.user.id,
              clave_cliente: data.clave_cliente,
            },
            transaction,
          })
        )
          fail(
            409,
            "AI_KEY_CONFLICT",
            "La clave pertenece a una consulta anterior.",
          );
        if (
          await m.TurnoIA.count({
            where: {
              conversacion_id: c.id,
              estado: "pendiente",
              fecha: { [Op.gte]: new Date(Date.now() - 60000) },
            },
            transaction,
          })
        )
          fail(409, "AI_BUSY", "Esperá a que termine el mensaje en curso.");
        const row = await m.TurnoIA.create(
          {
            conversacion_id: c.id,
            usuario_id: auth.user.id,
            clave_cliente: data.clave_cliente,
            pregunta: data.pregunta,
            estado: "pendiente",
            fecha: new Date(),
          },
          { transaction },
        );
        await c.update({ actualizada_en: new Date() }, { transaction });
        return { row, existing: false };
      });
      if (turn.existing) {
        const e = await reconcile(c, turn.row);
        await access(await refresh(), id);
        return { turno: turnDto(turn.row, e), reutilizado: true };
      }
      try {
        const previous = await m.TurnoIA.findAll({
          where: {
            conversacion_id: c.id,
            id: { [Op.lt]: turn.row.id },
            estado: "completada",
          },
          order: [["id", "DESC"]],
          limit: 2,
        });
        const conversation = [];
        for (const t of previous.reverse()) {
          const e = await reconcile(c, t);
          if (e?.estado === "completada")
            conversation.push({
              usuario: t.pregunta.slice(0, 1000),
              nori: e.respuesta_json.respuesta.slice(0, 3000),
            });
        }
        while (Buffer.byteLength(JSON.stringify(conversation)) > 12000)
          conversation.shift();
        const fresh = await refresh();
        await access(fresh, id);
        const result = await agents.execute(
          fresh,
          executionInput(c, turn.row),
          refresh,
          { conversation, chat: true },
        );
        await turn.row.update({
          estado: "completada",
          ejecucion_id: result.ejecucion.id,
        });
        await access(await refresh(), id);
        return {
          turno: turnDto(turn.row, {
            estado: "completada",
            respuesta_json: result,
          }),
          reutilizado: false,
        };
      } catch (error) {
        const e = await reconcile(c, turn.row);
        await turn.row.update({
          estado: e?.estado === "completada" ? "completada" : "fallida",
          error_codigo:
            error instanceof IdentityError ? error.code : "AI_UNAVAILABLE",
        });
        throw error;
      }
    },
  };
}
module.exports = { createNoriService };
