/**
 * Configuration file for CoffeeShop application
 * 
 * This file contains all the configuration settings for connecting
 * to backend services. When deploying in different environments
 * or when using virtual machines, update these settings accordingly.
 */


// Use environment variables or fallback to hardcoded values
const isProd = process.env.NODE_ENV === 'production';

// Backend service URL - use the deployed Render URL in production
const BACKEND_URL = isProd 
  ? "https://coffeeshop-piratecafe-backend.onrender.com" 
  : "http://127.0.0.1:5000";

// WebSocket URL - for production, use wss:// for secure WebSocket
const WS_URL = isProd
  ? "wss://coffeeshop-piratecafe-backend.onrender.com"
  : "ws://127.0.0.1:5001";


export const API_URL = BACKEND_URL;
export const WEBSOCKET_URL = WS_URL;

// Replace this with your virtual machine's IP address
const SERVER_IP = "127.0.0.1"; 

// API and WebSocket ports
const API_PORT = 5000;
const WEBSOCKET_PORT = 5001;

// Interval for server health checks (in milliseconds)
export const SERVER_CHECK_INTERVAL = 10000;

// Images base URL - used for product images
export const IMAGES_BASE_URL = `${API_URL}`;

// Export the full config for convenience when needing all settings
export default {
  API_URL,
  WEBSOCKET_URL,
  SERVER_CHECK_INTERVAL,
  IMAGES_BASE_URL
};