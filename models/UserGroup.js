const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserGroup = sequelize.define('user_groups', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },

});

module.exports = UserGroup;
