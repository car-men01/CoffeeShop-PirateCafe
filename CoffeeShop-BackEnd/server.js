const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const productRoutes = require('./routes/products');
const videosRoutes = require('./routes/videos');
const analyticsRoutes = require('./routes/analytics');
const config = require('./config');
const sequelize = require('./models/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { startMonitoring } = require('./utils/userMonitoring');

// Initialize the Express app first
const app = express();
const PORT = config.API_PORT;
const HOST = config.SERVER_HOST;

// Then configure middleware
app.use(cors());
app.use(bodyParser.json());

// Set up static file serving
app.use('/assets', express.static(path.join(__dirname, 'data/assets')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/videos/thumbnails', express.static(path.join(__dirname, 'public/videos/thumbnails')));

// Set up all routes
app.use('/products', productRoutes);
app.use('/videos', videosRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Start the WebSocket server for product generation
// This line was missing from your code, but likely exists elsewhere
require('./websocketServer');

// Start the user monitoring service
startMonitoring();

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  
  // Log network interfaces to help identify the server's IP address
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  console.log('\nAvailable on the following IP addresses:');
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`http://${net.address}:${PORT}`);
      }
    }
  }
});