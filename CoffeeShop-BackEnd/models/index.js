const { Sequelize } = require('sequelize');

// Configure the connection to your database
const sequelize = new Sequelize('coffeeshop', 'postgres', 'Bcarmen933!', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false // Set to console.log to see SQL queries
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

// Export sequelize instance
module.exports = sequelize;