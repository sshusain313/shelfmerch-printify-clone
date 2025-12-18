const express = require('express');
const router = express.Router();
const StoreOrder = require('../models/StoreOrder');
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/store-orders
// @desc    List store orders for current merchant (all their stores)
//         Superadmin sees all orders across all active stores
// @access  Private (merchant, superadmin)
router.get('/', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const user = req.user;

    // Superadmin can see all orders; merchants only their own
    const storeFilter = user.role === 'superadmin' ? {} : { merchant: user._id };

    const stores = await Store.find({ ...storeFilter, isActive: true }, { _id: 1 });
    const storeIds = stores.map((s) => s._id);

    const orders = await StoreOrder.find({ storeId: { $in: storeIds } })
      .sort({ createdAt: -1 })
      .populate('storeId', 'name')
      .lean();

    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error listing store orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to list store orders' });
  }
});

// @route   GET /api/store-orders/:id
// @desc    Get single order details with storeProduct designData populated
// @access  Private (merchant, superadmin)
router.get('/:id', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await StoreOrder.findById(id)
      .populate('storeId', 'name')
      .populate({
        path: 'items.storeProductId',
        select: 'title description designData galleryImages sellingPrice'
      });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Merchants can only see orders for their own stores
    if (user.role !== 'superadmin') {
      const store = await Store.findById(order.storeId);
      if (!store || String(store.merchant) !== String(user._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
      }
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching store order details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

// @route   PATCH /api/store-orders/:id/status
// @desc    Update order status (superadmin only)
// @access  Private (superadmin)
router.patch('/:id/status', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    // Keep in sync with StoreOrder schema enum
    const allowedStatuses = ['on-hold', 'paid', 'in-production', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'refunded'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await StoreOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    return res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating store order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

module.exports = router;
