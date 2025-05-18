const { faker } = require('@faker-js/faker');
const sequelize = require('./models/index');
const Product = require('./models/Product');
const ProductCategory = require('./models/ProductCategory');

// Configure constants - modified for performance
const NUM_CATEGORIES = 100000; // 100,000 categories
const MAX_PRODUCTS_PER_CATEGORY = 5; // 0-5 products per category
const BATCH_SIZE = 1000; // Smaller batch size for better progress reporting
const LOGGING_INTERVAL = 100; // Log every 100 categories

// Available image paths from your actual assets
const availableImages = [
  '/assets/americano.png',
  '/assets/berry_treasure.jpg',
  '/assets/blackbeards_blend.jpg',
  '/assets/buccaneers_brew.jpg',
  '/assets/cappuccino.webp',
  '/assets/captains_chamomile.jpg',
  '/assets/captains_quartet.jpg',
  '/assets/chocolate_hazelnut_cold_brew.jpg',
  '/assets/coconut_coffee.jpg',
  '/assets/coconut_cold_brew.jpg',
  '/assets/dark_roast_nitro.jpg',
  '/assets/dead_mans_drip.jpg',
  '/assets/espresso.jpg',
  '/assets/flat_white.jpg',
  '/assets/frappuccino.jpg',
  '/assets/gold_rush_espresso.jpg',
  '/assets/golden_turmeric.jpg',
  '/assets/ice_latte.jpg',
  '/assets/irish_coffee.jpg',
  '/assets/jolly_roger_java.jpg',
  '/assets/kraken_iced.jpg',
  '/assets/macchiato.jpg',
  '/assets/maple_bourbon.jpg',
  '/assets/mermaids_chai.webp',
  '/assets/minty.jpg',
  '/assets/mocha.jpg',
  '/assets/nitro_brew.jpg'
];

// Helper function to get a random image path
function getRandomImagePath() {
  const randomIndex = Math.floor(Math.random() * availableImages.length);
  return availableImages[randomIndex];
}


// Helper function to get a random image path
// Modify the generateUniqueCategories function
function generateUniqueCategories(count) {
  console.log(`Generating ${count} unique category names...`);
  const uniqueCategories = new Set();
  let attempts = 0;
  
  // Create a larger pool of adjectives and materials
  const departmentOptions = [
    'Coffee', 'Tea', 'Pastry', 'Breakfast', 'Lunch', 'Beverage', 'Dessert', 
    'Specialty', 'Seasonal', 'Cold Brew', 'Espresso', 'Organic', 'Vegan', 'Keto',
    'Signature', 'Premium', 'Cafe', 'Pirate', 'Treasure', 'Island', 'Ocean', 
    'Tropical', 'Exotic', 'Handcrafted', 'Artisan', 'Gourmet', 'Fusion'
  ];
  
  const adjectiveOptions = [
    'Bold', 'Rich', 'Smooth', 'Sweet', 'Aromatic', 'Fragrant', 'Decadent', 'Savory',
    'Spiced', 'Tangy', 'Creamy', 'Velvety', 'Fresh', 'Robust', 'Mellow', 'Nutty',
    'Bright', 'Intense', 'Delicate', 'Fruity', 'Floral', 'Earthy', 'Herbal', 'Tart',
    'Silky', 'Smoky', 'Balanced', 'Complex', 'Crisp', 'Dark', 'Light', 'Medium',
    'Strong', 'Mild', 'Exotic', 'Traditional', 'Classic', 'Modern', 'Rustic', 'Urban'
  ];
  
  const materialOptions = [
    'Bean', 'Leaf', 'Blend', 'Roast', 'Infusion', 'Mix', 'Collection', 'Selection',
    'Variety', 'Harvest', 'Origin', 'Reserve', 'Edition', 'Series', 'Line', 'Label',
    'Batch', 'Grade', 'Quality', 'Style', 'Formula', 'Recipe', 'Creation', 'Specialty',
    'Signature', 'Premium', 'Deluxe', 'Standard', 'Exclusive', 'Limited', 'Special',
    'Supreme', 'Ultra', 'Prime', 'Choice', 'Select', 'Finest', 'Superior'
  ];
  
  console.log("Starting category generation...");
  
  // Generate deterministic combinations for faster processing
  for (let i = 0; i < departmentOptions.length && uniqueCategories.size < count; i++) {
    for (let j = 0; j < adjectiveOptions.length && uniqueCategories.size < count; j++) {
      for (let k = 0; k < materialOptions.length && uniqueCategories.size < count; k++) {
        const categoryName = `${departmentOptions[i]} ${adjectiveOptions[j]} ${materialOptions[k]}`;
        uniqueCategories.add(categoryName);
        attempts++;
        
        // Log progress
        if (uniqueCategories.size % 10000 === 0 || uniqueCategories.size === count) {
          console.log(`Generated ${uniqueCategories.size}/${count} unique categories (${attempts} attempts)`);
        }
      }
    }
  }
  
  // If we don't have enough categories yet, add numbered categories
  let index = 1;
  while (uniqueCategories.size < count) {
    uniqueCategories.add(`Category ${index}`);
    index++;
    attempts++;
    
    if (uniqueCategories.size % 10000 === 0) {
      console.log(`Generated ${uniqueCategories.size}/${count} unique categories (${attempts} attempts)`);
    }
  }
  
  console.log(`Finished generating ${count} unique category names (took ${attempts} attempts)`);
  return Array.from(uniqueCategories);
}



