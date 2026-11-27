const { portableTypes } = require("./datatypes");
const quote = (sql) =>
  sql.replace(
    /`([^`]+)`/g,
    (_, name) => '"' + name.replaceAll('"', '""') + '"',
  );
function adapt(q, S, transaction) {
  const sql = new Proxy(q.sequelize, {
    get(target, key) {
      if (key === "query")
        return (text, options = {}) =>
          target.query(typeof text === "string" ? quote(text) : text, {
            ...options,
            transaction,
          });
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const optionPositions = {
    createTable: 2,
    bulkInsert: 2,
    addConstraint: 1,
    addIndex: 2,
    addColumn: 3,
    removeIndex: 2,
    removeColumn: 2,
    dropTable: 1,
  };
  const query = new Proxy(q, {
    get(target, key) {
      if (key === "sequelize") return sql;
      const value = Reflect.get(target, key);
      if (typeof value !== "function") return value;
      return (...args) => {
        if (key in optionPositions) {
          const position = optionPositions[key];
          args[position] = { ...args[position], transaction };
        }
        return value.apply(target, args);
      };
    },
  });
  const types = portableTypes(S);
  const sequelize = new Proxy(types, {
    get(target, key) {
      if (key === "literal") return (text) => S.literal(quote(text));
      return Reflect.get(target, key);
    },
  });
  return { q: query, S: sequelize };
}
module.exports = { adapt };
