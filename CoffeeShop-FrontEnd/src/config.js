/**
 * Configuration file for CoffeeShop application
 * 
 * This file contains all the configuration settings for connecting
 * to backend services. When deploying in different environments
 * or when using virtual machines, update these settings accordingly.
 */

// Replace this with your virtual machine's IP address
const SERVER_IP = "127.0.0.1"; 

// API and WebSocket ports
const API_PORT = 5000;
const WEBSOCKET_PORT = 5001;

// Complete URLs constructed from the settings above
export const API_URL = `http://${SERVER_IP}:${API_PORT}`;
export const WEBSOCKET_URL = `ws://${SERVER_IP}:${WEBSOCKET_PORT}`;

// Interval for server health checks (in milliseconds)
export const SERVER_CHECK_INTERVAL = 10000;

// Images base URL - used for product images
export const IMAGES_BASE_URL = `${API_URL}`;

// Export the full config for convenience when needing all settings
export default {
  API_URL,
  WEBSOCKET_URL,
  SERVER_IP,
  API_PORT,
  WEBSOCKET_PORT,
  SERVER_CHECK_INTERVAL,
  IMAGES_BASE_URL
};