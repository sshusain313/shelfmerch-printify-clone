const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Store = require('../models/Store');
const StoreCustomer = require('../models/StoreCustomer');
const StoreOrder = require('../models/StoreOrder');

// Middleware to verify Store Customer token (same structure as storeAuth)
const verifyStoreToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No auth token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded: { customer: { id, storeId } }
    req.customer = decoded;
    next();
  } catch (err) {
    console.error('store-checkout auth error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// POST /api/store-checkout/:subdomain
// Authenticated endpoint used by storefront checkout to create an order
router.post('/store-checkout/:subdomain', verifyStoreToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { cart, shippingInfo } = req.body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingInfo) {
      return res.status(400).json({ success: false, message: 'Missing shipping information' });
    }

    const store = await Store.findOne({ slug: subdomain, isActive: true }).lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const merchantId = store.merchant;

    // 1) Resolve authenticated StoreCustomer from token
    const customerIdFromToken = req.customer?.customer?.id;
    const storeIdFromToken = req.customer?.customer?.storeId;

    if (!customerIdFromToken || !storeIdFromToken) {
      return res.status(401).json({ success: false, message: 'Invalid customer authentication' });
    }

    if (String(storeIdFromToken) !== String(store._id)) {
      return res.status(403).json({ success: false, message: 'Customer does not belong to this store' });
    }

    const customer = await StoreCustomer.findById(customerIdFromToken);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.lastSeenAt = new Date();
    await customer.save();

    // 2) Compute totals (mirror frontend for now)
    const subtotal = cart.reduce(
      (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
      0
    );
    const shipping = cart.length > 0 ? 5.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // 3) Build order items
    const orderItems = cart.map((item) => ({
      storeProductId: item.product?.id || item.product?._id || undefined,
      productName: item.product?.name,
      mockupUrl: item.product?.mockupUrls?.[0] || item.product?.mockupUrl,
      mockupUrls: item.product?.mockupUrls || [],
      quantity: item.quantity,
      price: item.product?.price,
      variant: item.variant,
    }));

    const order = await StoreOrder.create({
      merchantId,
      storeId: store._id,
      customerId: customer._id,
      customerEmail: customer.email,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: shippingInfo,
    });

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('store-checkout error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

module.exports = router;
