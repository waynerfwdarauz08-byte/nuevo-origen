module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.bulkInsert(
        "categorias",
        [
          "Madera",
          "Textiles",
          "Papel y cartón",
          "Plásticos",
          "Metales",
          "Vidrio",
          "Caucho",
          "Otros materiales",
        ].map((nombre) => ({
          nombre,
          descripcion:
            "Categoría inicial de materiales aprovechables no peligrosos.",
          activo: true,
        })),
        { transaction },
      );
      const units = [
        ["kg", "Kilogramo", "masa"],
        ["g", "Gramo", "masa"],
        ["t", "Tonelada", "masa"],
        ["unidad", "Unidad", "piezas"],
        ["m", "Metro", "longitud"],
        ["cm", "Centímetro", "longitud"],
        ["mm", "Milímetro", "longitud"],
        ["m2", "Metro cuadrado", "area"],
        ["m3", "Metro cúbico", "volumen"],
        ["L", "Litro", "volumen"],
      ];
      await q.bulkInsert(
        "unidades",
        units.map(([codigo, nombre, magnitud]) => ({
          codigo,
          nombre,
          magnitud,
          activo: true,
        })),
        { transaction },
      );
      const [rows] = await q.sequelize.query(
        "SELECT id FROM unidades WHERE codigo = :codigo",
        { replacements: { codigo: "mm" }, transaction },
      );
      await q.bulkInsert(
        "propiedades",
        ["Longitud", "Ancho", "Espesor"].map((nombre) => ({
          nombre,
          tipo_dato: "numero",
          unidad_id: rows[0].id,
          activo: true,
        })),
        { transaction },
      );
      const [categories] = await q.sequelize.query(
        "SELECT id FROM categorias",
        { transaction },
      );
      const [props] = await q.sequelize.query(
        "SELECT id FROM propiedades WHERE nombre IN (:nombres)",
        {
          replacements: { nombres: ["Longitud", "Ancho", "Espesor"] },
          transaction,
        },
      );
      await q.bulkInsert(
        "categoria_propiedad",
        categories.flatMap((c) =>
          props.map((p) => ({
            categoria_id: c.id,
            propiedad_id: p.id,
            requerida: false,
          })),
        ),
        { transaction },
      );
    });
  },
  async down() {
    throw new Error(
      "Los catálogos referenciados no se retiran automáticamente. Desactivarlos con autorización.",
    );
  },
};
