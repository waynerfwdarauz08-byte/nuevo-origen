const { readConfig } = require("./env");
const config = readConfig();
module.exports = {
  [config.mode]: {
    ...config.database,
    seederStorage: "sequelize",
    seederStorageTableName: "SequelizeData",
  },
};
