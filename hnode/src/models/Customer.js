const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  company: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  email_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  communication_progress: {
    type: DataTypes.ENUM('待联系', '跟进中', '不再跟进', '暂停跟进'),
    defaultValue: '待联系'
  },
  interest_level: {
    type: DataTypes.ENUM('无兴趣', '低兴趣', '中等兴趣', '高兴趣'),
    defaultValue: '无兴趣'
  },
  last_communication_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['name']
    },
    {
      fields: ['first_name']
    },
    {
      fields: ['last_name']
    },
    {
      fields: ['email']
    },
    {
      fields: ['company']
    },
    {
      fields: ['communication_progress']
    },
    {
      fields: ['interest_level']
    }
  ]
});

module.exports = Customer;
