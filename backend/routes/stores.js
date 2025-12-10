const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
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
const mapStoreToFrontend = (storeDoc) => {
  if (!storeDoc) return null;
  const store = storeDoc.toObject();

  return {
    id: store._id.toString(),
    userId: store.merchant?.toString(),
    storeName: store.name,
    subdomain: store.slug,
    theme: store.theme || 'modern',
    description: store.description || '',
    logo: store.settings?.logoUrl || undefined,
    productIds: [], // Can be populated from StoreProducts later
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    settings: {
      primaryColor: store.settings?.primaryColor || undefined,
      accentColor: undefined,
    },
    useBuilder: false,
    builder: undefined,
  };
};

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
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;

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

    const frontendStore = mapStoreToFrontend(store);

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

// @route   GET /api/stores/by-subdomain/:slug
// @desc    Get public store data by subdomain (slug)
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

    const frontendStore = mapStoreToFrontend(store);

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

module.exports = router;





