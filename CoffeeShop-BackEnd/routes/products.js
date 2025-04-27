const express = require('express');
const router = express.Router();
const initialProducts = require('../data/initialProducts');
const { generatedProducts } = require('../websocketServer');

let products = [...initialProducts];

// Helper function to get all products including generated ones
const getAllProducts = () => {
    return [...products, ...generatedProducts.getAll()];
};

// get all products with filters
router.get('/', (req, res) => {
    // Parse pagination parameters with proper defaults
    const { search, category, sort, limit = null, page = 1 } = req.query;
    
    // Combine regular products with generated ones
    let filteredProducts = getAllProducts();

    // search filter
    if (search) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    }

    // category filter
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // keep the products in the menu grouped by category
    const groupedByCategory = {};
    filteredProducts.forEach(product => {
        if (!groupedByCategory[product.category]) {
            groupedByCategory[product.category] = [];
        }
        groupedByCategory[product.category].push(product);
    });
    
    // sorting by category
    if (sort === 'asc' || sort === 'desc') {
        Object.keys(groupedByCategory).forEach(cat => {
            groupedByCategory[cat].sort((a, b) => 
                sort === 'asc' ? a.price - b.price : b.price - a.price
            );
        });
    }
    
    // preserve the order of products in the menu
    let orderedProducts = [];
    const categoryOrder = ["Classic Coffee", "Specialty Drinks", "Cold Brews", "Teas"];
    
    // add products in the correct category order
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
    
    // Apply pagination only if limit is specified
    let paginatedProducts = orderedProducts;
    
    if (limit !== null) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 9)); // Limit between 1 and 50, default to 9 if parsed as 0
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        paginatedProducts = orderedProducts.slice(startIndex, endIndex);
    }
    
    // Include pagination metadata
    res.status(200).json({
        products: paginatedProducts,
        totalProducts: total,
        currentPage: limit !== null ? Math.max(1, parseInt(page) || 1) : 1,
        totalPages: limit !== null ? Math.ceil(total / Math.max(1, parseInt(limit) || 9)) : 1,
        itemsPerPage: limit !== null ? Math.max(1, Math.min(50, parseInt(limit) || 9)) : total
    });
});

// get all categories
router.get('/categories', (req, res) => {
    // Get unique categories from both regular and generated products
    const allCategories = [...new Set(getAllProducts().map(product => product.category))];
    
    // Sort according to desired order
    const categoryOrder = ["Classic Coffee", "Specialty Drinks", "Cold Brews", "Teas"];
    
    allCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b);
    });
    
    res.status(200).json(allCategories);
});

// get a specific product by id
router.get('/:id', (req, res) => {
    const id = req.params.id;
    
    // Check if it's a generated product (starts with 'gen_')
    if (id.startsWith('gen_')) {
        const generatedProduct = generatedProducts.getAll().find(p => p.id === id);
        if (generatedProduct) {
            return res.status(200).json(generatedProduct);
        }
    } else {
        // Try to find in regular products
        const product = products.find(p => p.id.toString() === id);
        if (product) {
            return res.status(200).json(product);
        }
    }
    
    // Not found in either collection
    return res.status(404).json({ message: "Product not found" });
});

// create a new product
router.post('/', (req, res) => {
    const newProduct = { 
        ...req.body, 
        id: Math.max(0, ...products.map(p => parseInt(p.id))) + 1 
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// update a product
router.put('/:id', (req, res) => {
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
            
            return res.status(200).json(allProducts[index]);
        }
    } else {
        // For regular products
        const index = products.findIndex(p => p.id.toString() === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...req.body };
            return res.status(200).json(products[index]);
        }
    }
    
    return res.status(404).json({ message: "Product not found" });
});

// delete a product
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    // For generated products
    if (id.startsWith('gen_')) {
        const allProducts = generatedProducts.getAll();
        const filteredProducts = allProducts.filter(p => p.id !== id);
        
        if (filteredProducts.length < allProducts.length) {
            // Product was found and removed
            generatedProducts.clear();
            filteredProducts.forEach(p => generatedProducts.add(p));
            return res.status(200).json({ message: "Product deleted" });
        }
    } else {
        // For regular products
        const initialLength = products.length;
        products = products.filter(p => p.id.toString() !== id);
        
        if (products.length < initialLength) {
            // Product was found and removed
            return res.status(200).json({ message: "Product deleted" });
        }
    }
    
    return res.status(404).json({ message: "Product not found" });
});

module.exports = router;