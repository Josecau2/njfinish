const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  zip: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  company: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('new', 'reviewing', 'contacted', 'closed'),
    allowNull: false,
    defaultValue: 'new',
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const value = this.getDataValue('metadata');
      if (!value) return null;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return null;
        }
      }
      return value;
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue('metadata', null);
        return;
      }
      // If a JSON string is passed in (legacy), parse to object; otherwise store object directly
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          this.setDataValue('metadata', parsed);
        } catch {
          // Fallback to raw value if not parseable
          this.setDataValue('metadata', value);
        }
      } else {
        this.setDataValue('metadata', value);
      }
    }
  },
}, {
  tableName: 'leads',
  timestamps: true,
  indexes: [
    {
      name: 'idx_leads_email',
      fields: ['email'],
    },
  ],
});

module.exports = Lead;
