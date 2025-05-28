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

## 📊 Admin Features

Administrators have access to:
- **Comprehensive User Activity Monitoring**: Track user actions and behaviors.
- **Statistical Visualizations**: View detailed charts and graphs of site usage.
- **User Management Tools**: Manage user accounts and permissions.
- **Security Alert Configuration**: Simulate and monitor suspicious activities.

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


