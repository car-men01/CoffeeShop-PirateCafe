const express = require('express');
const router = express.Router();
const { Order, OrderItem, CartItem, Product, ProductCategory, User } = require('../models/relationships');
const { authenticate, adminOnly } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');
const sequelize = require('../models/index');

// Get user's orders (for regular users)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Use /admin endpoint for admin access' });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.findAndCountAll({
      where: { UserId: req.user.id },
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'image']
        }]
      }],
      order: [['orderDate', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const formattedOrders = orders.rows.map(order => ({
      id: order.id,
      status: order.status,
      total: parseFloat(order.total),
      orderDate: order.orderDate,
      estimatedTime: order.estimatedTime,
      notes: order.notes,
      items: order.OrderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.quantity * item.price),
        productName: item.productName,
        productImage: item.productImage,
        product: item.Product ? {
          id: item.Product.id,
          name: item.Product.name,
          image: item.Product.image
        } : null
      }))
    }));

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.count / parseInt(limit)),
        totalOrders: orders.count,
        hasNext: offset + parseInt(limit) < orders.count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Error retrieving orders:', err);
    res.status(500).json({ error: 'Server error while retrieving orders' });
  }
});

// Get all orders (for admin)
router.get('/admin', authenticate, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (userId) {
      whereClause.UserId = parseInt(userId);
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        },
        {
          model: OrderItem,
          include: [{
            model: Product,
            attributes: ['id', 'name', 'image']
          }]
        }
      ],
      order: [['orderDate', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const formattedOrders = orders.rows.map(order => ({
      id: order.id,
      status: order.status,
      total: parseFloat(order.total),
      orderDate: order.orderDate,
      estimatedTime: order.estimatedTime,
      notes: order.notes,
      user: {
        id: order.User.id,
        username: order.User.username,
        email: order.User.email
      },
      items: order.OrderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.quantity * item.price),
        productName: item.productName,
        productImage: item.productImage,
        product: item.Product ? {
          id: item.Product.id,
          name: item.Product.name,
          image: item.Product.image
        } : null
      }))
    }));

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.count / parseInt(limit)),
        totalOrders: orders.count,
        hasNext: offset + parseInt(limit) < orders.count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Error retrieving admin orders:', err);
    res.status(500).json({ error: 'Server error while retrieving orders' });
  }
});

// Get specific order details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const whereClause = { id: id };
    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      whereClause.UserId = req.user.id;
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        },
        {
          model: OrderItem,
          include: [{
            model: Product,
            attributes: ['id', 'name', 'image']
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const formattedOrder = {
      id: order.id,
      status: order.status,
      total: parseFloat(order.total),
      orderDate: order.orderDate,
      estimatedTime: order.estimatedTime,
      notes: order.notes,
      user: req.user.role === 'admin' ? {
        id: order.User.id,
        username: order.User.username,
        email: order.User.email
      } : null,
      items: order.OrderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.quantity * item.price),
        productName: item.productName,
        productImage: item.productImage,
        product: item.Product ? {
          id: item.Product.id,
          name: item.Product.name,
          image: item.Product.image
        } : null
      }))
    };

    res.status(200).json(formattedOrder);
  } catch (err) {
    console.error('Error retrieving order:', err);
    res.status(500).json({ error: 'Server error while retrieving order' });
  }
});

// Create order from cart
router.post('/create', authenticate, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (req.user.role === 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Admins cannot place orders' });
    }

    const { notes } = req.body;

    // Get user's cart items
    const cartItems = await CartItem.findAll({
      where: { UserId: req.user.id },
      include: [Product],
      transaction
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Check user balance if they have one
    const user = await User.findByPk(req.user.id, { transaction });
    if (user.balance !== null && parseFloat(user.balance) < total) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: parseFloat(total.toFixed(2)),
        available: parseFloat(user.balance)
      });
    }

    // Create order
    const order = await Order.create({
      UserId: req.user.id,
      total: total,
      notes: notes || null,
      estimatedTime: Math.ceil(cartItems.length * 3) // 3 minutes per item estimate
    }, { transaction });

    // Create order items
    const orderItems = [];
    for (const cartItem of cartItems) {
      const orderItem = await OrderItem.create({
        OrderId: order.id,
        ProductId: cartItem.ProductId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        productName: cartItem.Product.name,
        productImage: cartItem.Product.image
      }, { transaction });
      orderItems.push(orderItem);
    }

    // Deduct from user balance if they have one
    if (user.balance !== null) {
      user.balance = parseFloat(user.balance) - total;
      await user.save({ transaction });
    }

    // Clear cart
    await CartItem.destroy({
      where: { UserId: req.user.id },
      transaction
    });

    await transaction.commit();

    // Log activity
    await logActivity(
      req,
      req.user.id,
      'CREATE',
      'Order',
      order.id,
      `Placed order #${order.id} - Total: $${total.toFixed(2)}`
    );

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order.id,
        status: order.status,
        total: parseFloat(order.total),
        orderDate: order.orderDate,
        estimatedTime: order.estimatedTime,
        notes: order.notes,
        itemCount: orderItems.length
      },
      remainingBalance: user.balance !== null ? parseFloat(user.balance) : null
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Server error while creating order' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required',
        validStatuses: validStatuses
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    await logActivity(
      req,
      req.user.id,
      'UPDATE',
      'Order',
      id,
      `Order status changed from ${oldStatus} to ${status}`
    );

    res.status(200).json({
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        status: order.status,
        previousStatus: oldStatus
      }
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Server error while updating order status' });
  }
});

// Cancel order (user can cancel own orders if pending/confirmed)
router.put('/:id/cancel', authenticate, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    
    const whereClause = { id: id };
    // Regular users can only cancel their own orders
    if (req.user.role !== 'admin') {
      whereClause.UserId = req.user.id;
    }

    const order = await Order.findOne({
      where: whereClause,
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Order cannot be cancelled',
        currentStatus: order.status
      });
    }

    const oldStatus = order.status;
    order.status = 'cancelled';
    await order.save({ transaction });

    // Refund to user balance if they have one
    const user = await User.findByPk(order.UserId, { transaction });
    if (user.balance !== null) {
      user.balance = parseFloat(user.balance) + parseFloat(order.total);
      await user.save({ transaction });
    }

    await transaction.commit();

    await logActivity(
      req,
      req.user.id,
      'UPDATE',
      'Order',
      id,
      `Order cancelled (was ${oldStatus}) - Refund: $${order.total}`
    );

    res.status(200).json({
      message: 'Order cancelled successfully',
      order: {
        id: order.id,
        status: order.status,
        refunded: parseFloat(order.total)
      },
      newBalance: user.balance !== null ? parseFloat(user.balance) : null
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Server error while cancelling order' });
  }
});

module.exports = router;
