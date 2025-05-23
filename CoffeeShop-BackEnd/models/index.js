const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('../config');

// Configure the connection to your database using DB_CONFIG from config.js
const sequelize = new Sequelize(
  DB_CONFIG.database || 'coffeeshop', 
  DB_CONFIG.user || 'postgres', 
  DB_CONFIG.password || 'Bcarmen933!', 
  {
    host: DB_CONFIG.host || 'localhost',
    port: DB_CONFIG.port || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    ssl: DB_CONFIG.ssl
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