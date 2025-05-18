const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const sequelize = require('../models/index');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

// Get category statistics (price data, counts)
router.get('/category-stats', async (req, res) => {
  // Set appropriate headers to prevent connection issues
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/json');
  
  // Add request ID for tracking
  const requestId = Date.now().toString().slice(-6);
  console.log(`[${requestId}] Starting category-stats request`);
  
  // Check if client disconnects
  let clientDisconnected = false;
  let responseSent = false;
  req.on('close', () => {
    if (!responseSent) {  // Only log if response hasn't been sent yet
      clientDisconnected = true;
      console.log(`[${requestId}] Client disconnected before response was sent`);
    }
  });

  // Set a response timeout to ensure we don't hang indefinitely
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[${requestId}] Request timed out after 20 seconds`);
      res.status(503).json({ error: 'Request timed out', requestId });
    }
  }, 20000);

  try {
    const startTime = Date.now();
    
    console.log(`[${requestId}] Fetching category statistics...`);
    
    // Use a connection from the pool for this request only
    // const transaction = await sequelize.transaction({ 
    //   isolationLevel: 'READ UNCOMMITTED' // Less strict isolation for analytics
    // });

    try {
      // query to select price distributions form products by categories with the same first letter
      const results = await sequelize.query(`
        SELECT 
          UPPER(LEFT(pc.name, 1)) AS first_letter,
          COUNT(DISTINCT pc.name) AS category_count,
          COUNT(p.id) AS product_count,
          ROUND(AVG(COALESCE(p.price, 0))::numeric, 2) AS avg_price,
          MIN(NULLIF(p.price, 0)) AS min_price,
          MAX(p.price) AS max_price,
          SUM(COALESCE(p.price, 0)) AS total_price_sum
        FROM 
          "ProductCategories" pc
        LEFT JOIN 
          "Products" p ON pc.id = p."ProductCategoryId"
        GROUP BY 
          UPPER(LEFT(pc.name, 1))
        ORDER BY 
          first_letter
      `, { 
        type: QueryTypes.SELECT,
        raw: true
      });
      
      const countResult = await sequelize.query(
        'SELECT COUNT(*) as count FROM "Products"', 
        { 
          type: QueryTypes.SELECT, 
          plain: true
        }
      );
          
      // await transaction.commit();
      
      const totalProducts = parseInt(countResult.count) || 0;
      
      // Check if client is still connected before sending response
      if (clientDisconnected) {
        console.log(`[${requestId}] Client disconnected, skipping response`);
        clearTimeout(responseTimeout);
        return;
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Create response object
      const response = {
        executionTime: `${executionTime}ms`,
        totalCategories: results.length,
        totalProducts,
        categories: results
      };
      
      // Clear timeout as we're about to respond
      clearTimeout(responseTimeout);

      // Modify your listener in the category-stats route
      
      // Send response
      res.status(200).json(response);
      responseSent = true;
      console.log(`[${requestId}] Query completed in ${executionTime}ms - sent response`);
      
    } catch (queryErr) {
      // Rollback transaction if there was an error
      // await transaction.rollback();
      
      clearTimeout(responseTimeout);
      
      if (!clientDisconnected && !res.headersSent) {
        console.error(`[${requestId}] Error during query: ${queryErr.message}`);
        res.status(500).json({ 
          error: 'Database query error', 
          message: queryErr.message,
          requestId
        });
      }
    }
    
  } catch (err) {
    clearTimeout(responseTimeout);
    
    if (!clientDisconnected && !res.headersSent) {
      console.error(`[${requestId}] Error fetching category statistics: ${err.message}`);
      res.status(500).json({ 
        error: 'Server error', 
        details: err.message,
        requestId
      });
    }
  }
});

// Add a simple health endpoint for testing
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

module.exports = router;