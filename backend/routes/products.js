const express = require('express');
const router = express.Router();
const CatalogProduct = require('../models/CatalogProduct');
const CatalogProductVariant = require('../models/CatalogProductVariant');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/products
// @desc    Create a new base product (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('superadmin'), async (req, res) => {
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

    console.log('Creating catalog product in database...');

    // Transform data from old structure (catalogue.*) to new structure (flat fields)
    // Old: catalogue.name, catalogue.description, catalogue.basePrice, etc.
    // New: name, description, basePrice, etc.
    const catalogProductData = {
      name: catalogue.name,
      description: catalogue.description,
      categoryId: catalogue.categoryId,
      subcategoryIds: Array.isArray(catalogue.subcategoryIds) ? catalogue.subcategoryIds : [],
      productTypeCode: catalogue.productTypeCode,
      tags: Array.isArray(catalogue.tags) ? catalogue.tags : [],
      attributes: catalogue.attributes || new Map(),
      basePrice: catalogue.basePrice,
      design: {
        views: filteredViews,
        sampleMockups: Array.isArray(design.sampleMockups) ? design.sampleMockups : [],
        dpi: design.dpi || 300,
        physicalDimensions: design.physicalDimensions
      },
      shipping,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      details: details || {},
      pricing: pricing || {}, // Preserve pricing object if sent from frontend
      gst: (pricing && pricing.gst) ? pricing.gst : { slab: 18, mode: 'EXCLUSIVE', hsn: '' },
      createdBy: req.user.id,
      isActive: true,
      isPublished: true // Auto-publish for now (can be changed later)
    };

    // Create catalog product
    const product = await CatalogProduct.create(catalogProductData);

    console.log('Product created successfully:', product._id);

    // Create variants in separate collection if provided
    let createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      console.log(`Creating ${variants.length} catalog variants for product ${product._id}...`);
      const catalogVariants = variants.map(v => ({
        catalogProductId: product._id,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        skuTemplate: v.sku || `${catalogue.productTypeCode}-${v.size}-${v.color}`,
        basePrice: v.price !== undefined ? v.price : undefined,
        isActive: v.isActive !== false,
        viewImages: v.viewImages || { front: '', back: '', left: '', right: '' }
      }));

      try {
        createdVariants = await CatalogProductVariant.insertMany(catalogVariants, {
          ordered: false // Continue on duplicate key errors
        });
        console.log(`Successfully created ${createdVariants.length} catalog variants`);
      } catch (variantError) {
        console.error('Error creating catalog variants:', variantError);
        // Log the error but don't fail the product creation
        // Variants can be added later via the variants API
      }
    }

    // Transform response to old structure for backward compatibility with frontend
    const productResponse = product.toObject();
    // Add catalogue wrapper for backward compatibility
    productResponse.catalogue = {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      subcategoryIds: product.subcategoryIds,
      productTypeCode: product.productTypeCode,
      tags: product.tags,
      attributes: product.attributes,
      basePrice: product.basePrice
    };
    // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
    productResponse.variants = createdVariants.map(v => {
      const variant = v.toObject ? v.toObject() : v;
      return {
        ...variant,
        sku: variant.skuTemplate || variant.sku,
        price: variant.basePrice,
        skuTemplate: undefined, // Remove skuTemplate to avoid confusion
        basePrice: undefined // Remove basePrice to avoid confusion
      };
    });
    productResponse.availableSizes = [...new Set(createdVariants.map(v => v.size))];
    productResponse.availableColors = [...new Set(createdVariants.map(v => v.color))];

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
    // Base products created by Super Admin should be visible to all users
    // Only filter by isActive, not by createdBy or ownerId
    const query = {};
    if (isActive !== undefined && isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }
    // Note: We don't filter by createdBy here - all products are global base products

    // Handle search - use regex for partial matching (new field names)
    let searchQuery;
    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      searchQuery = CatalogProduct.find({
        ...query,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    } else {
      searchQuery = CatalogProduct.find(query);
    }

    const products = await searchQuery
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(String(limit)));

    // Transform products to old structure for backward compatibility
    // Fetch variants for all products in one query
    const productIds = products.map(p => p._id);
    const allVariants = await CatalogProductVariant.find({
      catalogProductId: { $in: productIds },
      isActive: true
    }).sort({ size: 1, color: 1 });

    // Group variants by product ID
    const variantsByProduct = {};
    allVariants.forEach(v => {
      if (!variantsByProduct[v.catalogProductId]) {
        variantsByProduct[v.catalogProductId] = [];
      }
      variantsByProduct[v.catalogProductId].push(v);
    });

    const transformedProducts = products.map(p => {
      const productObj = p.toObject();
      const variants = variantsByProduct[p._id] || [];
      // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
      const transformedVariants = variants.map(v => {
        const variant = v.toObject ? v.toObject() : v;
        return {
          ...variant,
          sku: variant.skuTemplate || variant.sku,
          price: variant.basePrice,
          skuTemplate: undefined, // Remove skuTemplate to avoid confusion
          basePrice: undefined // Remove basePrice to avoid confusion
        };
      });
      return {
        ...productObj,
        catalogue: {
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          subcategoryIds: p.subcategoryIds,
          productTypeCode: p.productTypeCode,
          tags: p.tags,
          attributes: p.attributes,
          basePrice: p.basePrice
        },
        variants: transformedVariants,
        availableSizes: [...new Set(transformedVariants.map(v => v.size))],
        availableColors: [...new Set(transformedVariants.map(v => v.color))]
      };
    });

    // Count total matching documents
    let countQuery = query;
    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      countQuery = {
        ...query,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    const total = await CatalogProduct.countDocuments(countQuery);

    console.log(`Found ${transformedProducts.length} products out of ${total} total`);

    res.json({
      success: true,
      data: transformedProducts,
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

    // Build query - ONLY active and published products
    // CatalogProduct doesn't have options.visibility, so we only filter by isActive and isPublished
    const isSearchQuery = search && String(search).trim();

    // Combine all filters using $and
    const andConditions = [
      { isActive: true },   // Must be active
      { isPublished: true } // Must be published to appear in catalog
    ];

    // Add category filter if provided (case-insensitive) - new field name
    if (category && String(category).trim()) {
      const categoryTerm = String(category).trim();
      andConditions.push({
        categoryId: { $regex: new RegExp(`^${categoryTerm}$`, 'i') }
      });
      console.log('Applied category filter:', categoryTerm);
    }

    // Add subcategory filter if provided (searches in subcategoryIds array) - new field name
    // Normalize subcategory matching to handle:
    // 1. Hyphenated slugs (tote-bag, tote-bags) vs spaced names (Tote Bag)
    // 2. Singular vs plural variations (bag vs bags)
    if (subcategory && String(subcategory).trim()) {
      const subcategoryTerm = String(subcategory).trim();
      const escapedTerm = subcategoryTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex patterns that match both hyphenated and spaced versions
      // e.g., "tote-bag" or "tote-bags" should match "Tote Bag" in database
      // Convert hyphens to optional space/hyphen pattern: "tote-bag" -> "tote[- ]bag"
      const normalizedPattern = escapedTerm.replace(/-/g, '[- ]');
      
      // Also handle singular/plural variations by making the last word optional
      // e.g., "tote-bags" should match "Tote Bag" (singular in DB)
      // Remove trailing 's' and make it optional: "tote-bags" -> "tote[- ]bag(s)?"
      const singularPattern = normalizedPattern.replace(/s\?$/, '').replace(/s$/, '(s)?');
      
      andConditions.push({
        subcategoryIds: {
          $in: [
            new RegExp(`^${normalizedPattern}$`, 'i'),     // Match hyphenated or spaced (exact)
            new RegExp(`^${singularPattern}$`, 'i'),      // Match with optional plural
            new RegExp(`^${escapedTerm}$`, 'i')           // Also try exact match
          ]
        }
      });
      console.log('Applied subcategory filter:', subcategoryTerm, 'with patterns:', { normalizedPattern, singularPattern });
    }

    // Handle search text matching - add to andConditions if search term exists (new field names)
    if (isSearchQuery) {
      const searchTerm = String(search).trim();
      andConditions.push({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }

    // Add isPublished filter - only show published products in catalog
    andConditions.push({ isPublished: true });

    // Build final query with $and
    const finalQuery = { $and: andConditions };

    console.log('Final query:', JSON.stringify(finalQuery, null, 2));

    // Execute query
    const searchQuery = CatalogProduct.find(finalQuery);

    const products = await searchQuery
      .select('-createdBy -updatedAt -__v') // Exclude admin fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(String(limit)));

    // Transform products to old structure for backward compatibility
    // Fetch variants for all products in one query
    const productIds = products.map(p => p._id);
    const allVariants = await CatalogProductVariant.find({
      catalogProductId: { $in: productIds },
      isActive: true
    }).sort({ size: 1, color: 1 });

    // Group variants by product ID
    const variantsByProduct = {};
    allVariants.forEach(v => {
      if (!variantsByProduct[v.catalogProductId]) {
        variantsByProduct[v.catalogProductId] = [];
      }
      variantsByProduct[v.catalogProductId].push(v);
    });

    const transformedProducts = products.map(p => {
      const productObj = p.toObject();
      const variants = variantsByProduct[p._id] || [];
      // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
      const transformedVariants = variants.map(v => {
        const variant = v.toObject ? v.toObject() : v;
        return {
          ...variant,
          sku: variant.skuTemplate || variant.sku,
          price: variant.basePrice,
          skuTemplate: undefined, // Remove skuTemplate to avoid confusion
          basePrice: undefined // Remove basePrice to avoid confusion
        };
      });
      return {
        ...productObj,
        catalogue: {
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          subcategoryIds: p.subcategoryIds,
          productTypeCode: p.productTypeCode,
          tags: p.tags,
          attributes: p.attributes,
          basePrice: p.basePrice
        },
        variants: transformedVariants,
        availableSizes: [...new Set(transformedVariants.map(v => v.size))],
        availableColors: [...new Set(transformedVariants.map(v => v.color))]
      };
    });

    // Count total matching documents (use same query structure)
    const total = await CatalogProduct.countDocuments(finalQuery);

    console.log(`Found ${transformedProducts.length} active catalog products out of ${total} total`);

    res.json({
      success: true,
      data: transformedProducts,
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
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await CatalogProduct.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Fetch variants from separate collection - only active variants
    const variants = await CatalogProductVariant.find({ 
      catalogProductId: product._id,
      isActive: true
    }).sort({ size: 1, color: 1 });

    // Transform to old structure for backward compatibility
    const productResponse = product.toObject();
    productResponse.catalogue = {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      subcategoryIds: product.subcategoryIds,
      productTypeCode: product.productTypeCode,
      tags: product.tags,
      attributes: product.attributes,
      basePrice: product.basePrice
    };
    // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
    productResponse.variants = variants.map(v => {
      const variant = v.toObject ? v.toObject() : v;
      return {
        ...variant,
        sku: variant.skuTemplate || variant.sku,
        price: variant.basePrice,
        skuTemplate: undefined, // Remove skuTemplate to avoid confusion
        basePrice: undefined // Remove basePrice to avoid confusion
      };
    });
    productResponse.availableSizes = [...new Set(variants.map(v => v.size))];
    productResponse.availableColors = [...new Set(variants.map(v => v.color))];
    productResponse.gst = product.gst; // Ensure gst is included

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
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const product = await CatalogProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields - transform from old structure (catalogue.*) to new structure
    const {
      catalogue,
      details,
      design,
      shipping,
      pricing,
      variants,
      galleryImages,
      isActive,
      isPublished
    } = req.body;

    // Update flat fields from catalogue object
    if (catalogue) {
      if (catalogue.name !== undefined) product.name = catalogue.name;
      if (catalogue.description !== undefined) product.description = catalogue.description;
      if (catalogue.categoryId !== undefined) product.categoryId = catalogue.categoryId;
      if (catalogue.subcategoryIds !== undefined) product.subcategoryIds = catalogue.subcategoryIds;
      if (catalogue.productTypeCode !== undefined) product.productTypeCode = catalogue.productTypeCode;
      if (catalogue.tags !== undefined) product.tags = catalogue.tags;
      if (catalogue.attributes !== undefined) product.attributes = catalogue.attributes;
      if (catalogue.basePrice !== undefined) product.basePrice = catalogue.basePrice;
    }
    if (details !== undefined) product.details = details;
    if (design) product.design = design;
    if (shipping) product.shipping = shipping;
    if (pricing) product.pricing = pricing;
    if (galleryImages) product.galleryImages = galleryImages;
    if (isActive !== undefined) product.isActive = isActive;
    if (isPublished !== undefined) product.isPublished = isPublished;

    // Handle GST update if nested in pricing
    if (pricing && pricing.gst) {
      product.gst = pricing.gst;
    } else if (req.body.gst) {
      product.gst = req.body.gst;
    }

    await product.save();

    // Handle variants update if provided
    // Note: Variants should now be managed via /api/variants endpoints
    // This code maintains backward compatibility for bulk updates
    let updatedVariants = [];
    if (variants && Array.isArray(variants)) {
      console.log(`Updating catalog variants for product ${product._id}...`);

      // Delete existing variants for this product
      await CatalogProductVariant.deleteMany({ catalogProductId: product._id });

      // Create new variants
      if (variants.length > 0) {
        const catalogVariants = variants.map(v => ({
          catalogProductId: product._id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          skuTemplate: v.sku || `${product.productTypeCode}-${v.size}-${v.color}`,
          basePrice: v.price !== undefined ? v.price : undefined,
          isActive: v.isActive !== false,
          viewImages: v.viewImages || { front: '', back: '', left: '', right: '' }
        }));

        try {
          updatedVariants = await CatalogProductVariant.insertMany(catalogVariants, {
            ordered: false
          });
          console.log(`Successfully updated ${updatedVariants.length} catalog variants`);
        } catch (variantError) {
          console.error('Error updating catalog variants:', variantError);
        }
      }
    } else {
      // Fetch existing variants if not updating them - only active variants
      updatedVariants = await CatalogProductVariant.find({ 
        catalogProductId: product._id,
        isActive: true
      }).sort({ size: 1, color: 1 });
    }

    // Transform to old structure for backward compatibility
    const productResponse = product.toObject();
    productResponse.catalogue = {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      subcategoryIds: product.subcategoryIds,
      productTypeCode: product.productTypeCode,
      tags: product.tags,
      attributes: product.attributes,
      basePrice: product.basePrice
    };
    // Transform variants: basePrice -> price, skuTemplate -> sku for frontend compatibility
    productResponse.variants = updatedVariants.map(v => {
      const variant = v.toObject ? v.toObject() : v;
      return {
        ...variant,
        sku: variant.skuTemplate || variant.sku,
        price: variant.basePrice,
        skuTemplate: undefined, // Remove skuTemplate to avoid confusion
        basePrice: undefined // Remove basePrice to avoid confusion
      };
    });
    productResponse.availableSizes = [...new Set(updatedVariants.map(v => v.size))];
    productResponse.availableColors = [...new Set(updatedVariants.map(v => v.color))];

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: productResponse
    });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product permanently from database
// @desc    This is different from toggle - delete removes the product completely
// @access  Private/Admin
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const product = await CatalogProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all variants associated with this product
    const variantDeleteResult = await CatalogProductVariant.deleteMany({
      catalogProductId: req.params.id
    });
    console.log(`Deleted ${variantDeleteResult.deletedCount} catalog variants for product ${req.params.id}`);

    // Permanently delete the product from database
    await CatalogProduct.findByIdAndDelete(req.params.id);

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

// @route   PATCH /api/products/:id/gst
// @desc    Update GST configuration specifically
// @access  Private/Admin
router.patch('/:id/gst', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { slab, mode, hsn } = req.body;

    // Basic validation
    if (slab !== undefined && ![0, 5, 12, 18].includes(slab)) {
      return res.status(400).json({ success: false, message: 'Invalid GST slab' });
    }

    if (mode !== undefined && !['EXCLUSIVE', 'INCLUSIVE'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Invalid GST mode' });
    }

    const product = await CatalogProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update GST config
    if (!product.gst) product.gst = {};
    if (slab !== undefined) product.gst.slab = slab;
    if (mode !== undefined) product.gst.mode = mode;
    if (hsn !== undefined) product.gst.hsn = hsn;

    await product.save();

    res.json({
      success: true,
      message: 'GST configuration updated successfully',
      data: product.gst
    });
  } catch (error) {
    console.error('Error updating GST:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating GST configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

