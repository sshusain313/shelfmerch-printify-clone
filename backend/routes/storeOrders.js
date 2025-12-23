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

// @route   GET /api/store-orders/admin/stats
// @desc    Get dashboard statistics for superadmins
// @access  Private (superadmin)
router.get('/admin/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Revenue and Order counts
    const statsResult = await StoreOrder.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                }
              }
            }
          ],
          monthly: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: null,
                monthlyRevenue: { $sum: '$total' },
                monthlyOrders: { $sum: 1 }
              }
            }
          ],
          topProducts: [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.storeProductId',
                productName: { $first: '$items.productName' },
                mockupUrl: { $first: '$items.mockupUrl' },
                salesCount: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
              }
            },
            { $sort: { salesCount: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const stats = statsResult[0];
    const overall = stats.overall[0] || { totalRevenue: 0, totalOrders: 0, deliveredOrders: 0 };
    const monthly = stats.monthly[0] || { monthlyRevenue: 0, monthlyOrders: 0 };
    const topProducts = stats.topProducts || [];

    return res.json({
      success: true,
      data: {
        totalRevenue: overall.totalRevenue,
        totalOrders: overall.totalOrders,
        deliveredOrders: overall.deliveredOrders,
        monthlyRevenue: monthly.monthlyRevenue,
        monthlyOrders: monthly.monthlyOrders,
        topProducts: topProducts
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin statistics' });
  }
});

module.exports = router;
