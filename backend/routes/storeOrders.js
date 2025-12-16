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

// @route   PATCH /api/store-orders/:id/status
// @desc    Update order status (superadmin only)
// @access  Private (superadmin)
router.patch('/:id/status', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const allowedStatuses = ['on-hold', 'in-production', 'shipped', 'delivered', 'refunded', 'cancelled'];
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
