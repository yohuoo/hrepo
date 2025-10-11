const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PagePermission = sequelize.define('PagePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  page_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pages',
      key: 'id'
    }
  },
  target_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'department或user'
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '部门ID或用户ID'
  },
  has_permission: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'page_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['page_id', 'target_type', 'target_id']
    },
    {
      fields: ['target_type', 'target_id']
    },
    {
      fields: ['page_id']
    }
  ]
});

module.exports = PagePermission;

