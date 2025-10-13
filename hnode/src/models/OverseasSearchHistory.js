const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OverseasSearchHistory = sequelize.define('OverseasSearchHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  search_query: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  company_size: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  company_domain: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_size_result: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  company_industry: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  company_website: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  search_source: {
    type: DataTypes.STRING(50),
    defaultValue: 'openai'
  },
  is_contacted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_customer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'overseas_search_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['company_name']
    },
    {
      fields: ['company_domain']
    },
    {
      unique: true,
      fields: ['user_id', 'company_name', 'company_domain']
    }
  ]
});

module.exports = OverseasSearchHistory;

