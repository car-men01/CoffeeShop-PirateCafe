const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticate } = require('../middleware/auth');
const { User, Order, OrderItem, Product, ProductCategory, MonitoredUser, ActivityLog } = require('../models/relationships');
const { Op } = require('sequelize');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCYVeNtoxASSV8zF2IMB1tjDN39HeKCSlQ');
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});

// Helper function to get user context data
async function getUserContextData(userId, userRole) {
  try {
    const contextData = {
      role: userRole,
      userId: userId
    };

    if (userRole === 'user') {
      // Get user's balance
      const user = await User.findByPk(userId, {
        attributes: ['balance', 'username', 'email', 'isMonitored']
      });
      
      // Get user's latest orders
      const orders = await Order.findAll({
        where: { UserId: userId },
        include: [{
          model: OrderItem,
          include: [{
            model: Product,
            attributes: ['name']
          }]
        }],
        order: [['orderDate', 'DESC']],
        limit: 5
      });

      // Check if user is monitored
      const monitoredUser = await MonitoredUser.findOne({
        where: { UserId: userId }
      });

      contextData.balance = user?.balance ? parseFloat(user.balance) : 0;
      contextData.username = user?.username || '';
      contextData.email = user?.email || '';
      contextData.isMonitored = !!monitoredUser;
      contextData.monitoringReason = monitoredUser?.reason || null;
      contextData.recentOrders = orders.map(order => ({
        id: order.id,
        status: order.status,
        total: parseFloat(order.total),
        orderDate: order.orderDate,
        items: order.OrderItems.map(item => ({
          productName: item.productName || item.Product?.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      }));
    } else if (userRole === 'admin') {
      // Get admin-specific data
      const totalUsers = await User.count({ where: { role: 'user' } });
      const totalProducts = await Product.count();
      const totalOrders = await Order.count();
      const monitoredUsersCount = await MonitoredUser.count();
      
      // Get recent orders for admin
      const recentOrders = await Order.findAll({
        include: [{
          model: User,
          attributes: ['username']
        }],
        order: [['orderDate', 'DESC']],
        limit: 10
      });

      contextData.totalUsers = totalUsers;
      contextData.totalProducts = totalProducts;
      contextData.totalOrders = totalOrders;
      contextData.monitoredUsersCount = monitoredUsersCount;
      contextData.recentOrders = recentOrders.map(order => ({
        id: order.id,
        username: order.User?.username,
        status: order.status,
        total: parseFloat(order.total),
        orderDate: order.orderDate
      }));
    }

    // Get product information (available to both users and admins)
    const products = await Product.findAll({
      include: [{
        model: ProductCategory,
        attributes: ['name']
      }],
      order: [['price', 'DESC']],
      limit: 10
    });

    contextData.topProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.ProductCategory?.name,
      price: parseFloat(product.price),
      description: product.description
    }));

    // Get most expensive product
    const mostExpensiveProduct = products[0];
    if (mostExpensiveProduct) {
      contextData.mostExpensiveProduct = {
        name: mostExpensiveProduct.name,
        price: parseFloat(mostExpensiveProduct.price),
        category: mostExpensiveProduct.ProductCategory?.name
      };
    }

    return contextData;
  } catch (error) {
    console.error('Error getting user context data:', error);
    return { role: userRole, userId: userId, error: 'Failed to load context data' };
  }
}

// Helper function to create system prompt
function createSystemPrompt(contextData) {
  const { role, userId, username, balance, recentOrders, topProducts, mostExpensiveProduct } = contextData;
  
  let systemPrompt = `You are a helpful AI assistant for Pirate Café, a coffee shop application. 

IMPORTANT RULES:
- Always be helpful, friendly, and professional
- Only answer questions related to the coffee shop, orders, products, account management, and general app usage
- Do not provide information about other users' private data
- If asked about something outside the coffee shop domain, politely redirect to coffee shop related topics
- Keep responses concise but informative
- Use a friendly, café-style tone

USER CONTEXT:
- User Role: ${role}
- User ID: ${userId}
${username ? `- Username: ${username}` : ''}
`;

  if (role === 'user') {
    systemPrompt += `
USER ACCOUNT INFO:
- Current Balance: $${balance || 0}
- Is Monitored: ${contextData.isMonitored ? 'Yes' : 'No'}
${contextData.isMonitored ? `- Monitoring Reason: ${contextData.monitoringReason}` : ''}

RECENT ORDERS:
${recentOrders && recentOrders.length > 0 ? 
  recentOrders.map(order => 
    `- Order #${order.id}: $${order.total} (${order.status}) - ${order.orderDate}`
  ).join('\n') : '- No recent orders'}

LAST ORDER DETAILS:
${recentOrders && recentOrders.length > 0 ? 
  `Order #${recentOrders[0].id} - Items: ${recentOrders[0].items.map(item => 
    `${item.quantity}x ${item.productName} ($${item.price})`
  ).join(', ')}` : 'No orders found'}

USER MONITORING SYSTEM:
- Users can be monitored if they perform suspicious activities (excessive CRUD operations)
- To avoid monitoring: Use the app normally, don't perform too many rapid actions
- Monitored users are flagged in the admin dashboard
- Monitoring is for security and preventing abuse
`;
  } else if (role === 'admin') {
    systemPrompt += `
