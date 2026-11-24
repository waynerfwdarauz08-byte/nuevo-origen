"use strict";
// Catálogo inicial basado en las matrices 4.4/4.5 y agentes de la sección 10.
// Persistir capacidades no implementa todavía su autorización en operaciones.
const empresa = [
  "perfil.leer",
  "perfil.gestionar",
  "equipo.gestionar",
  "materiales.leer",
  "materiales.gestionar",
  "acuerdos.gestionar",
  "documentos.gestionar_acceso",
  "documentos.cargar_fichas",
  "documentos.leer_autorizados",
  "drive.configurar",
  "indicadores.operativos",
  "reportes.exportar",
  "empresa.baja",
  "ag01.usar",
  "ag02.usar",
  "ag03.usar",
  "ag04.usar",
  "ag05.usar",
  "ag06.usar",
  "ag07.empresa",
  "ag08.borrador",
];
const roles = [
  ["administrador_empresa", "Administrador de empresa", "empresa", empresa],
  [
    "gestor_materiales",
    "Gestor de materiales",
    "empresa",
    [
      "perfil.leer",
      "materiales.leer",
      "materiales.gestionar",
      "documentos.cargar_fichas",
      "indicadores.operativos",
      "ag01.usar",
      "ag02.usar",
      "ag03.usar",
      "ag04.usar",
      "ag05.usar",
      "ag08.borrador",
    ],
  ],
  [
    "gestor_acuerdos",
    "Gestor de acuerdos",
    "empresa",
    [
      "perfil.leer",
      "materiales.leer",
      "acuerdos.gestionar",
      "documentos.leer_autorizados",
      "indicadores.operativos",
      "ag01.usar",
      "ag03.usar",
      "ag05.usar",
      "ag06.usar",
    ],
  ],
  [
    "analista_impacto",
    "Analista de impacto",
    "empresa",
    [
      "perfil.leer",
      "materiales.leer",
      "documentos.leer_autorizados",
      "reportes.exportar",
      "ag01.usar",
      "ag05.usar",
      "ag07.empresa",
    ],
  ],
  [
    "administrador_plataforma",
    "Administrador de plataforma",
    "plataforma",
    [
      "plataforma.configurar",
      "categorias.gestionar",
      "roles_globales.gestionar",
      "politicas.gestionar",
      "incidencias.supervisar",
      "privados.acceso_excepcional",
      "derechos.procesar",
      "auditoria.consultar",
      "ag01.usar",
      "ag05.usar",
      "ag07.global",
      "ag08.caso",
    ],
  ],
  [
    "moderador",
    "Moderador",
    "plataforma",
    [
      "reglas.consultar",
      "incidencias.resolver_caso",
      "privados.evidencia_caso",
      "derechos.escalar",
      "auditoria.casos_propios",
      "ag01.usar",
      "ag05.usar",
      "ag08.caso",
    ],
  ],
];
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      const codes = [...new Set(roles.flatMap((r) => r[3]))];
      await q.bulkInsert(
        "roles",
        roles.map(([codigo, nombre, alcance]) => ({ codigo, nombre, alcance })),
        { transaction },
      );
      await q.bulkInsert(
        "permisos",
        codes.map((codigo) => ({
          codigo,
          descripcion: `Capacidad ${codigo}; sujeta a empresa, recurso y autorización vigente.`,
        })),
        { transaction },
      );
      const [rs] = await q.sequelize.query("SELECT id, codigo FROM roles", {
        transaction,
      });
      const [ps] = await q.sequelize.query("SELECT id, codigo FROM permisos", {
        transaction,
      });
      const pairs = roles.flatMap(([code, , , permissions]) =>
        permissions.map((p) => ({
          rol_id: rs.find((r) => r.codigo === code).id,
          permiso_id: ps.find((r) => r.codigo === p).id,
        })),
      );
      await q.bulkInsert("rol_permiso", pairs, { transaction });
    });
  },
  async down(q) {
    // Solo se permite revertir en bases locales desechables, antes de asignar usuarios.
    await q.sequelize.transaction(async (transaction) => {
      const codes = roles.map((r) => r[0]);
      const { Op } = require("sequelize");
      const [rows] = await q.sequelize.query("SELECT id, codigo FROM roles", {
        transaction,
      });
      const ids = rows.filter((r) => codes.includes(r.codigo)).map((r) => r.id);
      if (ids.length)
        await q.bulkDelete(
          "rol_permiso",
          { rol_id: { [Op.in]: ids } },
          { transaction },
        );
      await q.bulkDelete(
        "roles",
        { codigo: { [Op.in]: codes } },
        { transaction },
      );
      await q.bulkDelete(
        "permisos",
        { codigo: { [Op.in]: [...new Set(roles.flatMap((r) => r[3]))] } },
        { transaction },
      );
    });
  },
};
