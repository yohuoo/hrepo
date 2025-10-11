const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  report_type: {
    type: DataTypes.ENUM('personal', 'department', 'company'),
    allowNull: false
  },
  period_type: {
    type: DataTypes.ENUM('week', 'month'),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 12
    }
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 53
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  generated_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的Markdown格式报告'
  },
  statistics: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '统计数据JSON'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['report_type', 'period_type']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['department_id']
    },
    {
      fields: ['year', 'month']
    },
    {
      fields: ['created_at']
    },
    {
      unique: true,
      fields: ['report_type', 'period_type', 'year', 'month', 'week', 'user_id', 'department_id'],
      name: 'unique_report'
    }
  ]
});

module.exports = Report;

