const config = require(__dirname + '/../config/config.json');
const { Sequelize, DataTypes, Op, or } = require("sequelize");
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;