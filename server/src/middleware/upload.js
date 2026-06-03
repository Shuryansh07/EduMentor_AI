import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Keep files in memory and stream straight to Cloudinary (no disk writes).
const storage = multer.memoryStorage();

const DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

function fileFilter(allowed) {
  return (req, file, cb) => {
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  };
}

/** Study materials: PDF / DOCX / notes, up to 15 MB. */
export const uploadMaterial = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: fileFilter(new Set([...DOC_TYPES, ...IMAGE_TYPES])),
}).single('file');

/** Avatars: images only, up to 3 MB. */
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: fileFilter(IMAGE_TYPES),
}).single('avatar');

export function detectFileKind(mimetype = '') {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('word')) return 'docx';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('text/')) return 'note';
  return 'file';
}
