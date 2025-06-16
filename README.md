# Pirate Café - Full Stack Coffee Shop Application

Pirate Café is a full-stack web application for a pirate-themed coffee shop. It provides an interactive platform for customers to browse the menu and offers administrative tools for managing products and monitoring user activity.

---

## 🏴‍☠️ Project Overview

This project represents a website for a Coffee Shop, built using modern web technologies. It includes features for both customers and administrators, ensuring a seamless and secure experience.

---

## 🚀 Technologies Used

### Front-End
- **React**: Component-based UI development
- **React Router**: Client-side routing and navigation
- **Axios**: API request handling
- **Chart.js & React-ChartJS-2**: Data visualization when generating new products
- **CSS**: Custom responsive styling
- **LocalStorage API**: Offline capabilities & state persistence
- **JWT**: Secure authentication mechanism
- **Context API**: State management across components

### Back-End
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Sequelize ORM**: Database operations and modeling
- **JWT Authentication**: Secure user verification
- **bcrypt**: Password hashing and security
- **WebSocket**: Real-time communication
- **Cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management

### Database
- **SQL Database**: Managed using Sequelize ORM

### DevOps & Testing
- **Docker & Docker Compose**: Containerization and deployment
- **Jest**: Unit testing

---

## 📋 Core Functionalities

### User Authentication & Authorization
- **Registration & Login**: Users can register and log in securely.
- **Two-Factor Authentication**: Enhanced security with verification codes sent via email.
- **Role-Based Access Control**: Different permissions for users and admins.

### AI-Powered Chatbot 🤖
- **Intelligent Assistant**: AI chatbot powered by Google Gemini that provides personalized help
- **Role-Aware Responses**: Different assistance based on user role (user vs admin)
- **Contextual Information**: Access to real-time account data, orders, and system information
- **24/7 Support**: Instant answers to common questions about orders, balance, products, and more

### CRUD Operations
- **Menu**: View all products from the shop.
- **Add a Product**: Add a new product to the menu.
- **Product Details**: View, update, or delete a selected product.

### Search, Filtering & Sorting
- **Search**: Find products by name or description.
- **Filter**: Filter products by category.
- **Sort**: Sort products by price (ascending/descending).

### Offline Capabilities
- **Offline Product Browsing**: Access menu items without an internet connection.
- **Data Synchronization**: Changes made offline are updated when the connection is restored.
- **Persistent Data**: Local storage maintains state between sessions.

### Admin Dashboard
- **User Monitoring**: Track customer activities and behavior.
- **Activity Logs**: Detailed records of user actions.
- **Security Testing**: Simulate suspicious activity scenarios.
- **User Management**: Control monitored users and permissions.

### Responsive Design
- **Mobile-Friendly**: Optimized for all screen sizes.
- **Consistent UI Elements**: Cohesive experience across pages.

---

## 📱 Application Pages

1. **Main Page**: Landing page with promotional content and videos.
2. **Menu Page**: Product display with search, filter, and sort capabilities.
3. **Add Product Page**: Form to add new products to the catalog.
4. **Product Detail Page**: Comprehensive product information with update/delete options.
5. **Admin Dashboard**: Administrative tools and monitoring capabilities (restricted access).

---

## 💻 Usage Flow

- **Browse the Menu**: View all products with filtering options.
- **Product Management**: Add, update, or delete products (requires authentication).
- **Account Management**: Register, log in, and manage your profile.
- **Administrative Tools**: Access monitoring dashboard (admin users only).

---

## 🤖 Intelligent Recommendation System

Pirate Café features a sophisticated AI-powered recommendation engine that personalizes the user experience by suggesting coffee products based on user behavior and preferences.

### 🎯 Recommendation Strategies

The system implements multiple recommendation algorithms:

#### **1. Hybrid Strategy (Default)**
- **Weight Distribution**: 40% Collaborative + 30% Content-Based + 30% Popularity
- **Best For**: Balanced recommendations combining user preferences and trending products
- **Fallback**: Automatically switches to popularity-based if insufficient data

#### **2. Collaborative Filtering**
- **Algorithm**: "Users who ordered X also ordered Y"
- **Data Analysis**: User behavior patterns and similar taste profiles
- **Minimum Requirements**: 2+ orders for personalization

