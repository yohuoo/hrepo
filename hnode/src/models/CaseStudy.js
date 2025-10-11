const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CaseStudy = sequelize.define('CaseStudy', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  customer_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的客户基本信息'
  },
  sales_techniques: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的销售技巧总结'
  },
  communication_highlights: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的沟通亮点'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的完整案例总结（Markdown格式）'
  },
  generated_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'case_studies',
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

module.exports = CaseStudy;

