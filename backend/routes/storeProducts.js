const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const StoreProductVariant = require('../models/StoreProductVariant');

// @route   POST /api/store-products
// @desc    Create or update a store product with design data, and optional variants
// @access  Private (merchant, superadmin)
router.post('/', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const {
      storeId,          // optional; if not provided, resolve the first active store for this merchant
      storeSlug,        // optional alternative to storeId
      catalogProductId, // required
      sellingPrice,     // required
      compareAtPrice,   // optional
      title,            // optional override
      description,      // optional override
      tags,             // optional
      galleryImages,    // optional
      designData,       // optional object from editor
      variants          // optional: [{ catalogProductVariantId, sku, sellingPrice, isActive }]
    } = req.body;

    if (!catalogProductId || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'catalogProductId and sellingPrice are required' });
    }

    // Resolve store
    let store = null;
    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ success: false, message: 'Invalid storeId' });
      }
      store = await Store.findById(storeId);
    } else if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug, isActive: true });
    } else {
      // default to first active native store of merchant
      store = await Store.findOne({ merchant: req.user._id, isActive: true, type: 'native' }).sort({ createdAt: 1 });
    }

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Authorization: merchants can only write to their own stores
    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this store' });
    }

    // Upsert StoreProduct (unique by storeId+catalogProductId)
    const spFilter = { storeId: store._id, catalogProductId };
    const spUpdate = {
      $set: {
        storeId: store._id,
        catalogProductId,
        sellingPrice,
        ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(Array.isArray(tags) ? { tags } : {}),
        ...(Array.isArray(galleryImages) ? { galleryImages } : {}),
        ...(designData ? { designData } : {}),
        isActive: true,
      },
    };

    const storeProduct = await StoreProduct.findOneAndUpdate(spFilter, spUpdate, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    let createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      // Upsert each variant for this store product
      createdVariants = await Promise.all(variants.map(async (v) => {
        if (!v.catalogProductVariantId || !v.sku) return null;
        const vpFilter = { storeProductId: storeProduct._id, catalogProductVariantId: v.catalogProductVariantId };
        const vpUpdate = {
          $set: {
            storeProductId: storeProduct._id,
            catalogProductVariantId: v.catalogProductVariantId,
            sku: v.sku,
            ...(v.sellingPrice !== undefined ? { sellingPrice: v.sellingPrice } : {}),
            ...(v.isActive !== undefined ? { isActive: v.isActive } : {}),
          },
        };
        return await StoreProductVariant.findOneAndUpdate(vpFilter, vpUpdate, { new: true, upsert: true, setDefaultsOnInsert: true });
      }));
      createdVariants = createdVariants.filter(Boolean);
    }

    return res.status(201).json({
      success: true,
      message: 'Store product saved',
      data: {
        storeProduct,
        variants: createdVariants,
      },
    });
  } catch (error) {
    console.error('Error saving store product:', error);
    return res.status(500).json({ success: false, message: 'Failed to save store product', error: error.message });
  }
});

// @route   GET /api/store-products/public/:storeId
// @desc    List all public, active, published products for a specific store
// @access  Public
router.get('/public/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid store ID' });
    }

    const products = await StoreProduct.find({
      storeId: storeId,
      isActive: true,
      status: 'published',
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Optionally populate catalog data if needed for the list view (e.g. min price from variants)
    // For now returning basic product info is usually enough for the grid

    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error listing public store products:', error);
    return res.status(500).json({ success: false, message: 'Failed to list store products' });
  }
});

// @route   GET /api/store-products/public/:storeId/:productId
// @desc    Get a specific store product for public storefront viewing
// @access  Public
router.get('/public/:storeId/:productId', async (req, res) => {
  try {
    const { storeId, productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid store or product ID' });
    }

    const storeProduct = await StoreProduct.findOne({
      _id: productId,
      storeId: storeId,
      isActive: true,
      status: 'published',
    }).lean();

    if (!storeProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch variants for this product and populate catalog variant details (size/color)
    const variants = await StoreProductVariant.find({
      storeProductId: storeProduct._id,
      isActive: true,
    })
      .populate({ path: 'catalogProductVariantId', select: 'size color colorHex skuTemplate basePrice' })
      .lean();

    return res.json({
      success: true,
      data: {
        ...storeProduct,
        variants,
      },
    });
  } catch (error) {
    console.error('Error fetching public store product:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch store product' });
  }
});

// @route   GET /api/store-products
// @desc    List store products for current merchant (all their stores)
// @access  Private (merchant, superadmin)
router.get('/', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { status, isActive } = req.query;

    let storeFilter = {};
    if (req.user.role !== 'superadmin') {
      storeFilter.merchant = req.user._id;
    }

    const stores = await Store.find({ ...storeFilter, isActive: true }, { _id: 1 });
    const storeIds = stores.map(s => s._id);

    const spFilter = { storeId: { $in: storeIds } };
    if (status) spFilter.status = status;
    if (isActive !== undefined) spFilter.isActive = isActive === 'true';

    const products = await StoreProduct.find(spFilter)
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error listing store products:', error);
    return res.status(500).json({ success: false, message: 'Failed to list store products' });
  }
});

// @route   PATCH /api/store-products/:id
// @desc    Update store product fields (status, isActive, pricing, title, etc.)
// @access  Private (merchant, superadmin)
router.patch('/:id', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const sp = await StoreProduct.findById(id);
    if (!sp) return res.status(404).json({ success: false, message: 'Store product not found' });

    const store = await Store.findById(sp.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Handle publish/draft transitions
    if (updates.status === 'published' && sp.status !== 'published') {
      sp.status = 'published';
      sp.publishedAt = new Date();
    } else if (updates.status === 'draft') {
      sp.status = 'draft';
      sp.publishedAt = undefined;
    }

    if (typeof updates.isActive === 'boolean') sp.isActive = updates.isActive;
    if (updates.title !== undefined) sp.title = updates.title;
    if (updates.description !== undefined) sp.description = updates.description;
    if (updates.sellingPrice !== undefined) sp.sellingPrice = updates.sellingPrice;
    if (updates.compareAtPrice !== undefined) sp.compareAtPrice = updates.compareAtPrice;
    if (Array.isArray(updates.tags)) sp.tags = updates.tags;

    await sp.save();
    return res.json({ success: true, data: sp });
  } catch (error) {
    console.error('Error updating store product:', error);
    return res.status(500).json({ success: false, message: 'Failed to update store product' });
  }
});

// @route   DELETE /api/store-products/:id
// @desc    Delete a store product and its variants
// @access  Private (merchant, superadmin)
router.delete('/:id', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const sp = await StoreProduct.findById(id);
    if (!sp) return res.status(404).json({ success: false, message: 'Store product not found' });

    const store = await Store.findById(sp.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await StoreProductVariant.deleteMany({ storeProductId: sp._id });
    await sp.deleteOne();
    return res.json({ success: true, message: 'Store product deleted' });
  } catch (error) {
    console.error('Error deleting store product:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete store product' });
  }
});

module.exports = router;
