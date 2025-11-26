const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/products
// @desc    Create a new base product (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  // Set a longer timeout for product creation (30 seconds)
  req.setTimeout(30000);

  try {
    console.log('Product creation request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('User ID:', req.user?.id);

    const {
      catalogue,
      details,
      design,
      shipping,
      pricing,
      stocks,
      options,
      variants,
      availableSizes,
      availableColors,
      galleryImages,
      faqs
    } = req.body;

    console.log('Catalogue:', catalogue ? 'present' : 'missing');
    console.log('Design:', design ? 'present' : 'missing');
    console.log('Shipping:', shipping ? 'present' : 'missing');
    console.log('Pricing:', pricing ? 'present' : 'missing');
    console.log('Stocks:', stocks ? 'present' : 'missing');
    console.log('Options:', options ? 'present' : 'missing');
    console.log('Gallery images count:', galleryImages ? galleryImages.length : 0);

    // Validate required fields
    if (!catalogue || !design || !shipping) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: catalogue, design, or shipping'
      });
    }
    // Note: pricing, stocks, and options are optional fields

    // Validate catalogue data
    if (!catalogue.name || !catalogue.description || !catalogue.categoryId || !catalogue.basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required catalogue fields: name, description, categoryId, basePrice'
      });
    }

    // Validate new required fields (productTypeCode and attributes)
    if (!catalogue.productTypeCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: productTypeCode'
      });
    }

    // Ensure attributes is an object (can be empty)
    if (catalogue.attributes !== undefined && typeof catalogue.attributes !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Attributes must be an object'
      });
    }

    // Validate design data - at least one view with mockup
    if (!design.views || !Array.isArray(design.views)) {
      return res.status(400).json({
        success: false,
        message: 'Design views must be an array'
      });
    }

    const hasMockup = design.views.some(v => v && v.mockupImageUrl && v.mockupImageUrl.trim() !== '');
    if (!hasMockup) {
      return res.status(400).json({
        success: false,
        message: 'At least one view must have a mockup image'
      });
    }

    // Validate gallery images - at least one and one primary
    if (!galleryImages || galleryImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one gallery image is required'
      });
    }

    const primaryCount = galleryImages.filter(img => img.isPrimary).length;
    if (primaryCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one gallery image must be marked as primary'
      });
    }

    // Validate shipping data
    if (
      !shipping.packageLengthCm ||
      !shipping.packageWidthCm ||
      !shipping.packageHeightCm ||
      !shipping.packageWeightGrams
    ) {
      return res.status(400).json({
        success: false,
        message: 'All shipping dimensions are required'
      });
    }

    // Filter out views with empty mockupImageUrl before saving
    // Also ensure placeholders array exists for each view
    const filteredViews = design.views
      .filter(v => v && v.mockupImageUrl && v.mockupImageUrl.trim() !== '')
      .map(v => ({
        key: v.key,
        mockupImageUrl: v.mockupImageUrl,
        placeholders: Array.isArray(v.placeholders) ? v.placeholders : []
      }));

    if (filteredViews.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one view must have a mockup image'
      });
    }

    console.log('Creating product in database...');

    // Create product (without embedded variants)
    const product = await Product.create({
      catalogue,
      details: details || undefined,
      design: {
        views: filteredViews,
        dpi: design.dpi || 300
      },
      shipping,
      pricing: pricing || undefined,
      stocks: stocks || undefined,
      options: options || undefined,
      availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
      availableColors: Array.isArray(availableColors) ? availableColors : [],
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      faqs: Array.isArray(faqs) ? faqs : [],
      createdBy: req.user.id,
      isActive: true
    });

    console.log('Product created successfully:', product._id);

    // Create variants in separate collection if provided
    let createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      console.log(`Creating ${variants.length} variants for product ${product._id}...`);
      const variantsWithProductId = variants.map(v => ({
        ...v,
        productId: product._id
      }));

      try {
        createdVariants = await ProductVariant.insertMany(variantsWithProductId, {
          ordered: false // Continue on duplicate key errors
        });
        console.log(`Successfully created ${createdVariants.length} variants`);
      } catch (variantError) {
        console.error('Error creating variants:', variantError);
        // Log the error but don't fail the product creation
        // Variants can be added later via the variants API
      }
    }

    // Return product with variants included (for backward compatibility)
    const productResponse = product.toObject();
    productResponse.variants = createdVariants;

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: productResponse
    });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    // Don't try to stringify the entire request body if it has large images
    const bodySummary = {
      catalogue: req.body.catalogue ? { name: req.body.catalogue.name } : null,
      design: req.body.design ? { viewsCount: req.body.design.views?.length || 0 } : null,
      shipping: req.body.shipping ? 'present' : null,
      pricing: req.body.pricing ? 'present' : null,
      stocks: req.body.stocks ? 'present' : null,
      options: req.body.options ? 'present' : null,
      galleryImagesCount: req.body.galleryImages?.length || 0
    };
    console.error('Request body summary:', JSON.stringify(bodySummary, null, 2));

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Handle CastError (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching products - Query params:', req.query);
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    // Build query
    const query = {};
    if (isActive !== undefined && isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    // Handle search - use regex for partial matching
    let searchQuery;
    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      searchQuery = Product.find({
        ...query,
        $or: [
          { 'catalogue.name': { $regex: searchTerm, $options: 'i' } },
          { 'catalogue.description': { $regex: searchTerm, $options: 'i' } }
        ]
      });
    } else {
      searchQuery = Product.find(query);
    }

    const products = await searchQuery
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(String(limit)));

    // Count total matching documents
    let countQuery = query;
    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      countQuery = {
        ...query,
        $or: [
          { 'catalogue.name': { $regex: searchTerm, $options: 'i' } },
          { 'catalogue.description': { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    const total = await Product.countDocuments(countQuery);

    console.log(`Found ${products.length} products out of ${total} total`);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        pages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// IMPORTANT: Place specific routes (like /catalog/active) 
// BEFORE generic routes (like /:id) to ensure proper route matching

// @route   GET /api/products/catalog/active
// @desc    Get all active products for catalog (public)
// @desc    Only returns products where isActive === true
// @access  Public
router.get('/catalog/active', async (req, res) => {
  try {
    console.log('Fetching active products for catalog');
    const { page = 1, limit = 20, category, subcategory, search } = req.query;
    console.log('Query params:', { page, limit, category, subcategory, search });
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    // Build query - ONLY active products (isActive === true)
    // This ensures that only products with active status appear in the public catalog
    // Products with isActive === false will NOT appear here

    // Filter by visibility option
    // Visibility: 'everywhere' = catalog + search, 'catalog' = catalog only, 'search' = search only, 'nowhere' = hidden
    // If search parameter is present: show 'everywhere' and 'search' (exclude 'catalog' and 'nowhere')
    // If no search parameter (catalog view): show 'everywhere' and 'catalog' (exclude 'search' and 'nowhere')
    // If options.visibility doesn't exist, default to 'everywhere' behavior (show it for backward compatibility)
    const isSearchQuery = search && String(search).trim();

    // Build visibility filter - EXCLUDE 'nowhere' always
    // Catalog view (no search): show 'everywhere' and 'catalog' only
    // Search view (with search): show 'everywhere' and 'search' only
    const visibilityFilter = {
      $or: [
        { 'options.visibility': { $exists: false } }, // No visibility set = show (backward compatibility)
        { 'options.visibility': 'everywhere' },       // Show everywhere
        { 'options.visibility': isSearchQuery ? 'search' : 'catalog' } // Show based on context
        // Explicitly excluded: 'nowhere' (never shown), and opposite context
      ]
    };

    console.log('Visibility filter:', JSON.stringify(visibilityFilter, null, 2));
    console.log('Search query present:', isSearchQuery);
    console.log('Context:', isSearchQuery ? 'SEARCH' : 'CATALOG');

    // Combine all filters using $and to ensure visibility filter is applied correctly
    const andConditions = [
      { isActive: true },  // Must be active
      visibilityFilter     // Must match visibility rules (excludes 'nowhere')
    ];

    // Add category filter if provided (case-insensitive)
    if (category && String(category).trim()) {
      const categoryTerm = String(category).trim();
      andConditions.push({
        'catalogue.categoryId': { $regex: new RegExp(`^${categoryTerm}$`, 'i') }
      });
      console.log('Applied category filter:', categoryTerm);
    }

    // Add subcategory filter if provided (searches in subcategoryIds array)
    if (subcategory && String(subcategory).trim()) {
      const subcategoryTerm = String(subcategory).trim();
      const escapedTerm = subcategoryTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({
        'catalogue.subcategoryIds': {
          $in: [new RegExp(`^${escapedTerm}$`, 'i')]
        }
      });
      console.log('Applied subcategory filter:', subcategoryTerm);
    }

    // Handle search text matching - add to andConditions if search term exists
    if (isSearchQuery) {
      const searchTerm = String(search).trim();
      andConditions.push({
        $or: [
          { 'catalogue.name': { $regex: searchTerm, $options: 'i' } },
          { 'catalogue.description': { $regex: searchTerm, $options: 'i' } },
          { 'catalogue.tags': { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }

    // Build final query with $and
    const finalQuery = { $and: andConditions };

    console.log('Final query:', JSON.stringify(finalQuery, null, 2));

    // Execute query
    const searchQuery = Product.find(finalQuery);

    const products = await searchQuery
      .select('-createdBy -updatedAt -__v') // Exclude admin fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(String(limit)));

    // Count total matching documents (use same query structure)
    const total = await Product.countDocuments(finalQuery);

    console.log(`Found ${products.length} active catalog products out of ${total} total`);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        pages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Error fetching catalog products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Fetch variants from separate collection
    const variants = await ProductVariant.find({ productId: product._id })
      .sort({ size: 1, color: 1 });

    // Add variants to product response (for backward compatibility)
    const productResponse = product.toObject();
    productResponse.variants = variants;

    res.json({
      success: true,
      data: productResponse
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    const {
      catalogue,
      details,
      design,
      shipping,
      pricing,
      stocks,
      options,
      variants,
      availableSizes,
      availableColors,
      galleryImages,
      faqs,
      isActive
    } = req.body;

    if (catalogue) product.catalogue = catalogue;
    if (details !== undefined) product.details = details;
    if (design) product.design = design;
    if (shipping) product.shipping = shipping;
    if (pricing !== undefined) product.pricing = pricing;
    if (stocks !== undefined) product.stocks = stocks;
    if (options !== undefined) product.options = options;
    if (availableSizes) product.availableSizes = availableSizes;
    if (availableColors) product.availableColors = availableColors;
    if (galleryImages) product.galleryImages = galleryImages;
    if (faqs !== undefined) product.faqs = Array.isArray(faqs) ? faqs : [];
    if (isActive !== undefined) product.isActive = isActive;

    product.updatedAt = Date.now();

    await product.save();

    // Handle variants update if provided
    // Note: Variants should now be managed via /api/variants endpoints
    // This code maintains backward compatibility for bulk updates
    let updatedVariants = [];
    if (variants && Array.isArray(variants)) {
      console.log(`Updating variants for product ${product._id}...`);

      // Delete existing variants for this product
      await ProductVariant.deleteMany({ productId: product._id });

      // Create new variants
      if (variants.length > 0) {
        const variantsWithProductId = variants.map(v => ({
          ...v,
          productId: product._id
        }));

        try {
          updatedVariants = await ProductVariant.insertMany(variantsWithProductId, {
            ordered: false
          });
          console.log(`Successfully updated ${updatedVariants.length} variants`);
        } catch (variantError) {
          console.error('Error updating variants:', variantError);
        }
      }
    } else {
      // Fetch existing variants if not updating them
      updatedVariants = await ProductVariant.find({ productId: product._id })
        .sort({ size: 1, color: 1 });
    }

    // Return product with variants included (for backward compatibility)
    const productResponse = product.toObject();
    productResponse.variants = updatedVariants;

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: productResponse
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product permanently from database
// @desc    This is different from toggle - delete removes the product completely
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all variants associated with this product
    const variantDeleteResult = await ProductVariant.deleteMany({
      productId: req.params.id
    });
    console.log(`Deleted ${variantDeleteResult.deletedCount} variants for product ${req.params.id}`);

    // Permanently delete the product from database
    await Product.findByIdAndDelete(req.params.id);

    console.log(`Product ${req.params.id} deleted permanently from database`);

    res.json({
      success: true,
      message: 'Product and associated variants deleted successfully',
      deletedVariants: variantDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

