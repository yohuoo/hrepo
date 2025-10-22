const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailDraft = sequelize.define('EmailDraft', {
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
  sender_email_binding_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_email_bindings',
      key: 'id'
    }
  },
  recipients: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '收件人列表 [{type, id, name, email, company}]'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'email_templates',
      key: 'id'
    }
  },
  draft_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '草稿名称'
  },
  is_auto_save: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为自动保存的草稿'
  }
}, {
  tableName: 'email_drafts',
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
      fields: ['is_auto_save']
    }
  ]
});

module.exports = EmailDraft;

