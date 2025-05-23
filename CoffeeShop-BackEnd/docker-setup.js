const initialProducts = require('./data/initialProducts');
const sequelize = require('./models/index');
const { User, Product, ProductCategory, ActivityLog } = require('./models/relationships');
const bcrypt = require('bcrypt');

const setupDatabase = async () => {
  try {
    console.log('Starting Docker database setup...');
    
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
      
      // Use findOrCreate for categories to prevent duplicate key errors
      console.log('Creating product categories...');
      const categoryMap = {};
      for (let i = 0; i < uniqueCategories.length; i++) {
        const category = uniqueCategories[i];
        const [newCategory] = await ProductCategory.findOrCreate({
          where: { name: category },
          defaults: { displayOrder: i },
          transaction
        });
        categoryMap[category] = newCategory.id;
      }
      
      // For each product, check if it already exists
      console.log('Creating products with admin user reference...');
      for (const productData of initialProducts) {
        // Check if product already exists
        const existingProduct = await Product.findOne({
          where: { 
            name: productData.name,
            ProductCategoryId: categoryMap[productData.category] 
          },
          transaction
        });
        
        if (!existingProduct) {
          await Product.create({
            name: productData.name,
            price: productData.price,
            image: productData.image,
            description: productData.description,
            ProductCategoryId: categoryMap[productData.category],
            UserId: adminUser.id
          }, { transaction });
        }
      }
      
      console.log('Initial data inserted successfully');
    });
    
    // Create a regular user for testing
    console.log('Creating a regular test user...');
    await createRegularUser();
    
    console.log('Docker database setup completed successfully!');
  } catch (err) {
    console.error('Error during Docker database setup:', err);
    throw err; // Re-throw to ensure Docker startup fails if this is critical
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
    throw err;
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

// Run this function if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => console.log('Docker database initialization complete'))
    .catch(err => {
      console.error('Docker database initialization failed:', err);
      process.exit(1); // Exit with error code
    });
}

module.exports = setupDatabase;