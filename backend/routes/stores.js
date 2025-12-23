const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const { protect } = require('../middleware/auth');

// Helper to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Map backend Store document to frontend Store shape
const mapStoreToFrontend = (storeDoc, includeBuilder = false) => {
  if (!storeDoc) return null;
  const store = storeDoc.toObject ? storeDoc.toObject() : storeDoc;

  const frontendStore = {
    id: store._id.toString(),
    userId: (store.merchant && store.merchant._id) ? store.merchant._id.toString() : store.merchant?.toString(),
    storeName: store.name,
    subdomain: store.slug,
    theme: store.theme || 'modern',
    description: store.description || '',
    logo: store.settings?.logoUrl || undefined,
    productIds: [], // Can be populated from StoreProducts later
    isActive: store.isActive !== undefined ? store.isActive : true,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    settings: {
      primaryColor: store.settings?.primaryColor || undefined,
      accentColor: undefined,
    },
    useBuilder: store.useBuilder || false,
    builderLastPublishedAt: store.builderLastPublishedAt || null,
  };

  // Include builder data when requested (e.g., for storefront rendering)
  if (includeBuilder && store.builder) {
    frontendStore.builder = store.builder;
  }

  return frontendStore;
};

// @route   GET /api/stores/admin/all
// @desc    Get all stores for admin with stats
// @access  Private (superadmin only)
router.get('/admin/all', protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder;

    const total = await Store.countDocuments(query);
    const stores = await Store.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('merchant', 'name email');

    const enhancedStores = await Promise.all(stores.map(async (store) => {
      const productCount = await StoreProduct.countDocuments({ storeId: store._id, isActive: true });
      
      const frontendStore = mapStoreToFrontend(store);
      // Add extra admin-only fields
      frontendStore.productsCount = productCount;
      frontendStore.owner = {
        name: store.merchant?.name || 'Unknown',
        email: store.merchant?.email || 'No email'
      };
      
      return frontendStore;
    }));

    return res.json({
      success: true,
      data: enhancedStores,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin stores:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   POST /api/stores
// @desc    Create a new native store for the current merchant
// @access  Private (merchant or superadmin)
router.post('/', protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!['merchant', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only merchants or superadmins can create stores',
      });
    }

    const { name, theme, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required',
      });
    }

    let baseSlug = generateSlug(name.trim());
    if (!baseSlug) {
      baseSlug = `store-${Date.now().toString(36)}`;
    }

    // Ensure slug uniqueness
    let slug = baseSlug;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await Store.findOne({ slug });
      if (!existing) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const store = await Store.create({
      name: name.trim(),
      slug,
      merchant: user._id,
      type: 'native',
      description: description || '',
      theme: theme || 'modern',
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        primaryColor: '#000000',
      },
      // Do NOT set domain here; leave it undefined so it doesn't trip unique index
      isActive: true,
      isConnected: false,
    });

    const frontendStore = mapStoreToFrontend(store);

    return res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/stores/me
// @desc    Get the current merchant's primary store (first active native store)
// @access  Private
// @query   includeBuilder=true to include full builder data
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    const includeBuilder = req.query.includeBuilder === 'true';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const store = await Store.findOne({
      merchant: user._id,
      isActive: true,
      type: 'native',
    }).sort({ createdAt: 1 });

    if (!store) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const frontendStore = mapStoreToFrontend(store, includeBuilder);

    return res.json({
      success: true,
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update basic store settings (owner or superadmin)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID format',
      });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this store',
      });
    }

    const { description, theme, settings } = req.body || {};

    if (typeof description === 'string') {
      store.description = description;
    }

    if (typeof theme === 'string') {
      store.theme = theme;
    }

    if (settings && typeof settings === 'object') {
      store.settings = {
        ...store.settings,
        ...settings,
      };
    }

    await store.save();

    const frontendStore = mapStoreToFrontend(store);

    return res.json({
      success: true,
      message: 'Store updated successfully',
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   PATCH /api/stores/:id/suspend
// @desc    Suspend or unsuspend a store (toggle isActive)
// @access  Private (superadmin only)
router.patch('/:id/suspend', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only superadmin can suspend stores
    if (user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Superadmin access required.'
      });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID format',
      });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Toggle isActive status
    store.isActive = !store.isActive;
    await store.save();

    const frontendStore = mapStoreToFrontend(store);

    return res.json({
      success: true,
      message: `Store ${store.isActive ? 'reactivated' : 'suspended'} successfully`,
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error suspending store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/stores
// @desc    Get all active native stores for the current merchant
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const stores = await Store.find({
      merchant: user._id,
      isActive: true,
      type: 'native',
    }).sort({ createdAt: 1 });

    const frontendStores = stores.map(mapStoreToFrontend);

    return res.json({
      success: true,
      data: frontendStores,
    });
  } catch (error) {
    console.error('Error fetching stores list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID (for builder access)
// @access  Private (owner or superadmin)
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const includeBuilder = req.query.includeBuilder === 'true';

    // Check if id is a valid ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID format',
      });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization: only owner or superadmin
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this store',
      });
    }

    const frontendStore = mapStoreToFrontend(store, includeBuilder);

    return res.json({
      success: true,
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error fetching store by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/stores/by-subdomain/:slug
// @desc    Get public store data by subdomain (slug) - includes builder for rendering
// @access  Public
router.get('/by-subdomain/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const store = await Store.findOne({
      slug,
      isActive: true,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Include builder data for storefront rendering
    const frontendStore = mapStoreToFrontend(store, true);

    return res.json({
      success: true,
      data: frontendStore,
    });
  } catch (error) {
    console.error('Error fetching store by subdomain:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/stores/admin/all
// @desc    Get all stores for admin with pagination, sorting, and search
// @access  Private (superadmin only)
router.get('/admin/all', protect, async (req, res) => {
  try {
    const user = req.user;

    // Check superadmin role
    if (user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Superadmin access required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build query for initial match
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count (approximation before lookup)
    const total = await Store.countDocuments(query);

    // Aggregation pipeline
    const pipeline = [
      { $match: query },
      // Lookup merchant (owner)
      {
        $lookup: {
          from: 'users',
          localField: 'merchant',
          foreignField: '_id',
          as: 'merchantInfo'
        }
      },
      { $unwind: { path: '$merchantInfo', preserveNullAndEmptyArrays: true } },
      // Lookup products to get count
      // Optimization: Instead of getting all fields, we could try to just get ID, but $lookup brings everything.
      // For performance on large datasets, a separate count query per store page might be better, 
      // but for "All Stores" table usually $lookup is acceptable if paginated.
      {
        $lookup: {
          from: 'storeproducts',
          localField: '_id',
          foreignField: 'storeId',
          as: 'storeProducts'
        }
      },
      {
        $addFields: {
          productsCount: { $size: '$storeProducts' },
          ownerName: '$merchantInfo.name',
          ownerEmail: '$merchantInfo.email'
        }
      },
      {
        $project: {
          storeProducts: 0,
          merchantInfo: 0,
          settings: 0, // Exclude heavy fields if not needed
          apiCredentials: 0
        }
      },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ];

    const stores = await Store.aggregate(pipeline);

    const mappedStores = stores.map(store => ({
      id: store._id,
      storeName: store.name,
      subdomain: store.slug,
      owner: {
        id: store.merchant,
        name: store.ownerName || 'Unknown',
        email: store.ownerEmail || 'Unknown'
      },
      productsCount: store.productsCount || 0,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      isActive: store.isActive,
      status: store.isActive ? 'Active' : 'Inactive'
    }));

    return res.json({
      success: true,
      data: mappedStores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin stores:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;





