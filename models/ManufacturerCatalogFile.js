const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerCatalogFile = sequelize.define('ManufacturerCatalogFile', {
  manufacturer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'manufacturers',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'manufacturer_catalog_files'
});



module.exports = { ManufacturerCatalogFile };
