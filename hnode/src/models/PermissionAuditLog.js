const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PermissionAuditLog = sequelize.define('PermissionAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  operator_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  action_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'batch_grant/batch_revoke/update'
  },
  target_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'department或user'
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  target_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  changes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '变更详情'
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'permission_audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: [{ attribute: 'created_at', order: 'DESC' }]
    },
    {
      fields: ['operator_id']
    }
  ]
});

module.exports = PermissionAuditLog;

