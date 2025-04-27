const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const productRoutes = require('./routes/products');
const videosRoutes = require('./routes/videos');
const config = require('./config');

// Start the WebSocket server for product generation
require('./websocketServer');

const app = express();
const PORT = config.API_PORT;
const HOST = config.SERVER_HOST;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON requests

// Serve static images
app.use('/assets', express.static(path.join(__dirname, 'data/assets')));

// Make the uploads directory accessible
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/videos/thumbnails', express.static(path.join(__dirname, 'public/videos/thumbnails')));

// Routes
app.use('/products', productRoutes);
app.use('/videos', videosRoutes);

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