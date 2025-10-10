const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerAnalysis = sequelize.define('CustomerAnalysis', {
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
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  customer_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  customer_first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customer_last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  current_progress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  opportunities: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  risks: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  strategic_suggestions: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  next_actions: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  analysis_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '原始分析数据'
  }
}, {
  tableName: 'customer_analysis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: [{ name: 'created_at', order: 'DESC' }]
    }
  ]
});

module.exports = CustomerAnalysis;
