const { Sequelize } = require("sequelize");
const { readConfig } = require("./env");
const database = new Sequelize(readConfig().database);
module.exports = database;
