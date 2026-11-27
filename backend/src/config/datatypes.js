const { DataTypes } = require("sequelize");
const cache = new Map();
function portableTypes(types) {
  return new Proxy(types, {
    get(target, key) {
      const type = Reflect.get(target, key);
      if (
        !["BIGINT", "INTEGER", "SMALLINT", "TINYINT", "MEDIUMINT"].includes(key)
      )
        return type;
      if (!cache.has(type))
        cache.set(
          type,
          new Proxy(type, {
            get(t, p) {
              if (p === "UNSIGNED") return t;
              return Reflect.get(t, p);
            },
          }),
        );
      return cache.get(type);
    },
  });
}
module.exports = {
  portableTypes,
  dataTypes: (sequelize) =>
    sequelize.getDialect() === "postgres"
      ? portableTypes(DataTypes)
      : DataTypes,
};
