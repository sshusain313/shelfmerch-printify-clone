const express = require('express');
const router = express.Router();
const VariantOptionTemplate = require('../models/VariantOptionTemplate');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/variant-options
// @desc    Get all custom variant options (filtered by category/subcategory)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { categoryId, subcategoryId, optionType } = req.query;
    
    const query = { isActive: true };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      // Get options for specific subcategory OR global options (subcategoryId: null)
      query.$or = [
        { subcategoryId: subcategoryId },
        { subcategoryId: null }
      ];
    }
    
    if (optionType) {
      query.optionType = optionType;
    }
    
    const options = await VariantOptionTemplate.find(query)
      .sort({ value: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching variant options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variant options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/variant-options
// @desc    Create a new custom variant option
// @access  Private (any authenticated user can add options)
router.post('/', protect, async (req, res) => {
  try {
    const { categoryId, subcategoryId, optionType, value, colorHex } = req.body;
    
    // Validation
    if (!categoryId || !optionType || !value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: categoryId, optionType, value'
      });
    }
    
    // Check for duplicate
    const existing = await VariantOptionTemplate.findOne({
      categoryId,
      subcategoryId: subcategoryId || null,
      optionType,
      value: value.trim()
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This option already exists'
      });
    }
    
    // Create new option
    const option = await VariantOptionTemplate.create({
      categoryId,
      subcategoryId: subcategoryId || null,
      optionType,
      value: value.trim(),
      colorHex: colorHex || null,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Variant option created successfully',
      data: option
    });
  } catch (error) {
    console.error('Error creating variant option:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This option already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating variant option',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/variant-options/:id
// @desc    Update a custom variant option
// @access  Private/Admin
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { value, colorHex, isActive } = req.body;
    
    const option = await VariantOptionTemplate.findById(req.params.id);
    
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Variant option not found'
      });
    }
    
    // Update fields
    if (value !== undefined) option.value = value.trim();
    if (colorHex !== undefined) option.colorHex = colorHex;
    if (isActive !== undefined) option.isActive = isActive;
    
    await option.save();
    
    res.json({
      success: true,
      message: 'Variant option updated successfully',
      data: option
    });
  } catch (error) {
    console.error('Error updating variant option:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating variant option',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/variant-options/:id
// @desc    Delete a custom variant option
// @access  Private/Admin
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const option = await VariantOptionTemplate.findById(req.params.id);
    
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Variant option not found'
      });
    }
    
    // Soft delete by setting isActive to false
    option.isActive = false;
    await option.save();
    
    res.json({
      success: true,
      message: 'Variant option deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant option:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting variant option',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/variant-options/stats
// @desc    Get statistics about variant options usage
// @access  Private/Admin
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const stats = await VariantOptionTemplate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            categoryId: '$categoryId',
            optionType: '$optionType'
          },
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' }
        }
      },
      { $sort: { '_id.categoryId': 1, '_id.optionType': 1 } }
    ]);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;

