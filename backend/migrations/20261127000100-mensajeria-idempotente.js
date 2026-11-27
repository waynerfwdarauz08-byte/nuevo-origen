"use strict";
module.exports = {
  async up(q, S) {
    await q.addColumn("mensajes", "clave_cliente", {
      type: S.STRING(36),
      allowNull: true,
    });
    await q.addIndex("mensajes", ["autor_id", "clave_cliente"], {
      unique: true,
      name: "mensajes_autor_clave_unica",
    });
    await q.addIndex("mensajes", ["solicitud_id", "id"], {
      name: "mensajes_conversacion_cursor",
    });
  },
  async down(q) {
    await q.removeIndex("mensajes", "mensajes_conversacion_cursor");
    await q.removeIndex("mensajes", "mensajes_autor_clave_unica");
    await q.removeColumn("mensajes", "clave_cliente");
  },
};
