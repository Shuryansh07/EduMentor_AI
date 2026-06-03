import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import env from './env.js';
import logger from './logger.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export const isCloudinaryConfigured = () =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

/**
 * Upload an in-memory buffer (from multer memoryStorage) to Cloudinary.
 * Uses `resource_type: 'auto'` so PDFs/DOCX upload as `raw`, images as `image`.
 */
export function uploadBuffer(buffer, { folder, filename, resourceType = 'auto' } = {}) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured (check CLOUDINARY_* env vars)'));
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || env.cloudinary.folder,
        resource_type: resourceType,
        public_id: filename ? `${filename}-${Math.random().toString(36).slice(2, 8)}` : undefined,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error.message);
          return reject(error);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function destroyAsset(publicId, resourceType = 'raw') {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    logger.warn('Cloudinary destroy failed:', err.message);
  }
}

export default cloudinary;
