const express = require('express');
const router = express.Router();
const { CartItem, Product, ProductCategory } = require('../models/relationships');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// Get user's cart
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot have a shopping cart' });
    }

    const cartItems = await CartItem.findAll({
      where: { UserId: req.user.id },
      include: [{
        model: Product,
        include: [{
          model: ProductCategory,
          attributes: ['name']
        }]
      }],
      order: [['createdAt', 'ASC']]
    });

    const formattedCart = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: parseFloat(item.price),
      subtotal: parseFloat(item.quantity * item.price),
      product: {
        id: item.Product.id,
        name: item.Product.name,
        category: item.Product.ProductCategory.name,
        price: parseFloat(item.Product.price),
        image: item.Product.image,
        description: item.Product.description
      }
    }));

    const total = formattedCart.reduce((sum, item) => sum + item.subtotal, 0);

    res.status(200).json({
      items: formattedCart,
      total: parseFloat(total.toFixed(2)),
      itemCount: cartItems.length
    });
  } catch (err) {
    console.error('Error retrieving cart:', err);
    res.status(500).json({ error: 'Server error while retrieving cart' });
  }
});

// Add item to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot add items to cart' });
    }

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      where: {
        UserId: req.user.id,
        ProductId: productId
      }
    });

    if (existingCartItem) {
      // Update existing item
      existingCartItem.quantity += parseInt(quantity);
      await existingCartItem.save();

      await logActivity(
        req,
        req.user.id,
        'UPDATE',
        'CartItem',
        existingCartItem.id,
        `Updated cart item: ${product.name} (quantity: ${existingCartItem.quantity})`
      );

      res.status(200).json({
        message: 'Cart updated successfully',
        item: {
          id: existingCartItem.id,
          quantity: existingCartItem.quantity,
          subtotal: parseFloat(existingCartItem.quantity * existingCartItem.price)
        }
      });
    } else {
      // Create new cart item
      const cartItem = await CartItem.create({
        UserId: req.user.id,
        ProductId: productId,
        quantity: parseInt(quantity),
        price: product.price
      });

      await logActivity(
        req,
        req.user.id,
        'CREATE',
        'CartItem',
        cartItem.id,
        `Added to cart: ${product.name} (quantity: ${quantity})`
      );

      res.status(201).json({
        message: 'Item added to cart successfully',
        item: {
          id: cartItem.id,
          quantity: cartItem.quantity,
          subtotal: parseFloat(cartItem.quantity * cartItem.price)
        }
      });
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Server error while adding to cart' });
  }
});

// Update cart item quantity
router.put('/update/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot modify cart' });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const cartItem = await CartItem.findOne({
      where: {
        id: id,
        UserId: req.user.id
      },
      include: [Product]
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    cartItem.quantity = parseInt(quantity);
    await cartItem.save();

    await logActivity(
      req,
      req.user.id,
      'UPDATE',
      'CartItem',
      cartItem.id,
      `Updated cart item: ${cartItem.Product.name} (quantity: ${quantity})`
    );

    res.status(200).json({
      message: 'Cart item updated successfully',
      item: {
        id: cartItem.id,
        quantity: cartItem.quantity,
        subtotal: parseFloat(cartItem.quantity * cartItem.price)
      }
    });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ error: 'Server error while updating cart item' });
  }
});

// Remove item from cart
router.delete('/remove/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot modify cart' });
    }

    const { id } = req.params;

    const cartItem = await CartItem.findOne({
      where: {
        id: id,
        UserId: req.user.id
      },
      include: [Product]
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const productName = cartItem.Product.name;
    await cartItem.destroy();

    await logActivity(
      req,
      req.user.id,
      'DELETE',
      'CartItem',
      id,
      `Removed from cart: ${productName}`
    );

    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ error: 'Server error while removing cart item' });
  }
});

// Clear entire cart
router.delete('/clear', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot modify cart' });
    }

    const deletedCount = await CartItem.destroy({
      where: { UserId: req.user.id }
    });

    await logActivity(
      req,
      req.user.id,
      'DELETE',
      'Cart',
      null,
      `Cleared cart (${deletedCount} items removed)`
    );

    res.status(200).json({ 
      message: 'Cart cleared successfully',
      itemsRemoved: deletedCount
    });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Server error while clearing cart' });
  }
});

module.exports = router;
