const express = require('express');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
const Store = require('../models/Store');
const StoreCustomer = require('../models/StoreCustomer');
const StoreOrder = require('../models/StoreOrder');
const StoreProduct = require('../models/StoreProduct');
const CatalogProduct = require('../models/CatalogProduct');
const FulfillmentInvoice = require('../models/FulfillmentInvoice');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return null;
  }

  return new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
};

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

/**
 * Helper to generate Fulfillment Invoice for the Merchant
 */
const generateFulfillmentInvoice = async (order) => {
  try {
    console.log(`[Invoice] Generating fulfillment invoice for order ${order._id}`);

    // 1. Get Store information (to get merchant reference)
    const store = await Store.findById(order.storeId);
    if (!store) throw new Error('Store not found for invoice generation');

    const invoiceItems = [];
    let totalProductionCost = 0;

    // 2. Map order items to production costs
    for (const item of order.items) {
      const storeProduct = await StoreProduct.findById(item.storeProductId);
      if (!storeProduct) {
        console.warn(`[Invoice] StoreProduct ${item.storeProductId} not found, skipping item cost`);
        continue;
      }

      const catalogProduct = await CatalogProduct.findById(storeProduct.catalogProductId);
      if (!catalogProduct) {
        console.warn(`[Invoice] CatalogProduct ${storeProduct.catalogProductId} not found, skipping item cost`);
        continue;
      }

      const itemProductionCost = catalogProduct.basePrice * item.quantity;
      totalProductionCost += itemProductionCost;

      invoiceItems.push({
        productName: item.productName,
        quantity: item.quantity,
        productionCost: catalogProduct.basePrice,
        variant: item.variant
      });
    }

    // 3. Create FulfillmentInvoice
    // Merchant's shipping cost (ShelfMerch might charge differently than what merchant charges customer)
    // For now, let's say merchant pays same shipping or a base warehouse fee
    const merchantShippingCost = order.shipping * 0.8; // Example: merchant pays 80% of what customer paid for shipping as raw cost
    const tax = totalProductionCost * 0.12; // Example tax rate
    const grandTotal = totalProductionCost + merchantShippingCost + tax;

    const invoice = await FulfillmentInvoice.create({
      merchantId: order.merchantId,
      storeId: order.storeId,
      orderId: order._id,
      items: invoiceItems,
      productionCost: totalProductionCost,
      shippingCost: merchantShippingCost,
      tax: tax,
      totalAmount: grandTotal,
      status: 'pending'
    });

    console.log(`[Invoice] ✓ Fulfillment invoice ${invoice.invoiceNumber} created`);
    return invoice;
  } catch (err) {
    console.error('[Invoice] ✗ Error generating fulfillment invoice:', err);
    // Don't throw, we don't want to break the checkout if invoice generation fails
  }
};

// POST /api/store-checkout/:subdomain
// Authenticated endpoint used by storefront checkout to create an order
router.post('/:subdomain', verifyStoreToken, async (req, res) => {
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

// Helper function to compute order totals (reusable)
const computeOrderTotals = (cart, shipping = 0, tax = null) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
    0
  );
  const calculatedTax = tax !== null ? tax : subtotal * 0.08;
  const total = subtotal + shipping + calculatedTax;
  return { subtotal, shipping, tax: calculatedTax, total };
};

// POST /api/store-checkout/:subdomain/razorpay/create-order
// Create a Razorpay order for payment
router.post('/:subdomain/razorpay/create-order', verifyStoreToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { cart, shippingInfo, shipping = 0, tax = null } = req.body || {};

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

    // Verify customer belongs to this store
    const customerIdFromToken = req.customer?.customer?.id;
    const storeIdFromToken = req.customer?.customer?.storeId;

    if (!customerIdFromToken || !storeIdFromToken) {
      return res.status(401).json({ success: false, message: 'Invalid customer authentication' });
    }

    if (String(storeIdFromToken) !== String(store._id)) {
      return res.status(403).json({ success: false, message: 'Customer does not belong to this store' });
    }

    // Check if Razorpay is configured
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact store owner.'
      });
    }

    // Compute order totals
    const { subtotal, shipping: finalShipping, tax: finalTax, total } = computeOrderTotals(cart, shipping, tax);

    // Create Razorpay order
    // Amount should be in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(total * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}_${subdomain}`,
      notes: {
        subdomain,
        customerId: customerIdFromToken.toString(),
        storeId: store._id.toString(),
      },
    });

    // Return Razorpay order and key ID
    return res.status(200).json({
      success: true,
      data: {
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
});

// POST /api/store-checkout/:subdomain/razorpay/verify-payment
// Verify Razorpay payment signature and create order
router.post('/:subdomain/razorpay/verify-payment', verifyStoreToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const {
      cart,
      shippingInfo,
      shipping = 0,
      tax = null,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingInfo) {
      return res.status(400).json({ success: false, message: 'Missing shipping information' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const store = await Store.findOne({ slug: subdomain, isActive: true }).lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const merchantId = store.merchant;

    // Verify customer belongs to this store
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

    // Verify Razorpay payment signature
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    // Generate signature for verification
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Compute order totals (should match the order used for Razorpay)
    const { subtotal, shipping: finalShipping, tax: finalTax, total } = computeOrderTotals(cart, shipping, tax);

    // Build order items
    const orderItems = cart.map((item) => ({
      storeProductId: item.product?.id || item.product?._id || undefined,
      productName: item.product?.name,
      mockupUrl: item.product?.mockupUrls?.[0] || item.product?.mockupUrl,
      mockupUrls: item.product?.mockupUrls || [],
      quantity: item.quantity,
      price: item.product?.price,
      variant: item.variant,
    }));

    // Create order with payment details
    const order = await StoreOrder.create({
      merchantId,
      storeId: store._id,
      customerId: customer._id,
      customerEmail: customer.email,
      items: orderItems,
      subtotal,
      shipping: finalShipping,
      tax: finalTax,
      total,
      shippingAddress: shippingInfo,
      status: 'paid', // Payment verified, mark as paid
      payment: {
        method: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    // Trigger fulfillment invoice generation for the merchant
    generateFulfillmentInvoice(order);

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Razorpay verify-payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment and create order'
    });
  }
});

module.exports = router;
