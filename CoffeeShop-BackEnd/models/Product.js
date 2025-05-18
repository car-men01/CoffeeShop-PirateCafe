// Update Product model to include indices
const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const ProductCategory = require('./ProductCategory');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    // index: true // Add index to name
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    // index: true // Add index to price 
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "/assets/add_product_main.jpg"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  // indexes: [
  //   // Composite index for category + price
  //   {
  //     name: 'product_category_price_idx',
  //     fields: ['ProductCategoryId', 'price']
  //   }
  // ]
});

// Define the relationship
ProductCategory.hasMany(Product);
Product.belongsTo(ProductCategory);

module.exports = Product;