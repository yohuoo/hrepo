const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const UserEmailBinding = sequelize.define('UserEmailBinding', {
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
  email_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  email_password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'user_email_bindings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['email_address']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['user_id', 'email_address']
    }
  ]
});

// 密码加密钩子
UserEmailBinding.beforeCreate((binding) => {
  if (binding.changed('email_password')) {
    binding.email_password = encryptPassword(binding.email_password);
  }
});

UserEmailBinding.beforeUpdate((binding) => {
  if (binding.changed('email_password')) {
    binding.email_password = encryptPassword(binding.email_password);
  }
});

// 加密密码函数
function encryptPassword(password) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// 解密密码函数
function decryptPassword(encryptedPassword) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
  const parts = encryptedPassword.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 实例方法
UserEmailBinding.prototype.getDecryptedPassword = function() {
  try {
    return decryptPassword(this.email_password);
  } catch (error) {
    console.warn('密码解密失败，使用明文密码:', error.message);
    return this.email_password;
  }
};

// 隐藏密码字段
UserEmailBinding.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.email_password;
  return values;
};

module.exports = UserEmailBinding;
