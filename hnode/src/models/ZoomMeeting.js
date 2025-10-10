const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ZoomMeeting = sequelize.define('ZoomMeeting', {
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
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  meeting_title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  meeting_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  video_file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  video_file_name: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  video_file_size: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  audio_file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transcript_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'transcribing', 'summarizing', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'zoom_meetings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['status']
    },
    {
      fields: [{ name: 'created_at', order: 'DESC' }]
    },
    {
      fields: [{ name: 'meeting_date', order: 'DESC' }]
    }
  ]
});

module.exports = ZoomMeeting;
