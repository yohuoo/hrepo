const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailHistory = sequelize.define('EmailHistory', {
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
  send_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  receive_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  send_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  sender_email_binding_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_email_bindings',
      key: 'id'
    }
  },
  email_type: {
    type: DataTypes.ENUM('sent', 'received'),
    defaultValue: 'sent',
    allowNull: false
  },
  parent_email_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'email_history',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'sending', 'sent', 'failed'),
    defaultValue: 'sent',
    allowNull: false
  }
}, {
  tableName: 'email_history',
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
      fields: ['contact_id']
    },
    {
      fields: [{ name: 'send_time', order: 'DESC' }]
    }
  ]
});

module.exports = EmailHistory;