#### **3. Content-Based Filtering**
- **Category Preferences**: Based on user's favorite coffee categories
- **Price Range Matching**: Suggests products within user's typical spending range
- **Feature Similarity**: Analyzes product characteristics and descriptions

#### **4. Popularity-Based**
- **Trending Products**: Most ordered items in the last 30 days
- **Anonymous Users**: Default strategy for non-authenticated visitors
- **Minimum Threshold**: Products with 5+ orders considered popular

### 🔧 Configuration & Customization

#### **Easy Configuration Management**
All recommendation criteria can be modified in `CoffeeShop-BackEnd/config/recommendationConfig.js`:

```javascript
module.exports = {
  strategies: {
    default: 'hybrid',           // Change default strategy
    hybrid: {
      weights: {
        popularity: 0.3,         // Modify weight distribution
        collaborative: 0.4,      // Adjust collaboration strength
        content: 0.3            // Control content matching
      }
    }
  },
  
  criteria: {
    orderHistory: {
      lookbackDays: 90,         // How far back to analyze orders
      minOrdersRequired: 2      // Minimum orders for personalization
    },
    
    priceRange: {
      tolerance: 0.3,           // 30% price variation tolerance
      defaultRange: [5, 25]     // Price range for new users
    },
    
    popularity: {
      timeWindow: 30,           // Days for popularity calculation
      minOrdersForPopular: 5    // Minimum orders for trending status
    }
  }
}
```

#### **Dynamic Weight Adjustment**
Administrators can customize recommendation weights in real-time:

```javascript
// Custom hybrid strategy with different weights
const customRecommendations = await getCustomRecommendations(userId, {
  popularity: 0.5,     // 50% popularity
  collaborative: 0.3,  // 30% collaborative
  content: 0.2        // 20% content-based
});
```

### 📊 Performance Features

- **Smart Caching**: 10-minute cache for recommendations, 30-minute cache for popular products
- **Fallback Strategy**: Automatic degradation to simpler algorithms if complex ones fail
- **Error Handling**: Graceful fallbacks ensure recommendations always work
- **Scalable Architecture**: Designed to handle growing user base and product catalog

### 🎨 User Experience

#### **Frontend Integration**
- **MenuPage Display**: Recommendations appear prominently on the main menu
- **Personalized Titles**: "Recommended for You" for authenticated users
- **Anonymous Support**: "Popular Choices" for visitors
- **Loading States**: Smooth loading animations and error handling
- **Responsive Design**: Works perfectly on all device sizes

#### **Recommendation Display**
- **Product Cards**: Beautiful cards showing recommended products
- **Reasoning**: Each recommendation includes explanation ("Popular choice", "Matches your preferences")
- **Quick Actions**: One-click add to cart functionality
- **Refresh Option**: Users can refresh recommendations anytime

### 🔍 API Endpoints

The recommendation system provides comprehensive REST API endpoints:

```bash
# Get personalized recommendations
GET /api/recommendations/user/:userId?strategy=hybrid&count=5

# Get popular products (no auth required)
GET /api/recommendations/popular?count=5

# Get anonymous recommendations
GET /api/recommendations/anonymous?count=5

# Custom weighted recommendations
POST /api/recommendations/user/:userId/custom
Body: { weights: { popularity: 0.3, collaborative: 0.4, content: 0.3 } }

# Get available strategies
GET /api/recommendations/strategies

# Admin: View configuration
GET /api/recommendations/config

# Admin: Clear cache
POST /api/recommendations/cache/clear
```

### 📈 Analytics & Monitoring

- **Strategy Performance**: Track which strategies perform best
- **Cache Hit Rates**: Monitor system performance
- **User Engagement**: Measure recommendation click-through rates
- **A/B Testing Ready**: Easy to test different weight configurations

### 🛠️ How to Modify Recommendation Criteria

#### **1. Change Strategy Weights**
Edit `recommendationConfig.js`:
```javascript
strategies: {
  hybrid: {
    weights: {
      popularity: 0.4,    // Increase popularity influence
      collaborative: 0.3, // Decrease collaborative filtering
      content: 0.3       // Keep content-based the same
    }
  }
}
```

