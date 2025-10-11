const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '部门路径，如：1/5/12，便于查询所有子部门'
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'departments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['parent_id']
    },
    {
      fields: ['path']
    },
    {
      fields: ['manager_id']
    }
  ]
});

// 实例方法

// 获取完整路径
Department.prototype.getFullPath = async function() {
  if (!this.parent_id) {
    return this.name;
  }
  
  const parent = await Department.findByPk(this.parent_id);
  if (parent) {
    const parentPath = await parent.getFullPath();
    return `${parentPath} / ${this.name}`;
  }
  
  return this.name;
};

// 更新路径
Department.prototype.updatePath = async function() {
  if (!this.parent_id) {
    this.path = String(this.id);
    this.level = 1;
  } else {
    const parent = await Department.findByPk(this.parent_id);
    if (parent) {
      this.path = `${parent.path}/${this.id}`;
      this.level = parent.level + 1;
    }
  }
  await this.save();
};

module.exports = Department;

