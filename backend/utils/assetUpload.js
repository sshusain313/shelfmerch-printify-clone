const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'shelfmerch-assets';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

/**
 * Upload asset file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} category - Asset category
 * @param {string} type - Asset type
 * @param {string} mimeType - File MIME type
 * @returns {Promise<object>} Upload result with URL and key
 */
async function uploadAssetToS3(fileBuffer, category, type, mimeType) {
  const fileExtension = getExtensionFromMimeType(mimeType);
  const fileKey = `assets/${category}/${type}/${uuidv4()}${fileExtension}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000' // 1 year cache
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    return {
      fileUrl: `${CLOUDFRONT_URL}/${fileKey}`,
      fileKey,
      success: true
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload asset: ${error.message}`);
  }
}

/**
 * Generate and upload preview thumbnail
 * @param {Buffer} fileBuffer - Original file buffer
 * @param {string} mimeType - File MIME type
 * @param {string} originalKey - Original file key for naming
 * @returns {Promise<object>} Preview upload result
 */
async function generateAndUploadPreview(fileBuffer, mimeType, originalKey) {
  const uuid = path.basename(originalKey, path.extname(originalKey));
  const previewKey = `assets/previews/${uuid}.png`;

  let previewBuffer;

  try {
    if (mimeType === 'image/svg+xml') {
      // For SVG, create a rasterized preview
      previewBuffer = await sharp(fileBuffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();
    } else {
      // For PNG/JPG, resize to thumbnail
      previewBuffer = await sharp(fileBuffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: false
        })
        .png()
        .toBuffer();
    }

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: previewKey,
      Body: previewBuffer,
      ContentType: 'image/png',
      CacheControl: 'max-age=31536000'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    return {
      previewUrl: `${CLOUDFRONT_URL}/${previewKey}`,
      previewKey,
      success: true
    };
  } catch (error) {
    console.error('Preview Generation Error:', error);
    // Non-critical error, return null
    return {
      previewUrl: null,
      previewKey: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete asset from S3
 * @param {string} fileKey - S3 file key
 * @returns {Promise<boolean>} Success status
 */
async function deleteAssetFromS3(fileKey) {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return false;
  }
}

/**
 * Delete multiple assets from S3
 * @param {string[]} fileKeys - Array of S3 file keys
 * @returns {Promise<object>} Deletion results
 */
async function deleteBulkAssetsFromS3(fileKeys) {
  const results = await Promise.allSettled(
    fileKeys.map(key => deleteAssetFromS3(key))
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled' && r.value).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value).length
  };
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
function getExtensionFromMimeType(mimeType) {
  const mimeMap = {
    'image/svg+xml': '.svg',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'font/woff': '.woff',
    'font/woff2': '.woff2'
  };

  return mimeMap[mimeType] || '.png';
}

/**
 * Get MIME type from a filename extension
 * @param {string} fileName - File name including extension
 * @returns {string} MIME type
 */
function getMimeTypeFromFileName(fileName) {
  const ext = (fileName || '').toLowerCase().split('.').pop();
  const map = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2'
  };
  return map[ext] || 'image/png';
}

/**
 * Extract image dimensions
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object>} Width and height
 */
async function getImageDimensions(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.error('Failed to extract dimensions:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * Validate image file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<object>} Validation result
 */
async function validateImageFile(fileBuffer, mimeType) {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not supported. Allowed: SVG, PNG, JPG, WEBP`
    };
  }

  if (fileBuffer.length > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 100MB limit'
    };
  }

  // Check dimensions for raster images
  if (mimeType !== 'image/svg+xml') {
    try {
      const dimensions = await getImageDimensions(fileBuffer);

      // Recommend minimum dimensions for print quality
      if (dimensions.width < 500 || dimensions.height < 500) {
        return {
          valid: true,
          warning: 'Image resolution is low. For print quality, recommend 2000x2000px or higher.'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to process image file'
      };
    }
  }

  return { valid: true };
}

module.exports = {
  uploadAssetToS3,
  generateAndUploadPreview,
  deleteAssetFromS3,
  deleteBulkAssetsFromS3,
  getImageDimensions,
  validateImageFile,
  getExtensionFromMimeType,
  getMimeTypeFromFileName
};

