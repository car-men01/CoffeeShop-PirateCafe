const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const MonitoredUser = sequelize.define('MonitoredUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
  monitoringSince: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'MonitoredUsers',
  timestamps: true
});

module.exports = MonitoredUser;