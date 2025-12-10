const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const Asset = require('../models/Asset');
const { protect, adminOnly } = require('../middleware/auth');
const { 
  uploadAssetToS3, 
  generateAndUploadPreview, 
  deleteAssetFromS3,
  validateImageFile,
  getImageDimensions,
  getMimeTypeFromFileName
} = require('../utils/assetUpload');
const { validateSVG, extractSVGDimensions } = require('../utils/svgSanitizer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/svg+xml',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  }
});

// ============================================
// PUBLIC ROUTES - For Design Editor
// ============================================

/**
 * @route   GET /api/assets
 * @desc    List all published assets with filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      tags,
      search,
      page = 1,
      limit = 50,
      sort = '-createdAt'
    } = req.query;

    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const assets = await Asset.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-svgContent') // Don't send full SVG in list
      .lean();

    const total = await Asset.countDocuments(filter);

    res.json({
      success: true,
      data: assets,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset with full details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Asset not available'
      });
    }

    // Increment view count
    asset.incrementViews();

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/assets/:id/download
 * @desc    Track asset download
 * @access  Public
 */
router.post('/:id/download', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.incrementDownloads();

    res.json({
      success: true,
      message: 'Download tracked'
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track download'
    });
  }
});

// ============================================
// ADMIN ROUTES - For Asset Management
// ============================================

/**
 * @route   POST /api/assets/admin/upload
 * @desc    Upload single asset
 * @access  Admin only
 */
router.post('/admin/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      title,
      description,
      category,
      type,
      tags,
      recommendedWidth,
      recommendedHeight,
      designNotes,
      usage,
      license,
      fontFamily,
      sampleText,
      seamless,
      patternRepeat
    } = req.body;

    // Validate required fields
    if (!title || !category || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and type are required'
      });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    let sanitizedContent = null;
    let dimensions = { width: 0, height: 0 };

    // Handle SVG files
    if (mimeType === 'image/svg+xml') {
      const svgValidation = validateSVG(fileBuffer);
      
      if (!svgValidation.valid) {
        return res.status(400).json({
          success: false,
          message: svgValidation.error
        });
      }

      sanitizedContent = svgValidation.sanitized;
      dimensions = extractSVGDimensions(sanitizedContent);
    } else {
      // Handle raster images
      const imageValidation = await validateImageFile(fileBuffer, mimeType);
      
      if (!imageValidation.valid) {
        return res.status(400).json({
          success: false,
          message: imageValidation.error
        });
      }

      dimensions = await getImageDimensions(fileBuffer);
    }

    // Upload to S3
    const uploadResult = await uploadAssetToS3(fileBuffer, category, type, mimeType);
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to S3'
      });
    }

    // Generate preview thumbnail
    const previewResult = await generateAndUploadPreview(
      fileBuffer,
      mimeType,
      uploadResult.fileKey
    );

    // Parse tags
    const tagArray = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    // Create asset document
    const asset = new Asset({
      title,
      description: description || '',
      tags: tagArray,
      type,
      category,
      fileUrl: uploadResult.fileUrl,
      previewUrl: previewResult.previewUrl,
      svgContent: sanitizedContent,
      recommendedSize: {
        width: parseInt(recommendedWidth) || dimensions.width,
        height: parseInt(recommendedHeight) || dimensions.height
      },
      dimensions,
      designNotes: designNotes || '',
      usage: usage || 'all',
      license: license || 'commercial',
      fileKey: uploadResult.fileKey,
      previewKey: previewResult.previewKey,
      uploadedBy: req.user._id,
      fileSize: fileBuffer.length,
      mimeType,
      fontFamily,
      sampleText,
      seamless: seamless === 'true',
      patternRepeat: patternRepeat || 'repeat'
    });

    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/assets/admin/batch
 * @desc    Batch upload assets from ZIP
 * @access  Admin only
 */
router.post('/admin/batch', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No ZIP file uploaded'
      });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    // Find metadata.json
    const metadataEntry = zipEntries.find(entry => entry.entryName === 'metadata.json');
    
    if (!metadataEntry) {
      return res.status(400).json({
        success: false,
        message: 'metadata.json not found in ZIP'
      });
    }

    const metadata = JSON.parse(metadataEntry.getData().toString('utf8'));
    const results = [];
    const errors = [];

    // Process each asset
    for (const assetMeta of metadata) {
      try {
        const fileEntry = zipEntries.find(entry => 
          entry.entryName === assetMeta.fileName || 
          entry.entryName === `assets/${assetMeta.fileName}`
        );

        if (!fileEntry) {
          errors.push({
            fileName: assetMeta.fileName,
            error: 'File not found in ZIP'
          });
          continue;
        }

        const fileBuffer = fileEntry.getData();
        const mimeType = getMimeTypeFromFileName(assetMeta.fileName);

        // Upload to S3
        const uploadResult = await uploadAssetToS3(
          fileBuffer,
          assetMeta.category,
          assetMeta.type,
          mimeType
        );

        // Generate preview
        const previewResult = await generateAndUploadPreview(
          fileBuffer,
          mimeType,
          uploadResult.fileKey
        );

        // Get dimensions
        let dimensions = { width: 0, height: 0 };
        if (mimeType === 'image/svg+xml') {
          const svgValidation = validateSVG(fileBuffer);
          dimensions = extractSVGDimensions(svgValidation.sanitized);
        } else {
          dimensions = await getImageDimensions(fileBuffer);
        }

        // Create asset
        const asset = new Asset({
          title: assetMeta.title,
          description: assetMeta.description || '',
          tags: assetMeta.tags || [],
          type: assetMeta.type,
          category: assetMeta.category,
          fileUrl: uploadResult.fileUrl,
          previewUrl: previewResult.previewUrl,
          recommendedSize: assetMeta.recommendedSize || dimensions,
          dimensions,
          designNotes: assetMeta.designNotes || '',
          usage: assetMeta.usage || 'all',
          license: assetMeta.license || 'commercial',
          fileKey: uploadResult.fileKey,
          previewKey: previewResult.previewKey,
          uploadedBy: req.user._id,
          fileSize: fileBuffer.length,
          mimeType
        });

        await asset.save();
        results.push({
          fileName: assetMeta.fileName,
          assetId: asset._id,
          success: true
        });
      } catch (error) {
        errors.push({
          fileName: assetMeta.fileName,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Batch upload completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error in batch upload:', error);
    res.status(500).json({
      success: false,
      message: 'Batch upload failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/assets/admin/all
 * @desc    List all assets (including unpublished) for admin
 * @access  Admin only
 */
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const {
      category,
      type,
      isPublished,
      page = 1,
      limit = 50,
      sort = '-createdAt'
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const assets = await Asset.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('uploadedBy', 'name email')
      .lean();

    const total = await Asset.countDocuments(filter);

    res.json({
      success: true,
      data: assets,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/assets/admin/:id
 * @desc    Update asset metadata
 * @access  Admin only
 */
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'tags', 'designNotes', 'usage', 'license',
      'isPublished', 'recommendedSize', 'fontFamily', 'sampleText',
      'seamless', 'patternRepeat'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    });

    await asset.save();

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/assets/admin/:id
 * @desc    Delete asset
 * @access  Admin only
 */
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Delete from S3
    await deleteAssetFromS3(asset.fileKey);
    if (asset.previewKey) {
      await deleteAssetFromS3(asset.previewKey);
    }

    // Delete from database
    await asset.deleteOne();

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
});

module.exports = router;

