const WebSocket = require('ws');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const http = require('http');
    
// Create WebSocket server attached to HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ 
  server: server 
});

// Store for generated products that persists during server lifetime
const generatedProducts = {
    products: [],
    add(product) {
        // Avoid duplicate IDs
        if (!this.products.some(p => p.id === product.id)) {
            this.products.push(product);
        }
    },
    getAll() {
        return this.products;
    },
    clear() {
        this.products = [];
    }
};

// Export the generatedProducts store so it can be accessed by other modules
module.exports = { 
    generatedProducts,
    server 
};

// Track active generation intervals for each client
const clientGenerators = new Map();

// Coffee shop related words for more realistic product names
const coffeeRelatedWords = [
    'Espresso', 'Latte', 'Cappuccino', 'Mocha', 'Americano', 'Macchiato', 
    'Frappe', 'Cold Brew', 'Nitro', 'Decaf', 'Ristretto', 'Affogato',
    'Cortado', 'Flat White', 'Doppio', 'Lungo', 'Turkish', 'Irish', 
    'Caramel', 'Vanilla', 'Hazelnut', 'Cinnamon', 'Chocolate', 'Pumpkin Spice'
];

// Categories for products
const categories = ["Classic Coffee", "Specialty Drinks", "Cold Brews", "Teas"];

// Available image paths
const imagePaths = [
    '/assets/espresso.jpg',
    '/assets/cappuccino.webp',
    '/assets/americano.png',
    '/assets/captains_quartet.jpg',
    '/assets/kraken_iced.jpg',
    '/assets/dead_mans_drip.jpg',
    '/assets/shiver_me_cold_brew.jpg',
    '/assets/frappuccino.jpg',
    '/assets/ice_latte.jpg',
    '/assets/under_the_water_tea.jpg',
    '/assets/mermaids_chai.webp',
    '/assets/stormy_earl_grey.jpg',
    '/assets/mocha.jpg',
    '/assets/flat_white.jpg',
    '/assets/macchiato.jpg',
    '/assets/turkish_coffee.jpg',
    '/assets/irish_coffee.jpg',
    '/assets/vienna_coffee.jpg',
    '/assets/buccaneers_brew.jpg',
    '/assets/jolly_roger_java.jpg',
    '/assets/sea_witchs_latte.jpg',
    '/assets/coconut_coffee.jpg'
];

// Counter for product IDs
let nextProductId = 1001; // Start from a high number to avoid conflicts with existing products

// Function to generate a random product
function generateRandomProduct() {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Get a random coffee-related word for the name
    const randomWord = coffeeRelatedWords[Math.floor(Math.random() * coffeeRelatedWords.length)];
    const productName = `${randomWord} ${faker.commerce.productAdjective()}`;
    
    // Random coffee image
    const randomImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
    
    // Generate a plausible price between 2 and 25
    const price = parseFloat((Math.random() * 23 + 2).toFixed(2));
    
    // Generate a description related to coffee
    const descriptions = [
        `A delightful ${randomWord.toLowerCase()} with a hint of ${faker.commerce.productAdjective().toLowerCase()} flavor.`,
        `Our special ${randomWord.toLowerCase()} blend, perfect for ${faker.word.adjective()} mornings.`,
        `A rich and ${faker.word.adjective()} ${randomWord.toLowerCase()} that will energize your day.`,
        `This ${randomWord.toLowerCase()} comes with a smooth ${faker.commerce.productMaterial().toLowerCase()} finish.`,
        `A customer favorite! ${productName} with a touch of ${faker.commerce.productMaterial().toLowerCase()}.`
    ];
    
    // Generate a unique ID with gen_ prefix to distinguish from regular products
    const uniqueId = `gen_${nextProductId++}`;
    
    return {
        id: uniqueId, 
        name: productName,
        category: randomCategory,
        price: price,
        image: randomImage,
        description: descriptions[Math.floor(Math.random() * descriptions.length)]
    };
}

