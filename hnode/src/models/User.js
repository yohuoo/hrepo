const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  hashed_password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  password_changed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已修改初始密码'
  },
  last_password_change: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次修改密码时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['department_id']
    },
    {
      fields: ['role']
    }
  ]
});

// 实例方法
// 注意：密码加密在auth.js的路由中处理，这里不需要hooks
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.hashed_password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.hashed_password;
  return values;
};

module.exports = User;
