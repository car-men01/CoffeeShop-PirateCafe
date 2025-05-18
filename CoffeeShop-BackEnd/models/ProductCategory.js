const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // index: true // Explicit index for name lookups
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    // index: true // Add index for sorting by display order
  }
}, {
  timestamps: true,
  // indexes: [
  //   {
  //     name: 'category_name_idx',
  //     fields: ['name']
  //   }
  // ]
});

module.exports = ProductCategory;