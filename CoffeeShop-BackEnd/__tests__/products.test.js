const request = require('supertest');
const express = require('express');
const productRoutes = require('../routes/products');

// Mock the initial products data
jest.mock('../data/initialProducts', () => [
  { id: 1, name: "Test Espresso", category: "Classic Coffee", price: 5, image: "/assets/espresso.jpg", description: "Test description" },
  { id: 2, name: "Test Americano", category: "Classic Coffee", price: 3.9, image: "/assets/americano.png", description: "Test description" }
]);

// test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/products', productRoutes);
  return app;
}

describe('Product Routes', () => {
    let app;
    //create a new app for each test to reset state
    beforeEach(() => {
        app = createTestApp();
        // clear module cache to reset products array between tests
        jest.resetModules();
  });

  describe('GET /products', () => {
    it('return all products when no filters are applied', async () => {
      const response = await request(app).get('/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBe(2);
    });

    it('filter products by search keyword', async () => {
      const response = await request(app).get('/products?search=Espresso');
      
      expect(response.status).toBe(200);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Test Espresso');
    });

    it('filter products by category', async () => {
      const response = await request(app).get('/products?category=Classic Coffee');
      
      expect(response.status).toBe(200);
      expect(response.body.products.length).toBe(2);
    });

    it('sort products by price ascending', async () => {
      const response = await request(app).get('/products?sort=asc');
      
      expect(response.status).toBe(200);
      expect(response.body.products[0].price).toBeLessThan(response.body.products[1].price);
    });

    it('sort products by price descending', async () => {
      const response = await request(app).get('/products?sort=desc');
      
      expect(response.status).toBe(200);
      expect(response.body.products[0].price).toBeGreaterThan(response.body.products[1].price);
    });
  });

  describe('GET /products/:id', () => {
    it('return a product with the given ID', async () => {
      const response = await request(app).get('/products/1');
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Test Espresso');
    });

    it('return 404 for non-existent product', async () => {
      const response = await request(app).get('/products/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /products', () => {
    it('add a new product to the menu', async () => {
      const newProduct = {
        name: 'New Product',
        category: 'New Category',
        price: 7.5,
        description: 'New product description'
      };

      const response = await request(app)
        .post('/products')
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.price).toBe(newProduct.price);
      
      const getAllResponse = await request(app).get('/products');
      expect(getAllResponse.body.products.length).toBe(3);
    });

    it('validate all required fields are filled', async () => {
      const invalidProduct = {
        name: 'Missing Fields'
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('validate minimum length requirements', async () => {
      const invalidProduct = {
        name: 'AB', // Too short
        category: 'OK',
        price: 5,
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('validate price is a positive number', async () => {
      const invalidProduct = {
        name: 'Valid Name',
        category: 'OK',
        price: -5, // Negative price
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('validate that name and category contain no numbers', async () => {
      const invalidProduct = {
        name: 'Product 123', // Contains numbers
        category: 'Valid Category',
        price: 5,
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /products/:id', () => {
    it('update an existing product from the menu', async () => {
      const updatedFields = {
        name: 'Updated Espresso',
        price: 6.5
      };

      const response = await request(app)
        .put('/products/1')
        .send(updatedFields);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedFields.name);
      expect(response.body.price).toBe(updatedFields.price);
      
      const getResponse = await request(app).get('/products/1');
      expect(getResponse.body.name).toBe(updatedFields.name);
    });

    it('return 404 for non-existent product when trying to update', async () => {
      const response = await request(app)
        .put('/products/999')
        .send({ name: 'Updated Name' });
      
      expect(response.status).toBe(404);
    });

    it('validate updated fields', async () => {
      const invalidUpdate = {
        name: 'A' // Too short
      };

      const response = await request(app)
        .put('/products/1')
        .send(invalidUpdate);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /products/:id', () => {
    it('delete a product from the menu', async () => {
      const response = await request(app).delete('/products/1');
      
      expect(response.status).toBe(204);
      
      const getResponse = await request(app).get('/products/1');
      expect(getResponse.status).toBe(404);
      
      const getAllResponse = await request(app).get('/products');
      expect(getAllResponse.body.products.length).toBe(2);
    });

    it('return 404 for non-existent product when trying to delete', async () => {
      const response = await request(app).delete('/products/999');
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /products/categories', () => {
    it('return all unique categories', async () => {
      const response = await request(app).get('/products/categories');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('Classic Coffee');
    });
  });
});