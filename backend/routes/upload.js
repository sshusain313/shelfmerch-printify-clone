const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { uploadToS3, base64ToBuffer, isBase64Url } = require('../utils/s3Upload');

// Configure multer for memory storage (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Configure multer for video uploads
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
});

// @route   POST /api/upload/image
// @desc    Upload an image file to S3
// @access  Private (merchant, superadmin)
router.post('/image', protect, authorize('merchant', 'superadmin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const folder = req.body.folder || 'uploads';
    console.log(`📤 Uploading image to S3 folder: ${folder}`);
    
    const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, folder);

    res.json({
      success: true,
      url: s3Url,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

// @route   POST /api/upload/base64
// @desc    Upload a base64 image to S3
// @desc    This endpoint handles base64 images (for backward compatibility)
// @access  Private/Admin
router.post('/base64', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { base64, fileName, folder } = req.body;

    if (!base64) {
      return res.status(400).json({
        success: false,
        message: 'No base64 data provided'
      });
    }

    console.log(`📤 Uploading base64 image to S3 folder: ${folder || 'uploads'}`);

    // Convert base64 to buffer
    const fileBuffer = base64ToBuffer(base64);
    const originalFileName = fileName || 'image.jpg';
    const uploadFolder = folder || 'uploads';

    const s3Url = await uploadToS3(fileBuffer, originalFileName, uploadFolder);

    res.json({
      success: true,
      url: s3Url,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading base64 image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

// @route   POST /api/upload/batch
// @desc    Upload multiple images to S3
// @access  Private/Admin
router.post('/batch', protect, authorize('superadmin'), upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const folder = req.body.folder || 'uploads';
    console.log(`📤 Uploading ${req.files.length} images to S3 folder: ${folder}`);
    
    const uploadPromises = req.files.map(file => 
      uploadToS3(file.buffer, file.originalname, folder)
    );

    const urls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      urls,
      message: `${urls.length} image(s) uploaded successfully`
    });
  } catch (error) {
    console.error('❌ Error uploading batch images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
});

// @route   POST /api/upload/video
// @desc    Upload a video file to S3
// @access  Private (merchant, superadmin)
router.post('/video', protect, authorize('merchant', 'superadmin'), uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    // Validate that it's actually a video file
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({
        success: false,
        message: 'File must be a video'
      });
    }

    const folder = req.body.folder || 'videos';
    console.log(`📤 Uploading video to S3 folder: ${folder}`);
    
    const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, folder);

    res.json({
      success: true,
      url: s3Url,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video'
    });
  }
});

module.exports = router;






