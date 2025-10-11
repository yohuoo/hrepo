const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contract_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  party_a_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  party_b_name: {
    type: DataTypes.STRING(200),
    defaultValue: '浩天药业有限公司'
  },
  purchase_product: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  purchase_quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  estimated_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  contract_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['customer_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Contract;

