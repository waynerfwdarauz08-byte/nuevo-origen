const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");
const Rol = require("./Rol")(sequelize, DataTypes);
const Permiso = require("./Permiso")(sequelize, DataTypes);
const RolPermiso = require("./RolPermiso")(sequelize, DataTypes);
Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: "rol_id",
  otherKey: "permiso_id",
});
Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: "permiso_id",
  otherKey: "rol_id",
});
const models = {
  sequelize,
  Rol,
  Permiso,
  RolPermiso,
  ...require("./identity")(sequelize, { Rol, Permiso }),
};
module.exports = { ...models, ...require("./team")(sequelize, models) };
