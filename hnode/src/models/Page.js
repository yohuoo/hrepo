const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Page = sequelize.define('Page', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pages',
      key: 'id'
    }
  },
  page_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'menu/page/action'
  },
  url: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否系统页面（超管专属）'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'pages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['parent_id']
    },
    {
      fields: ['code']
    },
    {
      fields: ['page_type']
    }
  ]
});

module.exports = Page;

