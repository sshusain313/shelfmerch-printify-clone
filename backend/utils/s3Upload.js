const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.replace(/^"|"$/g, '') || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.replace(/^"|"$/g, '') || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME?.replace(/^"|"$/g, '') || '';

if (!BUCKET_NAME) {
  console.warn('⚠️  S3_BUCKET_NAME not set in environment variables');
}

/**
 * Upload a file buffer to S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFileName - Original filename for extension
 * @param {string} folder - Folder path in S3 (e.g., 'gallery', 'mockups')
 * @returns {Promise<string>} - The S3 URL of the uploaded file
 */
const uploadToS3 = async (fileBuffer, originalFileName, folder = 'uploads') => {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }

  try {
    // Get file extension
    const ext = path.extname(originalFileName).toLowerCase() || '.jpg';

    // Generate unique filename
    const fileName = `${folder}/${uuidv4()}${ext}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: getContentType(ext),
      // Note: ACL removed - use bucket policy for public access instead
    });

    await s3Client.send(command);

    // Return the public URL
    const region = process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;

    console.log(`✅ Uploaded to S3: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Delete a file from S3
 * @param {string} s3Url - The S3 URL of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (s3Url) => {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }

  try {
    // Extract key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/key
    const urlParts = s3Url.split('.amazonaws.com/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }

    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ Deleted from S3: ${key}`);
  } catch (error) {
    console.error('❌ Error deleting from S3:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

/**
 * Get content type based on file extension
 * @param {string} ext - File extension
 * @returns {string} - Content type
 */
const getContentType = (ext) => {
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
};

/**
 * Convert base64 string to buffer
 * @param {string} base64String - Base64 encoded string (with or without data URL prefix)
 * @returns {Buffer} - File buffer
 */
const base64ToBuffer = (base64String) => {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;

  return Buffer.from(base64Data, 'base64');
};

/**
 * Check if a URL is a base64 data URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
const isBase64Url = (url) => {
  return typeof url === 'string' && (url.startsWith('data:') || url.length > 1000);
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  base64ToBuffer,
  isBase64Url,
};

