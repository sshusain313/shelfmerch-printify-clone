const express = require('express');
const router = express.Router();
const CatalogueFieldTemplate = require('../models/CatalogueFieldTemplate');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/catalogue-fields
// @desc    Get all catalogue field templates (optionally filtered by category/subcategory)
// @access  Public (needed for product creation form)
router.get('/', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;
    
    const query = { isActive: true };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      query.subcategoryId = subcategoryId;
    }
    
    const fields = await CatalogueFieldTemplate.find(query).sort({ createdAt: 1 });
    
    res.json({
      success: true,
      data: fields,
      count: fields.length,
    });
  } catch (error) {
    console.error('Error fetching catalogue fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalogue fields',
      error: error.message,
    });
  }
});

// @route   POST /api/catalogue-fields
// @desc    Create a new catalogue field template
// @access  Private/Admin
router.post('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { categoryId, subcategoryId, key, label, type, options, required, placeholder, unit } = req.body;
    
    // Validation
    if (!categoryId || !key || !label || !type) {
      return res.status(400).json({
        success: false,
        message: 'categoryId, key, label, and type are required',
      });
    }
    
    // Check if field already exists for this category/subcategory
    const existingField = await CatalogueFieldTemplate.findOne({
      categoryId,
      subcategoryId: subcategoryId || null,
      key,
    });
    
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: 'A field with this key already exists for this category/subcategory',
      });
    }
    
    const field = await CatalogueFieldTemplate.create({
      categoryId,
      subcategoryId: subcategoryId || null,
      key,
      label,
      type,
      options: options || [],
      required: required || false,
      placeholder: placeholder || '',
      unit: unit || '',
      createdBy: req.user._id,
      isActive: true,
    });
    
    res.status(201).json({
      success: true,
      message: 'Catalogue field template created successfully',
      data: field,
    });
  } catch (error) {
    console.error('Error creating catalogue field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create catalogue field',
      error: error.message,
    });
  }
});

// @route   PUT /api/catalogue-fields/:id
// @desc    Update a catalogue field template
// @access  Private/Admin
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { label, type, options, required, placeholder, unit, isActive } = req.body;
    
    const field = await CatalogueFieldTemplate.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Catalogue field template not found',
      });
    }
    
    // Update allowed fields (don't allow changing categoryId, subcategoryId, or key)
    if (label !== undefined) field.label = label;
    if (type !== undefined) field.type = type;
    if (options !== undefined) field.options = options;
    if (required !== undefined) field.required = required;
    if (placeholder !== undefined) field.placeholder = placeholder;
    if (unit !== undefined) field.unit = unit;
    if (isActive !== undefined) field.isActive = isActive;
    
    await field.save();
    
    res.json({
      success: true,
      message: 'Catalogue field template updated successfully',
      data: field,
    });
  } catch (error) {
    console.error('Error updating catalogue field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catalogue field',
      error: error.message,
    });
  }
});

// @route   DELETE /api/catalogue-fields/:id
// @desc    Delete a catalogue field template
// @access  Private/Admin
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const field = await CatalogueFieldTemplate.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Catalogue field template not found',
      });
    }
    
    await field.deleteOne();
    
    res.json({
      success: true,
      message: 'Catalogue field template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting catalogue field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalogue field',
      error: error.message,
    });
  }
});

// @route   GET /api/catalogue-fields/stats
// @desc    Get statistics about catalogue field templates
// @access  Private/Admin
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const totalFields = await CatalogueFieldTemplate.countDocuments();
    const activeFields = await CatalogueFieldTemplate.countDocuments({ isActive: true });
    const fieldsByCategory = await CatalogueFieldTemplate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    
    res.json({
      success: true,
      data: {
        totalFields,
        activeFields,
        fieldsByCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching catalogue field stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message,
    });
  }
});

module.exports = router;

