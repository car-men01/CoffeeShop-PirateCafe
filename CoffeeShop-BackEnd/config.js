/**
 * Configuration file for CoffeeShop backend
 * 
 * This file contains all the configuration settings for the backend server.
 * When deploying in different environments or when using virtual machines,
 * update these settings accordingly.
 */

// Server will listen on all available network interfaces (0.0.0.0) 
// which makes it accessible from other machines on the network
const SERVER_HOST = '0.0.0.0';

// API and WebSocket ports
const API_PORT = 5000;
const WEBSOCKET_PORT = 5001;


// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'piratecafesecret';

module.exports = {
  SERVER_HOST,
  API_PORT,
  WEBSOCKET_PORT,
  JWT_SECRET
};