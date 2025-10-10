const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
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
  domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  position: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('tags');
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch (e) {
        return [];
      }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('tags', JSON.stringify(value));
      } else {
        this.setDataValue('tags', value);
      }
    }
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // 允许updated_at为null
  paranoid: false,
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
    }
  ]
});

// 虚拟字段
Contact.prototype.getDescription = function() {
  const parts = [];
  if (this.position) parts.push(this.position);
  if (this.company) parts.push(`at ${this.company}`);
  return parts.length > 0 ? parts.join(' ') : 'No description';
};

module.exports = Contact;
