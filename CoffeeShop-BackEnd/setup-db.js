const initialProducts = require('./data/initialProducts');
const sequelize = require('./models/index');
const { User, Product, ProductCategory, ActivityLog } = require('./models/relationships');
const bcrypt = require('bcrypt');

const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');
    
    // Force sync all models to recreate tables completely
    // This ensures all columns are properly created, including UserId in Products
    console.log('Creating database tables with the correct schema...');
    await sequelize.sync({ force: true });
    console.log('Database schema synchronized');
    
    // Create admin user first so we can reference it later
    console.log('Creating admin user...');
    const adminUser = await createAdminUser();
    
    // Begin transaction for product data
    await sequelize.transaction(async (transaction) => {
      // Extract unique categories from initial products
      const uniqueCategories = [...new Set(initialProducts.map(p => p.category))];
      const categoryOrder = ["Classic Coffee", "Specialty Drinks", "Cold Brews", "Teas"];
      
      // Sort categories according to predefined order
      uniqueCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b);
      });
      
      // Create categories first
      console.log('Creating product categories...');
      const categoryMap = {};
      for (let i = 0; i < uniqueCategories.length; i++) {
        const category = uniqueCategories[i];
        const newCategory = await ProductCategory.create({
          name: category,
          displayOrder: i
        }, { transaction });
        categoryMap[category] = newCategory.id;
      }
      
      // Then create products with references to category IDs AND the admin user
      console.log('Creating products with admin user reference...');
      for (const product of initialProducts) {
        await Product.create({
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          ProductCategoryId: categoryMap[product.category],
          UserId: adminUser.id // Assign all products to admin user
        }, { transaction });
      }
      
      console.log('Initial data inserted successfully');
      
      // Create some sample activity logs for demonstration
      console.log('Creating sample activity logs...');
      await ActivityLog.create({
        UserId: adminUser.id,
        action: 'CREATE',
        entityType: 'Product',
        entityId: 1,
        details: 'Initial product creation',
        timestamp: new Date()
      }, { transaction });
      
      await ActivityLog.create({
        UserId: adminUser.id,
        action: 'READ', 
        entityType: 'Product',
        entityId: null,
        details: 'Viewed product list',
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      }, { transaction });
    });
    
    // Create a regular user for testing
    console.log('Creating a regular test user...');
    await createRegularUser();
    
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await sequelize.close();
  }
};

// Create admin user function
const createAdminUser = async () => {
  try {
    console.log('Setting up admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@piratecafe.com' },
      defaults: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isMonitored: false,
        lastLogin: new Date()
      }
    });
    
    if (created) {
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    return admin;
  } catch (err) {
    console.error('Error creating admin user:', err);
    throw err; // Re-throw to stop the setup process
  }
};

// Create a regular test user
const createRegularUser = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('user123', salt);
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'user@piratecafe.com' },
      defaults: {
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
        isMonitored: false,
        lastLogin: new Date()
      }
    });
    
    if (created) {
      console.log('Regular test user created successfully');
    } else {
      console.log('Regular test user already exists');
    }
    
    return user;
  } catch (err) {
    console.error('Error creating regular user:', err);
    return null;
  }
};

// Start database setup
setupDatabase()
  .then(() => console.log('Database setup complete'))
  .catch(err => console.error('Database setup failed:', err));