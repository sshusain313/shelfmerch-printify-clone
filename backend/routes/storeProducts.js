const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const StoreProductVariant = require('../models/StoreProductVariant');
const CatalogProductVariant = require('../models/CatalogProductVariant');

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
      variants,         // optional: [{ catalogProductVariantId, sku, sellingPrice, isActive }]
      status            // optional: 'draft' | 'published'
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
        // Handle status: if provided, set it and publishedAt accordingly
        ...(status === 'published' ? {
          status: 'published',
          publishedAt: new Date()
        } : status === 'draft' ? {
          status: 'draft',
          publishedAt: undefined
        } : {}),
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
        return await StoreProductVariant.findOneAndUpdate(
          vpFilter,
          vpUpdate,
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
      }));
      createdVariants = createdVariants.filter(Boolean);
    }

    // Rebuild embedded variantsSummary on the StoreProduct so that
    // storefronts and dashboards can quickly read per-variant pricing.
    const allVariants = await StoreProductVariant.find({
      storeProductId: storeProduct._id,
      isActive: true,
    }).populate({
      path: 'catalogProductVariantId',
      select: 'size color colorHex basePrice skuTemplate',
    });

    storeProduct.variantsSummary = allVariants
      .filter(v => v.catalogProductVariantId) // Filter out orphaned variants
      .map((v) => {
        const cv = v.catalogProductVariantId;
        return {
          catalogProductVariantId: cv._id,
          size: cv.size,
          color: cv.color,
          colorHex: cv.colorHex,
          sku: v.sku || cv.skuTemplate,
          sellingPrice: typeof v.sellingPrice === 'number' ? v.sellingPrice : undefined,
          basePrice: typeof cv.basePrice === 'number' ? cv.basePrice : undefined,
        };
      });

    await storeProduct.save();

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

// @route   GET /api/store-products/public/:storeId?
// @desc    List all public, active, published products for a specific store
// @access  Public
// NOTE: Uses req.tenant when available (subdomain-based), falls back to :storeId param
router.get(['/public', '/public/:storeId'], async (req, res) => {
  try {
    let storeId = null;

    // Priority 1: Use tenant from middleware (subdomain-based)
    if (req.tenant && req.tenant._id) {
      storeId = req.tenant._id;
    }
    // Priority 2: Fallback to path parameter
    else if (req.params.storeId) {
      storeId = req.params.storeId;
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store identifier required. Provide store subdomain or storeId parameter.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid store ID' });
    }

    const products = await StoreProduct.find({
      storeId: storeId,
      isActive: true,
      status: 'published',
    })
      .populate({
        path: 'catalogProductId',
        select: '_id name description categoryId subcategoryIds productTypeCode',
        lean: true
      })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error listing public store products:', error);
    return res.status(500).json({ success: false, message: 'Failed to list store products' });
  }
});

