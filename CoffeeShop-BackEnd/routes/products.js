const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const { generatedProducts } = require('../websocketServer');
const { authenticate, adminOnly } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const multer = require('multer');
const path = require('path');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    // Get all categories from the database
    const categories = await ProductCategory.findAll({
      order: [['displayOrder', 'ASC']]
    });
    
    // Extract category names
    const dbCategories = categories.map(category => category.name);
    
    // Get categories from generated products
    const genCategories = [...new Set(generatedProducts.getAll().map(product => product.category))];
    
    // Combine and deduplicate
    const allCategories = [...new Set([...dbCategories, ...genCategories])];
    
    res.status(200).json(allCategories);
  } catch (err) {
    console.error('Error retrieving categories:', err);
    res.status(500).json({ error: 'Server error while retrieving categories' });
  }
});

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    // Parse pagination parameters with proper defaults
    const { search, category, sort, limit = null, page = 1 } = req.query;
    
    // Prepare database query options
    const queryOptions = {
      include: [{
        model: ProductCategory,
        attributes: ['name']
      }],
      where: {}
    };
    
    // Add search condition if provided
    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Add category condition if provided
    if (category) {
      queryOptions.include[0].where = { name: category };
    }
    
    // Add sorting
    if (sort === 'asc' || sort === 'desc') {
      queryOptions.order = [['price', sort.toUpperCase()]];
    }
    
    // Get products from database
    const dbProducts = await Product.findAll(queryOptions);
    
    // Transform products to match the expected format
    const formattedDbProducts = dbProducts.map(product => ({
      id: product.id,
      name: product.name,
      category: product.ProductCategory.name,
      price: parseFloat(product.price),
      image: product.image,
      description: product.description
    }));
    
    // Combine with generated products
    let filteredProducts = [...formattedDbProducts, ...generatedProducts.getAll()];
    
    // Filter generated products if search or category is provided
    if (search || category) {
      filteredProducts = filteredProducts.filter(p => {
        const matchesSearch = !search || 
                            p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !category || p.category === category;
        return matchesSearch && matchesCategory;
      });
    }
    
    // Group products by category
    const groupedByCategory = {};
    filteredProducts.forEach(product => {
      if (!groupedByCategory[product.category]) {
        groupedByCategory[product.category] = [];
      }
      groupedByCategory[product.category].push(product);
    });
    
    // Sorting by price within each category
    if (sort === 'asc' || sort === 'desc') {
      Object.keys(groupedByCategory).forEach(cat => {
        groupedByCategory[cat].sort((a, b) => 
          sort === 'asc' ? a.price - b.price : b.price - a.price
        );
      });
    }
    
    // Get categories order
    const categories = await ProductCategory.findAll({
      order: [['displayOrder', 'ASC']]
    });
    const categoryOrder = categories.map(c => c.name);
    
    // Preserve the order of products in the menu
    let orderedProducts = [];
    
    // Add products in the correct category order
    categoryOrder.forEach(categoryName => {
      if (groupedByCategory[categoryName]) {
        orderedProducts = [...orderedProducts, ...groupedByCategory[categoryName]];
      }
    });
    
    Object.keys(groupedByCategory).forEach(categoryName => {
      if (!categoryOrder.includes(categoryName)) {
        orderedProducts = [...orderedProducts, ...groupedByCategory[categoryName]];
      }
    });
    
    // Calculate total before pagination
    const total = orderedProducts.length;
    
    // Apply pagination
    let paginatedProducts = orderedProducts;
    
    if (limit !== null) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 9)); // Limit between 1 and 50
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      paginatedProducts = orderedProducts.slice(startIndex, endIndex);
    }
    
    // Include pagination metadata
    if (req.user) {
      await logActivity(req, req.user.id, 'READ', 'Product', null, 'Listed products');
    }
    
    res.status(200).json({
      products: paginatedProducts,
      totalProducts: total,
      currentPage: limit !== null ? Math.max(1, parseInt(page) || 1) : 1,
      totalPages: limit !== null ? Math.ceil(total / Math.max(1, parseInt(limit) || 9)) : 1,
      itemsPerPage: limit !== null ? Math.max(1, Math.min(50, parseInt(limit) || 9)) : total
    });
  } catch (err) {
    console.error('Error retrieving products:', err);
    res.status(500).json({ error: 'Server error while retrieving products' });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Check if it's a generated product (starts with 'gen_')
    if (id.startsWith('gen_')) {
      const generatedProduct = generatedProducts.getAll().find(p => p.id === id);
      if (generatedProduct) {
        if (req.user) {
          await logActivity(req, req.user.id, 'READ', 'Product', id, `Viewed product: ${generatedProduct.name}`);
        }
        return res.status(200).json(generatedProduct);
      }
    } else {
      // Try to find in database
      const product = await Product.findByPk(id, {
        include: [{
          model: ProductCategory,
          attributes: ['name']
        }]
      });
      
      if (product) {
        // Format the product to match the expected structure
        if (req.user) {
          await logActivity(req, req.user.id, 'READ', 'Product', id, `Viewed product: ${product.name}`);
        }
        return res.status(200).json({
          id: product.id,
          name: product.name,
          category: product.ProductCategory.name,
          price: parseFloat(product.price),
          image: product.image,
          description: product.description
        });
      }
    }
    
    // Not found in either collection
    return res.status(404).json({ message: "Product not found" });
  } catch (err) {
    console.error('Error retrieving product:', err);
    res.status(500).json({ error: 'Server error while retrieving product' });
  }
});

