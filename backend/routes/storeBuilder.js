const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/auth');

// Default builder template for new stores
const createDefaultBuilder = () => ({
  version: '1.0',
  pages: [
    {
      id: 'home',
      name: 'Home',
      slug: '/',
      isSystemPage: true,
      sections: [],
    },
    {
      id: 'product',
      name: 'Product Page',
      slug: '/product',
      isSystemPage: true,
      sections: [],
    },
  ],
  activePageId: 'home',
  globalStyles: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    buttonStyle: 'rounded',
    cardStyle: 'elevated',
    spacing: 'normal',
  },
  draft: true,
});

// Ensure system pages exist (home and product pages)
const ensureSystemPages = (builderData) => {
  if (!builderData || !builderData.pages) {
    return createDefaultBuilder();
  }

  const pages = [...builderData.pages];

  const ensurePage = (slug, name) => {
    const existing = pages.find((page) => page.slug === slug);
    if (!existing) {
      pages.push({
        id: `${slug.replace(/\W+/g, '')}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        slug,
        isSystemPage: true,
        sections: [],
      });
    }
  };

  ensurePage('/', 'Home');
  ensurePage('/product', 'Product Page');

  const activePageId =
    builderData.activePageId && pages.some((page) => page.id === builderData.activePageId)
      ? builderData.activePageId
      : pages[0]?.id;

  return {
    ...builderData,
    pages,
    activePageId,
  };
};

// Basic validation for builder data
const validateBuilder = (builder) => {
  if (!builder || typeof builder !== 'object') {
    return { valid: false, message: 'Builder data must be an object' };
  }

  if (!Array.isArray(builder.pages)) {
    return { valid: false, message: 'Builder must have a pages array' };
  }

  // Validate each page has required fields
  for (const page of builder.pages) {
    if (!page.id || typeof page.id !== 'string') {
      return { valid: false, message: 'Each page must have an id' };
    }
    if (!page.name || typeof page.name !== 'string') {
      return { valid: false, message: 'Each page must have a name' };
    }
    if (!page.slug || typeof page.slug !== 'string') {
      return { valid: false, message: 'Each page must have a slug' };
    }
    if (!Array.isArray(page.sections)) {
      return { valid: false, message: 'Each page must have a sections array' };
    }
  }

  return { valid: true };
};

// Sanitize custom HTML to prevent XSS (basic sanitization)
const sanitizeBuilder = (builder) => {
  if (!builder || !builder.pages) return builder;

  const sanitizedBuilder = JSON.parse(JSON.stringify(builder));

  for (const page of sanitizedBuilder.pages) {
    if (!page.sections) continue;
    
    for (const section of page.sections) {
      // Sanitize custom-html sections
      if (section.type === 'custom-html' && section.settings?.html) {
        // Remove script tags and event handlers
        let html = section.settings.html;
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
        html = html.replace(/javascript:/gi, '');
        section.settings.html = html;
      }
    }
  }

  return sanitizedBuilder;
};

// @route   GET /api/stores/:id/builder
// @desc    Get builder data for a store
// @access  Private (merchant who owns store, or superadmin)
router.get('/:id/builder', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization check: merchant can only access their own stores
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this store',
      });
    }

    // Return existing builder data or create default
    const builderData = store.builder
      ? ensureSystemPages(store.builder)
      : createDefaultBuilder();

    return res.json({
      success: true,
      data: builderData,
    });
  } catch (error) {
    console.error('Error fetching store builder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store builder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   PUT /api/stores/:id/builder
// @desc    Save builder draft for a store
// @access  Private (merchant who owns store, or superadmin)
router.put('/:id/builder', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const builderPayload = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization check
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this store',
      });
    }

    // Validate builder data
    const validation = validateBuilder(builderPayload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Sanitize and ensure system pages
    let sanitizedBuilder = sanitizeBuilder(builderPayload);
    sanitizedBuilder = ensureSystemPages(sanitizedBuilder);

    // Mark as draft and set last saved time
    sanitizedBuilder.draft = true;
    sanitizedBuilder.lastSaved = new Date().toISOString();

    // Update store
    store.builder = sanitizedBuilder;
    await store.save();

    return res.json({
      success: true,
      message: 'Builder draft saved',
      data: store.builder,
    });
  } catch (error) {
    console.error('Error saving store builder draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save builder draft',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   POST /api/stores/:id/builder/publish
// @desc    Publish builder configuration (make it live)
// @access  Private (merchant who owns store, or superadmin)
router.post('/:id/builder/publish', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const builderPayload = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization check
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this store',
      });
    }

    // Use provided builder data or existing draft
    let finalBuilder = builderPayload && Object.keys(builderPayload).length > 0
      ? builderPayload
      : store.builder;

    if (!finalBuilder) {
      return res.status(400).json({
        success: false,
        message: 'No builder data to publish',
      });
    }

    // Validate
    const validation = validateBuilder(finalBuilder);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Sanitize and ensure system pages
    finalBuilder = sanitizeBuilder(finalBuilder);
    finalBuilder = ensureSystemPages(finalBuilder);

    // Mark as published
    finalBuilder.draft = false;
    finalBuilder.lastSaved = new Date().toISOString();

    // Update store
    store.builder = finalBuilder;
    store.useBuilder = true;
    store.builderLastPublishedAt = new Date();
    await store.save();

    return res.json({
      success: true,
      message: 'Store builder published successfully',
      data: {
        builder: store.builder,
        useBuilder: store.useBuilder,
        builderLastPublishedAt: store.builderLastPublishedAt,
      },
    });
  } catch (error) {
    console.error('Error publishing store builder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish builder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   DELETE /api/stores/:id/builder
// @desc    Reset builder to default template
// @access  Private (merchant who owns store, or superadmin)
router.delete('/:id/builder', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization check
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this store',
      });
    }

    // Reset to default
    store.builder = createDefaultBuilder();
    store.useBuilder = false;
    store.builderLastPublishedAt = null;
    await store.save();

    return res.json({
      success: true,
      message: 'Builder reset to default',
      data: store.builder,
    });
  } catch (error) {
    console.error('Error resetting store builder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset builder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   PATCH /api/stores/:id/builder/toggle
// @desc    Toggle useBuilder on/off without modifying builder data
// @access  Private (merchant who owns store, or superadmin)
router.patch('/:id/builder/toggle', protect, authorize('merchant', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { useBuilder } = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Authorization check
    if (user.role !== 'superadmin' && String(store.merchant) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this store',
      });
    }

    if (typeof useBuilder !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'useBuilder must be a boolean',
      });
    }

    store.useBuilder = useBuilder;
    await store.save();

    return res.json({
      success: true,
      message: `Store builder ${useBuilder ? 'enabled' : 'disabled'}`,
      data: {
        useBuilder: store.useBuilder,
      },
    });
  } catch (error) {
    console.error('Error toggling store builder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle builder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;