async function populateDatabase() {
  try {
    // Test basic database connection
    console.log('Testing database connection...');
    try {
      const testResult = await sequelize.query('SELECT 1+1 AS result');
      console.log('Database connection test successful:', testResult[0][0].result);
    } catch (testErr) {
      console.error('Database connection test failed:', testErr);
      return;
    }

    // Sync database (avoid force:true to prevent dropping tables)
    console.log('Syncing database models...');
    await sequelize.sync({ force: false });
    
    console.log('Starting database population...');
    console.time('Database population');
    
    // Create categories in batches
    console.log(`Creating ${NUM_CATEGORIES} categories...`);
    
    // Generate unique category names first
    console.log('Starting unique category name generation...');
    const uniqueCategoryNames = generateUniqueCategories(NUM_CATEGORIES);
    console.log(`Finished generating ${uniqueCategoryNames.length} unique category names.`);
    
    let totalCategoriesCreated = 0;
    let totalProductsCreated = 0;
    
    // Process categories in batches
    console.log(`Processing categories in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < uniqueCategoryNames.length; i += BATCH_SIZE) {
      const batchStart = Date.now();
      console.log(`\nStarting batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(uniqueCategoryNames.length/BATCH_SIZE)} (indexes ${i} to ${Math.min(i + BATCH_SIZE - 1, uniqueCategoryNames.length - 1)})`);
      
      const categoryBatch = uniqueCategoryNames.slice(i, i + BATCH_SIZE);
      const categoryData = categoryBatch.map((name, index) => ({
        name,
        displayOrder: i + index
      }));
      
      try {
        // Create categories in batch
        console.log(`Creating ${categoryData.length} categories in database...`);
        const createdCategories = await ProductCategory.bulkCreate(categoryData);
        totalCategoriesCreated += createdCategories.length;
        console.log(`Created ${createdCategories.length} categories (Total: ${totalCategoriesCreated}/${NUM_CATEGORIES})`);
        
        // Create products for each category in this batch
        console.log(`Creating products for categories in this batch...`);
        let batchProductsCreated = 0;
        let categoriesWithProducts = 0;
        
        // Process products in smaller groups to provide better progress updates
        for (let j = 0; j < createdCategories.length; j += LOGGING_INTERVAL) {
          const categoryGroup = createdCategories.slice(j, j + LOGGING_INTERVAL);
          const allProductsForGroup = [];
          
          for (const category of categoryGroup) {
            // Random number of products between 0 and 5
            const numProducts = Math.floor(Math.random() * (MAX_PRODUCTS_PER_CATEGORY + 1));
            
            if (numProducts > 0) {
              categoriesWithProducts++;
              for (let k = 0; k < numProducts; k++) {
                allProductsForGroup.push({
                  name: faker.commerce.productName(),
                  price: parseFloat(faker.commerce.price(1, 30, 2)),
                  description: faker.commerce.productDescription(),
                  image: getRandomImagePath(),
                  ProductCategoryId: category.id
                });
              }
            }
          }
          
          if (allProductsForGroup.length > 0) {
            const createdProducts = await Product.bulkCreate(allProductsForGroup);
            batchProductsCreated += createdProducts.length;
            totalProductsCreated += createdProducts.length;
            
            console.log(`  - Processed categories ${j+1}-${j+categoryGroup.length}: Created ${createdProducts.length} products`);
          } else {
            console.log(`  - Processed categories ${j+1}-${j+categoryGroup.length}: No products created`);
          }
        }
        
        const batchEnd = Date.now();
        const batchDuration = (batchEnd - batchStart) / 1000;
        console.log(`Batch complete: Created ${batchProductsCreated} products for ${categoriesWithProducts} categories in ${batchDuration.toFixed(2)}s`);
        console.log(`Overall progress: ${Math.round((totalCategoriesCreated / NUM_CATEGORIES) * 100)}%, Products: ${totalProductsCreated}`);
        
        // Estimate remaining time
        const elapsedTime = (batchEnd - perfStart) / 1000;
        const completedPercentage = totalCategoriesCreated / NUM_CATEGORIES;
        const estimatedTotalTime = elapsedTime / completedPercentage;
        const remainingTime = estimatedTotalTime - elapsedTime;
        console.log(`Time elapsed: ${Math.floor(elapsedTime/60)}m ${Math.floor(elapsedTime%60)}s | Estimated time remaining: ${Math.floor(remainingTime/60)}m ${Math.floor(remainingTime%60)}s`);
      } catch (batchError) {
        console.error(`Error in category batch ${i}/${NUM_CATEGORIES}:`, batchError.message);
      }
    }
    
    // Count the results and verify
    console.log('\nVerifying final counts...');
    const categoryCount = await ProductCategory.count();
    const productCount = await Product.count();
    
    console.log(`\nFinal counts: ${categoryCount} categories and ${productCount} products.`);
    console.timeEnd('Database population');
  } catch (error) {
    console.error('Error populating database:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Add performance tracking
const perfStart = Date.now();

// Execute the population
console.log('Starting database population script...');
populateDatabase()
  .then(() => {
    const totalTime = (Date.now() - perfStart) / 1000;
    console.log(`\nDatabase population completed in ${Math.floor(totalTime/60)}m ${Math.floor(totalTime%60)}s.`);
  })
  .catch(err => {
    console.error('\nDatabase population failed:');
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  });