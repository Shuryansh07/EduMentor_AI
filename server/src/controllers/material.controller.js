import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import StudyMaterial from '../models/StudyMaterial.js';
import { uploadBuffer, destroyAsset } from '../config/cloudinary.js';
import { detectFileKind } from '../middleware/upload.js';
import env from '../config/env.js';

/** Build a Mongo filter from query params (subject, tag, search, mine). */
function buildFilter(req) {
  const filter = {};
  const { subject, tag, search, mine } = req.query;

  if (mine === 'true') filter.uploadedBy = req.user._id;
  else {
    // Non-owners only see public/course materials, plus their own.
    filter.$or = [{ visibility: { $in: ['public', 'course'] } }, { uploadedBy: req.user._id }];
  }
  if (subject) filter.subject = subject;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };
  return filter;
}

export const listMaterials = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);

  const filter = buildFilter(req);
  const [items, total] = await Promise.all([
    StudyMaterial.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('uploadedBy', 'name role avatar')
      .lean(),
    StudyMaterial.countDocuments(filter),
  ]);

  res.json({ success: true, items, page, total, pages: Math.ceil(total / limit) });
});

export const getMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id).populate('uploadedBy', 'name role');
  if (!material) throw ApiError.notFound('Material not found');
  res.json({ success: true, material });
});

export const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { title, description, subject, tags, visibility } = req.body;

  const kind = detectFileKind(req.file.mimetype);
  const resourceType = kind === 'image' ? 'image' : 'raw';

  const result = await uploadBuffer(req.file.buffer, {
    folder: `${env.cloudinary.folder}/materials`,
    resourceType,
    filename: title?.slice(0, 40) || 'material',
  });

  const material = await StudyMaterial.create({
    title,
    description,
    subject,
    tags: normalizeTags(tags),
    fileUrl: result.secure_url,
    filePublicId: result.public_id,
    fileType: kind,
    fileSize: req.file.size,
    resourceType,
    visibility: visibility || 'private',
    uploadedBy: req.user._id,
  });

  res.status(201).json({ success: true, material });
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw ApiError.notFound('Material not found');
  assertOwnerOrAdmin(material, req.user);

  const allowed = ['title', 'description', 'subject', 'visibility'];
  for (const key of allowed) if (req.body[key] !== undefined) material[key] = req.body[key];
  if (req.body.tags !== undefined) material.tags = normalizeTags(req.body.tags);

  await material.save();
  res.json({ success: true, material });
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw ApiError.notFound('Material not found');
  assertOwnerOrAdmin(material, req.user);

  await destroyAsset(material.filePublicId, material.resourceType);
  await material.deleteOne();
  res.json({ success: true, message: 'Material deleted' });
});

// ── helpers ─────────────────────────────────────────────────────────────
function assertOwnerOrAdmin(material, user) {
  const owner = material.uploadedBy.toString() === user._id.toString();
  if (!owner && user.role !== 'admin') throw ApiError.forbidden('Not allowed');
}

function normalizeTags(tags) {
  if (!tags) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(',');
  return arr.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12);
}