// Monitor server status
let isServerHealthy = true;
const maxClientsPerInterval = 100; // A reasonable limit

// Handle WebSocket connections
wss.on('connection', function connection(ws) {
    console.log('Client connected');
    
    // Create an array to store the generator intervals for this client
    const generatorIntervals = [];
    
    // Handle messages from clients
    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            
            if (data.action === 'START_GENERATION') {
                console.log('Starting product generation');
                
                if (!isServerHealthy) {
                    ws.send(JSON.stringify({ 
                        type: 'ERROR', 
                        data: { message: 'Server load too high, please try again later' } 
                    }));
                    return;
                }
                
                if (clientGenerators.size > maxClientsPerInterval) {
                    ws.send(JSON.stringify({ 
                        type: 'ERROR', 
                        data: { message: 'Too many generation requests, please try again later' } 
                    }));
                    return;
                }
                
                // Create multiple "threads" - each running at a different interval
                const thread1 = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const product = generateRandomProduct();
                        // Add to our server-side store
                        generatedProducts.add(product);
                        ws.send(JSON.stringify({ type: 'PRODUCT_GENERATED', data: product }));
                    }
                }, 1500);
                
                const thread2 = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const product = generateRandomProduct();
                        generatedProducts.add(product);
                        ws.send(JSON.stringify({ type: 'PRODUCT_GENERATED', data: product }));
                    }
                }, 3700);
                
                const thread3 = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const product = generateRandomProduct();
                        generatedProducts.add(product);
                        ws.send(JSON.stringify({ type: 'PRODUCT_GENERATED', data: product }));
                    }
                }, 2800);
                
                // Store the intervals for later cleanup
                generatorIntervals.push(thread1, thread2, thread3);
                clientGenerators.set(ws, generatorIntervals);
                
                // Send confirmation
                ws.send(JSON.stringify({ 
                    type: 'GENERATION_STARTED', 
                    data: { 
                        message: 'Product generation started',
                        generatedCount: generatedProducts.getAll().length 
                    } 
                }));
                
            } else if (data.action === 'STOP_GENERATION') {
                console.log('Stopping product generation');
                
                // Clear all intervals for this client
                const intervals = clientGenerators.get(ws) || [];
                intervals.forEach(interval => clearInterval(interval));
                clientGenerators.delete(ws);
                
                // Send confirmation
                ws.send(JSON.stringify({ 
                    type: 'GENERATION_STOPPED',
                    data: { 
                        message: 'Product generation stopped',
                        generatedCount: generatedProducts.getAll().length 
                    } 
                }));
            } else if (data.action === 'GET_GENERATED_COUNT') {
                ws.send(JSON.stringify({ 
                    type: 'GENERATED_COUNT', 
                    data: { 
                        count: generatedProducts.getAll().length 
                    } 
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                    type: 'ERROR', 
                    data: { message: 'Invalid message format' } 
                }));
            }
        }
    });
    
    // Handle client disconnection
    ws.on('close', function() {
        console.log('Client disconnected');
        
        // Clean up any running generators for this client
        const intervals = clientGenerators.get(ws) || [];
        intervals.forEach(interval => clearInterval(interval));
        clientGenerators.delete(ws);
    });
    
    // Handle errors
    ws.on('error', function(error) {
        console.error('WebSocket error:', error);
    });
    
    // Send initial hello with current generated count
    ws.send(JSON.stringify({ 
        type: 'CONNECTED', 
        data: { 
            message: 'Connected to product generation service',
            generatedCount: generatedProducts.getAll().length
        } 
    }));
});

// Health monitoring
setInterval(() => {
    isServerHealthy = clientGenerators.size < maxClientsPerInterval;
    console.log(`WebSocket server health: ${isServerHealthy ? 'HEALTHY' : 'BUSY'}, active clients: ${clientGenerators.size}`);
}, 30000);

// Handle errors at the server level
wss.on('error', function(error) {
    console.error('WebSocket server error:', error);
});

console.log('Product generation service is ready!');

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});