#### **2. Adjust Time Windows**
```javascript
criteria: {
  orderHistory: {
    lookbackDays: 180,        // Look back 6 months instead of 3
  },
  popularity: {
    timeWindow: 14,           // Use 2-week popularity window
  }
}
```

#### **3. Modify Price Sensitivity**
```javascript
criteria: {
  priceRange: {
    tolerance: 0.5,           // Allow 50% price variation
    defaultRange: [3, 30]     // Expand default price range
  }
}
```

#### **4. Change Minimum Requirements**
```javascript
criteria: {
  orderHistory: {
    minOrdersRequired: 1,     // Personalize after just 1 order
  },
  popularity: {
    minOrdersForPopular: 3,   // Lower threshold for popular products
  }
}
```

The system automatically picks up configuration changes without requiring server restarts, making it easy to fine-tune recommendations based on user feedback and business needs.

---

## 📊 Admin Features

Administrators have access to:
- **Comprehensive User Activity Monitoring**: Track user actions and behaviors.
- **Statistical Visualizations**: View detailed charts and graphs of site usage.
- **User Management Tools**: Manage user accounts and permissions.
- **Security Alert Configuration**: Simulate and monitor suspicious activities.
- **AI Assistant for Admins**: Specialized chatbot responses for administrative tasks.

---

## 🤖 AI Chatbot Setup

The application includes an intelligent AI chatbot powered by Google Gemini. To enable the chatbot:

1. **Get Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key
2. **Configure Environment**: Add your API key to `CoffeeShop-BackEnd/.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. **Usage**: The chatbot appears as a floating button for authenticated users and provides:
   - **For Users**: Order history, balance info, product details, security tips
   - **For Admins**: System statistics, user management help, administrative guidance

For detailed setup instructions, see [CHATBOT_README.md](CHATBOT_README.md).

---

## 🔒 Security Implementation

- **Password Protection**: Secure hashing with bcrypt.
- **JWT Authentication**: Token-based session management.
- **Two-Factor Verification**: Additional security layer.
- **User Activity Monitoring**: Detection of suspicious behavior.
- **Role-Based Authorization**: Access control based on user roles.

---

## 🌐 Deployment

The Pirate Café application is deployed using modern cloud platforms to ensure scalability, reliability, and ease of access. The deployment setup includes:

### Back-End Deployment
- **Platform**: [Render](https://render.com/)
- **Database**: PostgreSQL database hosted on Render
- **API Hosting**: The back-end server is deployed on Render, which provides a managed environment for Node.js applications.
- **Environment Variables**: Sensitive information such as database credentials, JWT secrets, and API keys are securely stored in Render's environment variable settings.

### Front-End Deployment
- **Platform**: [Vercel](https://vercel.com/)
- **Hosting**: The React front-end is deployed on Vercel, which offers fast and reliable hosting for static and serverless applications.
- **Build Process**: The front-end is built using Vercel's CI/CD pipeline, which automatically triggers a new build and deployment whenever changes are pushed to the GitHub repository.

### Deployment Workflow
1. **Back-End**:
   - The back-end code is pushed to a GitHub repository.
   - Render is configured to pull the latest changes from the repository and deploy the Node.js application.
   - The PostgreSQL database is set up on Render, and the back-end is connected to it using environment variables.

2. **Front-End**:
   - The front-end code is pushed to a GitHub repository.
   - Vercel is configured to pull the latest changes from the repository and deploy the React application.
   - The front-end is configured to communicate with the back-end API hosted on Render.

### Accessing the Application
- **Front-End**: The application can be accessed via the Vercel-hosted URL:
  [https://coffeeshop-frontend-rust.vercel.app/](https://coffeeshop-frontend-rust.vercel.app/)
- **Back-End API**: The back-end API is hosted on Render and can be accessed at:
  [https://coffeeshop-piratecafe-backend.onrender.com](https://coffeeshop-piratecafe-backend.onrender.com)

### Notes
- Ensure that the front-end is configured to use the correct API URL (`https://coffeeshop-backend.onrender.com`) in the `API_URL` environment variable.
- The application is fully functional and accessible from any device with an internet connection.


