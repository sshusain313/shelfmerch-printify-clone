const express = require('express');
const router = express.Router();
const CatalogProductVariant = require('../models/CatalogProductVariant');
const CatalogProduct = require('../models/CatalogProduct');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/variants
// @desc    Create a new product variant (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const {
      productId,
      id,
      size,
      color,
      colorHex,
      sku,
      price,
      isActive
    } = req.body;

    // Validate required fields
    if (!productId || !id || !size || !color || !colorHex || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, id, size, color, colorHex, sku'
      });
    }

    // Verify that the catalog product exists
    const product = await CatalogProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Catalog product not found'
      });
    }

    // Create catalog variant
    const variant = await CatalogProductVariant.create({
      catalogProductId: productId,
      size,
      color,
      colorHex,
      skuTemplate: sku || `${product.productTypeCode}-${size}-${color}`,
      basePrice: price !== undefined ? price : undefined,
      isActive: isActive !== undefined ? isActive : true
    });

    // Transform variant: basePrice -> price, skuTemplate -> sku for frontend compatibility
    // Keep basePrice in response for production cost calculation (required by ListingEditor)
    const variantObj = variant.toObject ? variant.toObject() : variant;
    const transformedVariant = {
      ...variantObj,
      sku: variantObj.skuTemplate || variantObj.sku,
      price: variantObj.basePrice, // For backward compatibility
      // Keep basePrice for production cost calculation (ListingEditor requirement)
      basePrice: variantObj.basePrice,
      skuTemplate: undefined // Remove skuTemplate to avoid confusion
    };

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: transformedVariant
    });
  } catch (error) {
    console.error('Error creating variant:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. This ${field} already exists.`
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/variants/bulk
// @desc    Create multiple variants at once (Admin only)
// @access  Private/Admin
router.post('/bulk', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { productId, variants } = req.body;

    if (!productId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId and variants array'
      });
    }

    // Verify that the catalog product exists
    const product = await CatalogProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Catalog product not found'
      });
    }

    // Transform variants to catalog variant structure
    const catalogVariants = variants.map(v => ({
      catalogProductId: productId,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      skuTemplate: v.sku || `${product.productTypeCode}-${v.size}-${v.color}`,
      basePrice: v.price !== undefined ? v.price : undefined,
      isActive: v.isActive !== false
    }));

    // Create all catalog variants
    const createdVariants = await CatalogProductVariant.insertMany(catalogVariants, {
      ordered: false // Continue on duplicate key errors
    });

    // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
    // Keep basePrice in response for production cost calculation (required by ListingEditor)
    const transformedVariants = createdVariants.map(v => {
      const variant = v.toObject ? v.toObject() : v;
      return {
        ...variant,
        sku: variant.skuTemplate || variant.sku,
        price: variant.basePrice, // For backward compatibility
        // Keep basePrice for production cost calculation (ListingEditor requirement)
        basePrice: variant.basePrice,
        skuTemplate: undefined // Remove skuTemplate to avoid confusion
      };
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${transformedVariants.length} variants`,
      data: transformedVariants
    });
  } catch (error) {
    console.error('Error creating bulk variants:', error);

    // Handle bulk write errors
    if (error.name === 'MongoBulkWriteError') {
      const insertedCount = error.result?.nInserted || 0;
      return res.status(400).json({
        success: false,
        message: `Bulk insert partially failed. ${insertedCount} variants created. Some variants may have duplicate keys.`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating bulk variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/variants/product/:productId
// @desc    Get all variants for a specific catalog product
// @access  Private
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const variants = await CatalogProductVariant.find({
      catalogProductId: req.params.productId
    }).sort({ size: 1, color: 1 });

    // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
    // Keep basePrice in response for production cost calculation (required by ListingEditor)
    const transformedVariants = variants.map(v => {
      const variant = v.toObject ? v.toObject() : v;
      return {
        ...variant,
        sku: variant.skuTemplate || variant.sku,
        price: variant.basePrice, // For backward compatibility
        // Keep basePrice for production cost calculation (ListingEditor requirement)
        basePrice: variant.basePrice,
        skuTemplate: undefined // Remove skuTemplate to avoid confusion
      };
    });

    res.json({
      success: true,
      data: transformedVariants,
      count: transformedVariants.length
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/variants/:id
// @desc    Get single variant by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const variant = await CatalogProductVariant.findById(req.params.id)
      .populate('catalogProductId', 'name');

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Transform variant: basePrice -> price, skuTemplate -> sku for frontend compatibility
    // Keep basePrice in response for production cost calculation (required by ListingEditor)
    const variantObj = variant.toObject ? variant.toObject() : variant;
    const transformedVariant = {
      ...variantObj,
      sku: variantObj.skuTemplate || variantObj.sku,
      price: variantObj.basePrice, // For backward compatibility
      // Keep basePrice for production cost calculation (ListingEditor requirement)
      basePrice: variantObj.basePrice,
      skuTemplate: undefined // Remove skuTemplate to avoid confusion
    };

    res.json({
      success: true,
      data: transformedVariant
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/variants/:id
// @desc    Update variant
// @access  Private/Admin
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const variant = await CatalogProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Update fields
    const { size, color, colorHex, sku, price, isActive } = req.body;

    if (size !== undefined) variant.size = size;
    if (color !== undefined) variant.color = color;
    if (colorHex !== undefined) variant.colorHex = colorHex;
    if (sku !== undefined) variant.skuTemplate = sku;
    if (price !== undefined) variant.basePrice = price;
    if (isActive !== undefined) variant.isActive = isActive;

    variant.updatedAt = Date.now();

    await variant.save();

    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: variant
    });
  } catch (error) {
    console.error('Error updating variant:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. This ${field} already exists.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/variants/:id
// @desc    Delete variant permanently from database
// @access  Private/Admin
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const variant = await CatalogProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Permanently delete the variant from database
    await CatalogProductVariant.findByIdAndDelete(req.params.id);

    console.log(`Variant ${req.params.id} deleted permanently from database`);

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/variants/product/:productId
// @desc    Delete all variants for a specific catalog product
// @access  Private/Admin
router.delete('/product/:productId', protect, authorize('superadmin'), async (req, res) => {
  try {
    const result = await CatalogProductVariant.deleteMany({
      catalogProductId: req.params.productId
    });

    console.log(`Deleted ${result.deletedCount} variants for product ${req.params.productId}`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} variants`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting variants:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

