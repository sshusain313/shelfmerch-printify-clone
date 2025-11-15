const Design = require('../models/Design');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// @desc    Create new design
// @route   POST /api/designs
// @access  Private
exports.createDesign = async (req, res, next) => {
  try {
    req.body.userId = req.user.id;
    
    const design = await Design.create(req.body);

    res.status(201).json({
      success: true,
      data: design,
    });
  } catch (error) {
    logger.error('Create design error:', error);
    next(error);
  }
};

// @desc    Get all designs for user
// @route   GET /api/designs
// @access  Private
exports.getDesigns = async (req, res, next) => {
  try {
    const designs = await Design.find({ userId: req.user.id })
      .populate('productId', 'name baseProduct')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: designs.length,
      data: designs,
    });
  } catch (error) {
    logger.error('Get designs error:', error);
    next(error);
  }
};

// @desc    Get single design
// @route   GET /api/designs/:id
// @access  Private
exports.getDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id)
      .populate('productId', 'name baseProduct mockupUrl');

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      data: design,
    });
  } catch (error) {
    logger.error('Get design error:', error);
    next(error);
  }
};

// @desc    Update design
// @route   PUT /api/designs/:id
// @access  Private
exports.updateDesign = async (req, res, next) => {
  try {
    let design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: design,
    });
  } catch (error) {
    logger.error('Update design error:', error);
    next(error);
  }
};

// @desc    Delete design
// @route   DELETE /api/designs/:id
// @access  Private
exports.deleteDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await design.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete design error:', error);
    next(error);
  }
};

// @desc    Generate mockup for design
// @route   POST /api/designs/:id/mockup
// @access  Private
exports.generateMockup = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // For MVP, we'll store mockup generation as a placeholder
    // In production, this would use Sharp to composite design onto product mockup
    const mockupUrl = `/mockups/design-${design._id}-${Date.now()}.png`;

    design.mockupUrls = {
      ...design.mockupUrls,
      preview: mockupUrl,
    };

    await design.save();

    res.status(200).json({
      success: true,
      data: {
        mockupUrl,
      },
    });
  } catch (error) {
    logger.error('Generate mockup error:', error);
    next(error);
  }
};

// @desc    Publish design as product
// @route   POST /api/designs/:id/publish
// @access  Private
exports.publishDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Create or update product
    const productData = {
      userId: req.user.id,
      name: req.body.name || design.name,
      description: req.body.description || '',
      baseProduct: req.body.baseProduct || 't-shirt',
      price: req.body.price || 24.99,
      mockupUrl: design.mockupUrls.preview,
      designs: {
        front: design.designData,
      },
      variants: req.body.variants || {
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL'],
      },
      status: 'published',
    };

    let product;
    if (design.publishedProductId) {
      product = await Product.findByIdAndUpdate(design.publishedProductId, productData, {
        new: true,
      });
    } else {
      product = await Product.create(productData);
      design.publishedProductId = product._id;
    }

    design.status = 'published';
    await design.save();

    res.status(200).json({
      success: true,
      data: {
        design,
        product,
      },
    });
  } catch (error) {
    logger.error('Publish design error:', error);
    next(error);
  }
};

// @desc    Export design for printing
// @route   POST /api/designs/:id/export
// @access  Private
exports.exportDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Make sure user owns the design
    if (design.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // For MVP, return design data
    // In production, this would generate high-res print files
    const printFileUrl = `/exports/design-${design._id}-print.png`;

    design.printFiles = {
      front: printFileUrl,
    };

    await design.save();

    res.status(200).json({
      success: true,
      data: {
        printFileUrl,
        designData: design.designData,
      },
    });
  } catch (error) {
    logger.error('Export design error:', error);
    next(error);
  }
};
