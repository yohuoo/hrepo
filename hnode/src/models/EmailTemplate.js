const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['title']
    }
  ]
});

// 实例方法：获取模板变量
EmailTemplate.prototype.getVariables = function() {
  const content = this.content || '';
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = new Set();
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
};

// 实例方法：渲染模板（可以渲染标题或内容）
EmailTemplate.prototype.render = function(variables = {}, text = null) {
  // 如果提供了text参数，渲染text；否则渲染content
  let content = text !== null ? text : (this.content || '');
  
  // 替换变量
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(regex, variables[key] || '');
  });
  
  return content;
};

module.exports = EmailTemplate;
