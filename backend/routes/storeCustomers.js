const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const StoreCustomer = require('../models/StoreCustomer');
const StoreOrder = require('../models/StoreOrder');

const router = express.Router();

// Helper function to fetch customers for a store
const fetchCustomersForStore = async (storeId, merchantId) => {
  // Ensure we only return customers for stores owned by this merchant
  const customers = await StoreCustomer.find({
    storeId,
    merchantId,
  }).lean();

  if (!customers.length) {
    return [];
  }

  const customerIds = customers.map((c) => c._id);

  const ordersAgg = await StoreOrder.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        merchantId: new mongoose.Types.ObjectId(merchantId),
        customerId: { $in: customerIds },
      },
    },
    {
      $group: {
        _id: '$customerId',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $ifNull: ['$total', 0] } },
      },
    },
  ]);

  const ordersByCustomer = ordersAgg.reduce((acc, row) => {
    acc[row._id.toString()] = row;
    return acc;
  }, {});

  const result = customers.map((customer) => {
    const agg = ordersByCustomer[customer._id.toString()] || { orderCount: 0, totalSpent: 0 };
    return {
      id: customer._id,
      email: customer.email,
      name: customer.name,
      lastSeenAt: customer.lastSeenAt,
      createdAt: customer.createdAt,
      orderCount: agg.orderCount,
      totalSpent: agg.totalSpent,
    };
  });

  return result;
};

// GET /api/store-customers?storeId=...
// Returns aggregate customers for a given store owned by the current merchant
router.get('/', protect, async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const merchantId = req.user.id || req.user._id;
    const result = await fetchCustomersForStore(storeId, merchantId);

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error fetching store customers:', err);
    return res.status(500).json({ success: false, message: 'Error fetching store customers' });
  }
});

// GET /api/store-customers/store/:storeId
// Alternative route that matches frontend API call
router.get('/store/:storeId', protect, async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const merchantId = req.user.id || req.user._id;
    const result = await fetchCustomersForStore(storeId, merchantId);

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error fetching store customers:', err);
    return res.status(500).json({ success: false, message: 'Error fetching store customers' });
  }
});

module.exports = router;