// @route   GET /api/store-products/public/:storeId?/:productId
// @desc    Get a specific store product for public storefront viewing
// @access  Public
// NOTE: Uses req.tenant when available (subdomain-based), falls back to :storeId param
// Note: Route order implies this only catches 2-segment paths, so explicit optional param was misleading/unreachable for 1-segment.
router.get('/public/:storeId/:productId', async (req, res) => {
  try {
    const { storeId, productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // Priority 1: Use tenant from middleware (subdomain-based)
    let resolvedStoreId = null;
    if (req.tenant && req.tenant._id) {
      resolvedStoreId = req.tenant._id;
    }
    // Priority 2: Fallback to path parameter
    else if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ success: false, message: 'Invalid store ID' });
      }
      resolvedStoreId = storeId;
    }

    if (!resolvedStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Store identifier required. Provide store subdomain or storeId parameter.'
      });
    }

    const storeProduct = await StoreProduct.findOne({
      _id: productId,
      storeId: resolvedStoreId,
      isActive: true,
      status: 'published',
    })
      .populate({
        path: 'catalogProductId',
        select: '_id name description categoryId subcategoryIds productTypeCode',
        lean: true
      })
      .lean();

    if (!storeProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch variants for this product and populate catalog variant details (size/color)
    let variants = await StoreProductVariant.find({
      storeProductId: storeProduct._id,
      isActive: true,
    })
      .populate({ path: 'catalogProductVariantId', select: 'size color colorHex skuTemplate basePrice' })
      .lean();

    // If no store-specific variants exist, fall back to catalog product variants
    // This handles default stores that haven't customized their variants
    if (!variants || variants.length === 0) {
      // Handle both populated object and direct ObjectId/string
      const catalogProductId = storeProduct.catalogProductId?._id
        ? storeProduct.catalogProductId._id
        : storeProduct.catalogProductId;

      if (catalogProductId) {
        console.log('[StoreProducts] Falling back to catalog variants for product:', productId, 'catalogProductId:', catalogProductId);

        // Check if designData has selected colors/sizes to filter variants
        const selectedColors = storeProduct.designData?.selectedColors;
        const selectedSizes = storeProduct.designData?.selectedSizes;
        const hasSelectedColors = Array.isArray(selectedColors) && selectedColors.length > 0;
        const hasSelectedSizes = Array.isArray(selectedSizes) && selectedSizes.length > 0;

        console.log('[StoreProducts] Filter criteria:', {
          hasSelectedColors,
          selectedColors,
          hasSelectedSizes,
          selectedSizes,
        });

        // Build query - filter by selected colors/sizes if they exist
        const variantQuery = {
          catalogProductId: catalogProductId,
          isActive: true,
        };

        if (hasSelectedColors) {
          variantQuery.color = { $in: selectedColors };
        }

        if (hasSelectedSizes) {
          variantQuery.size = { $in: selectedSizes };
        }

        const catalogVariants = await CatalogProductVariant.find(variantQuery)
          .select('_id size color colorHex skuTemplate basePrice')
          .lean();

        console.log('[StoreProducts] Found catalog variants:', catalogVariants.length, catalogVariants.map(cv => ({ size: cv.size, color: cv.color })));

        if (catalogVariants && catalogVariants.length > 0) {
          // Transform catalog variants to match StoreProductVariant format
          // Use store product's sellingPrice as the base price for variants
          const basePrice = storeProduct.sellingPrice || storeProduct.price || 0;

          variants = catalogVariants.map((cv) => ({
            catalogProductVariantId: {
              _id: cv._id,
              size: cv.size,
              color: cv.color,
              colorHex: cv.colorHex,
              skuTemplate: cv.skuTemplate,
              basePrice: cv.basePrice,
            },
            size: cv.size,
            color: cv.color,
            colorHex: cv.colorHex,
            sku: cv.skuTemplate,
            sellingPrice: basePrice, // Use store product's selling price
            isActive: true,
          }));

          console.log('[StoreProducts] Mapped variants:', variants.length, variants.map(v => ({ size: v.size, color: v.color })));
        } else {
          console.log('[StoreProducts] No catalog variants found for catalogProductId:', catalogProductId, 'with filters:', { hasSelectedColors, hasSelectedSizes });
        }
      } else {
        console.log('[StoreProducts] No catalogProductId found for product:', productId, 'storeProduct.catalogProductId:', storeProduct.catalogProductId);
      }
    } else {
      console.log('[StoreProducts] Using store-specific variants:', variants.length);
    }

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

// @route   GET /api/store-products/:id
// @desc    Get a single store product by ID for the current merchant/superadmin
// @access  Private (merchant, superadmin)
router.get('/:id', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid store product ID' });
    }

    const sp = await StoreProduct.findById(id);
    if (!sp) {
      return res.status(404).json({ success: false, message: 'Store product not found' });
    }

    const store = await Store.findById(sp.storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Merchants can only access their own stores; superadmin can access all
    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.json({ success: true, data: sp });
  } catch (error) {
    console.error('Error fetching store product by id:', error);
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

// @route   PATCH /api/store-products/:id/design-preview
// @desc    Update design preview images in designData for a store product
// @access  Private (merchant, superadmin)
router.patch('/:id/design-preview', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { viewKey, previewUrl, elements, designUrlsByPlaceholder } = req.body;

    if (!viewKey || !previewUrl) {
      return res.status(400).json({ success: false, message: 'viewKey and previewUrl are required' });
    }

    const sp = await StoreProduct.findById(id);
    if (!sp) return res.status(404).json({ success: false, message: 'Store product not found' });

    const store = await Store.findById(sp.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Initialize designData if it doesn't exist
    if (!sp.designData) {
      sp.designData = {};
    }

    // Initialize views object if it doesn't exist
    if (!sp.designData.views) {
      sp.designData.views = {};
    }

    // Initialize previewImagesByView if it doesn't exist
    if (!sp.designData.previewImagesByView) {
      sp.designData.previewImagesByView = {};
    }

    // Update the preview for this view
    sp.designData.previewImagesByView[viewKey] = previewUrl;

    // Update view-specific data
    if (!sp.designData.views[viewKey]) {
      sp.designData.views[viewKey] = {};
    }
    sp.designData.views[viewKey].previewImageUrl = previewUrl;

    // Update elements and designUrlsByPlaceholder if provided
    if (elements !== undefined) {
      sp.designData.views[viewKey].elements = elements;
    }
    if (designUrlsByPlaceholder !== undefined) {
      sp.designData.views[viewKey].designUrlsByPlaceholder = designUrlsByPlaceholder;
    }

    // If this is the front view, also update the primary preview
    if (viewKey === 'front') {
      sp.designData.previewImageUrl = previewUrl;
    }

    // Mark the designData as modified so Mongoose saves it
    sp.markModified('designData');
    await sp.save();

    return res.json({
      success: true,
      message: `Preview saved for ${viewKey} view`,
      data: {
        viewKey,
        previewUrl,
        designData: sp.designData
      }
    });
  } catch (error) {
    console.error('Error updating design preview:', error);
    return res.status(500).json({ success: false, message: 'Failed to update design preview' });
  }
});

// @route   PATCH /api/store-products/:id/mockup
// @desc    Save a mockup preview (flat or model) with proper type separation
// @access  Private (merchant, superadmin)
router.patch('/:id/mockup', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mockupType,  // 'flat' | 'model'
      viewKey,     // 'front' | 'back' | 'left' | 'right'
      colorKey,    // Required for model mockups (e.g., 'cerulean-frost')
      imageUrl
    } = req.body;

    // Validation
    if (!mockupType || !viewKey || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'mockupType, viewKey, and imageUrl are required'
      });
    }

    if (!['flat', 'model'].includes(mockupType)) {
      return res.status(400).json({
        success: false,
        message: 'mockupType must be "flat" or "model"'
      });
    }

    if (mockupType === 'model' && !colorKey) {
      return res.status(400).json({
        success: false,
        message: 'colorKey is required for model mockups'
      });
    }

    const sp = await StoreProduct.findById(id);
    if (!sp) {
      return res.status(404).json({ success: false, message: 'Store product not found' });
    }

    const store = await Store.findById(sp.storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (req.user.role !== 'superadmin' && String(store.merchant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Initialize designData structures
    if (!sp.designData) sp.designData = {};
    if (!sp.designData.previewImagesByView) sp.designData.previewImagesByView = {};

    if (mockupType === 'flat') {
      // Store flat mockups separately
      if (!sp.designData.flatMockups) sp.designData.flatMockups = {};
      sp.designData.flatMockups[viewKey] = imageUrl;

      // Update legacy field for backward compatibility
      sp.designData.previewImagesByView[viewKey] = imageUrl;

      // Update primary preview if front view
      if (viewKey === 'front') {
        sp.designData.previewImageUrl = imageUrl;
      }

      console.log(`[Mockup] Saved flat mockup for ${viewKey}:`, imageUrl.substring(0, 50) + '...');
    } else {
      // Store model mockups separately, keyed by color
      if (!sp.designData.modelMockups) sp.designData.modelMockups = {};
      if (!sp.designData.modelMockups[colorKey]) sp.designData.modelMockups[colorKey] = {};
      sp.designData.modelMockups[colorKey][viewKey] = imageUrl;

      // Update legacy field for backward compatibility with color-prefixed key
      const legacyKey = `mockup-${colorKey}-${viewKey}`;
      sp.designData.previewImagesByView[legacyKey] = imageUrl;

      console.log(`[Mockup] Saved model mockup for ${colorKey}/${viewKey}:`, imageUrl.substring(0, 50) + '...');
    }

    sp.markModified('designData');
    await sp.save();

    return res.json({
      success: true,
      message: `${mockupType} mockup saved for ${mockupType === 'model' ? `${colorKey}/${viewKey}` : viewKey}`,
      data: {
        mockupType,
        viewKey,
        colorKey: colorKey || null,
        imageUrl,
        flatMockups: sp.designData.flatMockups,
        modelMockups: sp.designData.modelMockups
      }
    });
  } catch (error) {
    console.error('Error saving mockup:', error);
    return res.status(500).json({ success: false, message: 'Failed to save mockup' });
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

    // Handle storeId update (reassign product to different store)
    if (updates.storeId && String(updates.storeId) !== String(sp.storeId)) {
      // Validate the new store exists and belongs to this user
      const newStore = await Store.findById(updates.storeId);
      if (!newStore) {
        return res.status(404).json({ success: false, message: 'Target store not found' });
      }
      if (req.user.role !== 'superadmin' && String(newStore.merchant) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to publish to this store' });
      }

      console.log('[StoreProducts] Reassigning product from store', sp.storeId, 'to', updates.storeId);
      sp.storeId = updates.storeId;
    }

    // Handle designData updates
    if (updates.designData !== undefined) {
      sp.designData = { ...(sp.designData || {}), ...updates.designData };
      sp.markModified('designData');
    }

    // Persist basic StoreProduct field changes before working with variants
    await sp.save();

    let updatedVariants = [];
    if (Array.isArray(updates.variants) && updates.variants.length > 0) {
      // Upsert each variant for this store product (same logic as POST route)
      updatedVariants = await Promise.all(
        updates.variants.map(async (v) => {
          if (!v.catalogProductVariantId || !v.sku) return null;

          const vpFilter = {
            storeProductId: sp._id,
            catalogProductVariantId: v.catalogProductVariantId,
          };

          const vpUpdate = {
            $set: {
              storeProductId: sp._id,
              catalogProductVariantId: v.catalogProductVariantId,
              sku: v.sku,
              ...(v.sellingPrice !== undefined ? { sellingPrice: v.sellingPrice } : {}),
              ...(v.isActive !== undefined ? { isActive: v.isActive } : {}),
            },
          };

          return await StoreProductVariant.findOneAndUpdate(
            vpFilter,
            vpUpdate,
            { new: true, upsert: true, setDefaultsOnInsert: true },
          );
        })
      );

      updatedVariants = updatedVariants.filter(Boolean);
    }

    // Rebuild embedded variantsSummary from active StoreProductVariant docs
    const allVariants = await StoreProductVariant.find({
      storeProductId: sp._id,
      isActive: true,
    }).populate({
      path: 'catalogProductVariantId',
      select: 'size color colorHex basePrice skuTemplate',
    });

    sp.variantsSummary = allVariants
      .filter(v => v.catalogProductVariantId) // Filter out orphaned variants
      .map((v) => {
        const cv = v.catalogProductVariantId;
        return {
          catalogProductVariantId: cv._id,
          size: cv.size,
          color: cv.color,
          colorHex: cv.colorHex,
          sku: v.sku || cv.skuTemplate,
          sellingPrice: typeof v.sellingPrice === 'number' ? v.sellingPrice : undefined,
          basePrice: typeof cv.basePrice === 'number' ? cv.basePrice : undefined,
        };
      });

    await sp.save();

    return res.json({
      success: true,
      data: sp,
      variants: updatedVariants,
    });
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