// Create a product
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, category, price, description, image } = req.body;
    
    // Validate inputs
    if (!name || !category || price === undefined || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = parseFloat(price);
    
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    
    // Find or create category
    let [productCategory] = await ProductCategory.findOrCreate({
      where: { name: trimmedCategory }
    });
    
    // Create product with reference to category
    const newProduct = await Product.create({
      name: trimmedName,
      price: parsedPrice,
      description: trimmedDescription,
      image: image || "/assets/add_product_main.jpg",
      ProductCategoryId: productCategory.id,
      UserId: req.user.id
    });
    
    // Log the activity
    await logActivity(
      req, 
      req.user.id, 
      'CREATE', 
      'Product', 
      newProduct.id, 
      `Created product: ${newProduct.name}`
    );
    
    // Get the product with its category for the response
    const productWithCategory = await Product.findByPk(newProduct.id, {
      include: [{
        model: ProductCategory,
        attributes: ['name']
      }]
    });
    
    // Format response to match expected structure
    const response = {
      id: productWithCategory.id,
      name: productWithCategory.name,
      category: productWithCategory.ProductCategory.name,
      price: parseFloat(productWithCategory.price),
      image: productWithCategory.image,
      description: productWithCategory.description
    };
    
    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Server error while creating product' });
  }
});

// Update a product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    
    // For generated products
    if (id.startsWith('gen_')) {
      const index = generatedProducts.getAll().findIndex(p => p.id === id);
      if (index !== -1) {
        const allProducts = generatedProducts.getAll();
        allProducts[index] = { ...allProducts[index], ...req.body };
        
        // Reset the store with updated products
        generatedProducts.clear();
        allProducts.forEach(p => generatedProducts.add(p));
        
        await logActivity(
          req, 
          req.user.id, 
          'UPDATE', 
          'Product', 
          id, 
          `Updated product: ${allProducts[index].name}`
        );
        
        return res.status(200).json(allProducts[index]);
      }
    } else {
      // Find the product in database
      const product = await Product.findByPk(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Extract update fields
      const { name, category, price, description } = req.body;
      
      // Update product fields if provided
      if (name) product.name = name.trim();
      if (price) product.price = parseFloat(price);
      if (description) product.description = description.trim();
      
      // Handle category update if provided
      if (category) {
        const [productCategory] = await ProductCategory.findOrCreate({
          where: { name: category.trim() }
        });
        product.ProductCategoryId = productCategory.id;
      }
      
      // Save the changes
      await product.save();
      
      // Get the updated product with its category for the response
      const updatedProduct = await Product.findByPk(id, {
        include: [{
          model: ProductCategory,
          attributes: ['name']
        }]
      });
      
      // Log the activity
      await logActivity(
        req, 
        req.user.id, 
        'UPDATE', 
        'Product', 
        id, 
        `Updated product: ${updatedProduct.name}`
      );
      
      // Format response to match expected structure
      const response = {
        id: updatedProduct.id,
        name: updatedProduct.name,
        category: updatedProduct.ProductCategory.name,
        price: parseFloat(updatedProduct.price),
        image: updatedProduct.image,
        description: updatedProduct.description
      };
      
      return res.status(200).json(response);
    }
    
    return res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Server error while updating product' });
  }
});

// Delete a product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    
    // For generated products
    if (id.startsWith('gen_')) {
      const allProducts = generatedProducts.getAll();
      const filteredProducts = allProducts.filter(p => p.id !== id);
      
      if (filteredProducts.length < allProducts.length) {
        // Product was found and removed
        generatedProducts.clear();
        filteredProducts.forEach(p => generatedProducts.add(p));
        
        await logActivity(
          req, 
          req.user.id, 
          'DELETE', 
          'Product', 
          id, 
          `Deleted product: ${allProducts.find(p => p.id === id).name}`
        );
        
        return res.status(204).end();
      }
    } else {
      // Delete from database
      const product = await Product.findByPk(id);
      const result = await Product.destroy({
        where: { id }
      });
      
      if (result > 0) {
        await logActivity(
          req, 
          req.user.id, 
          'DELETE', 
          'Product', 
          id, 
          `Deleted product: ${product.name}`
        );
        return res.status(204).end();
      }
    }
    
    return res.status(404).json({ message: "Product not found" });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Server error while deleting product' });
  }
});

module.exports = router;