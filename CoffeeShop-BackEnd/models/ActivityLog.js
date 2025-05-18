const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      name: 'activity_user_idx',
      fields: ['UserId']
    },
    {
      name: 'activity_action_idx',
      fields: ['action']
    },
    {
      name: 'activity_date_idx',
      fields: ['createdAt']
    }
  ]
});

module.exports = ActivityLog;