ADMIN DASHBOARD INFO:
- Total Users: ${contextData.totalUsers || 0}
- Total Products: ${contextData.totalProducts || 0}
- Total Orders: ${contextData.totalOrders || 0}
- Monitored Users: ${contextData.monitoredUsersCount || 0}

ADMIN CAPABILITIES:
- View and manage all user orders
- Monitor user activities and remove monitoring
- Add/edit/delete products
- Manage user accounts and wallets
- Simulate suspicious activities for testing
- View analytics and user statistics

RECENT ORDERS IN SYSTEM:
${contextData.recentOrders && contextData.recentOrders.length > 0 ?
  contextData.recentOrders.slice(0, 5).map(order => 
    `- Order #${order.id} by ${order.username}: $${order.total} (${order.status})`
  ).join('\n') : '- No recent orders in system'}
`;
  }

  systemPrompt += `
PRODUCT INFORMATION:
Most Expensive Product: ${mostExpensiveProduct ? `${mostExpensiveProduct.name} - $${mostExpensiveProduct.price} (${mostExpensiveProduct.category})` : 'Not available'}

TOP PRODUCTS BY PRICE:
${topProducts && topProducts.length > 0 ? 
  topProducts.slice(0, 5).map(product => 
    `- ${product.name}: $${product.price} (${product.category})`
  ).join('\n') : '- No products available'}

COMMON USER QUESTIONS & ANSWERS:
Q: What is my last order?
A: Provide details from the user's most recent order from RECENT ORDERS section above.

Q: What is my account balance?
A: Your current balance is $${balance || 0}.

Q: How do I add a new product?
A: ${role === 'admin' ? 'As an admin, you can add products through the "Add Product" page or the admin dashboard.' : 'Only admin users can add new products. You can browse existing products in the menu.'}

Q: What is the most expensive product?
A: Provide the information from the PRODUCT INFORMATION section above.

Q: How do I avoid being monitored?
A: Use the app normally. Avoid performing too many rapid actions like creating/updating/deleting multiple items quickly. The system monitors for suspicious activity patterns.

RESPONSE GUIDELINES:
- If asked about orders, refer to the user's actual order history above
- If asked about balance, use the exact balance shown above
- If asked about products, use the product information provided
- For admin users, provide admin-specific guidance
- For regular users, focus on user-specific features
- Always maintain a helpful, café-style tone
`;

  return systemPrompt;
}

// Chat endpoint
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context data
    const contextData = await getUserContextData(req.user.id, req.user.role);
    
    // Create system prompt with context
    const systemPrompt = createSystemPrompt(contextData);
    
    // Prepare the conversation for Gemini
    const prompt = `${systemPrompt}

User Question: ${message}

Please provide a helpful response based on the context provided above. Keep it concise and relevant to the coffee shop application.`;

    // Debug logging
    console.log('Attempting to call Gemini API with model: gemini-2.0-flash-exp');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0);
    
    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      response: botResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    
    let fallbackResponse;
    
    // Handle specific error types
    if (error.status === 429) {
      // Quota exceeded error
      fallbackResponse = `⏰ **API Quota Reached** - I'm temporarily at capacity! 

But I can still help with basic information:

${req.user.role === 'user' ? `
🔍 **Your Account** (User ID: ${req.user.id})
• Check your balance in the wallet section
• View recent orders in "My Orders" 
• Browse our menu for new products

🛡️ **Avoid Monitoring**: Use the app normally, don't perform too many rapid actions

☕ **Need Help?** Try these pages:
• Menu: Browse all our coffee products
• Cart: Manage your current order
• Wallet: Check balance and add funds` : `
🔧 **Admin Dashboard** (User ID: ${req.user.id})
• Manage users and orders via admin panel
• Add/edit products through the "Add Product" page
• Monitor user activities and system health

📊 **Quick Stats**: Check the admin dashboard for current system metrics`}

Please try again in a few minutes, or use the app's built-in features!`;

    } else if (error.status === 404) {
      // Model not found error
      fallbackResponse = `🤖 **AI Model Update** - I'm updating to the latest AI model!

While I'm updating, here's what you can do:

${req.user.role === 'user' ? `
📱 **Your Account**: 
• Balance: Check in wallet section
• Orders: View in "My Orders"
• Products: Browse the menu

💡 **Quick Tips**:
• Most expensive items are usually in the "Premium" category
• Add funds to your wallet before ordering
• Monitor your activity to avoid being flagged` : `
🔧 **Admin Features**:
• User management: Admin dashboard
• Product management: Add/edit products  
• Order monitoring: View all system orders
• Analytics: Check user statistics`}

The AI will be back online soon!`;

    } else {
      // General error fallback
      fallbackResponse = `I'm sorry, I'm having trouble processing your request right now. Here are some things I can help you with:

🔍 **Account Information**: Check your balance, view recent orders
📱 **Orders**: Information about your order history and status  
☕ **Products**: Details about our coffee menu and prices
🛡️ **Security**: How to avoid account monitoring
${req.user.role === 'admin' ? '🔧 **Admin Tools**: Managing users, products, and orders' : ''}

Please try asking me something specific about your Pirate Café experience!`;
    }

    res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// Get chatbot status/health
router.get('/status', authenticate, async (req, res) => {
  try {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Chatbot service unavailable' });
  }
});

module.exports = router;
