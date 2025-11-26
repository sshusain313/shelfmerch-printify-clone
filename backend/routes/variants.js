const express = require('express');
const router = express.Router();
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/variants
// @desc    Create a new product variant (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      productId,
      id,
      size,
      color,
      sku,
      isActive
    } = req.body;

    // Validate required fields
    if (!productId || !id || !size || !color || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, id, size, color, sku'
      });
    }

    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Create variant
    const variant = await ProductVariant.create({
      productId,
      id,
      size,
      color,
      sku,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: variant
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
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { productId, variants } = req.body;

    if (!productId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId and variants array'
      });
    }

    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add productId to each variant
    const variantsWithProductId = variants.map(v => ({
      ...v,
      productId
    }));

    // Create all variants
    const createdVariants = await ProductVariant.insertMany(variantsWithProductId, {
      ordered: false // Continue on duplicate key errors
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdVariants.length} variants`,
      data: createdVariants
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
// @desc    Get all variants for a specific product
// @access  Private
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const variants = await ProductVariant.find({
      productId: req.params.productId
    }).sort({ size: 1, color: 1 });

    res.json({
      success: true,
      data: variants,
      count: variants.length
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
    const variant = await ProductVariant.findById(req.params.id)
      .populate('productId', 'catalogue.name');

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    res.json({
      success: true,
      data: variant
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
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Update fields
    const { size, color, sku, isActive } = req.body;

    if (size !== undefined) variant.size = size;
    if (color !== undefined) variant.color = color;
    if (sku !== undefined) variant.sku = sku;
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
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Permanently delete the variant from database
    await ProductVariant.findByIdAndDelete(req.params.id);

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
// @desc    Delete all variants for a specific product
// @access  Private/Admin
router.delete('/product/:productId', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await ProductVariant.deleteMany({
      productId: req.params.productId
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

