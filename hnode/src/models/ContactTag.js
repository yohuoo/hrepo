const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactTag = sequelize.define('ContactTag', {
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
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  }
}, {
  tableName: 'contact_tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = ContactTag;
