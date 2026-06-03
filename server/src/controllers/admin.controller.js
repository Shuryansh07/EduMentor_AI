import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User, { ROLES } from '../models/User.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Course from '../models/Course.js';
import { destroyAsset } from '../config/cloudinary.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) throw ApiError.badRequest('Invalid role');
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive, $inc: { tokenVersion: 1 } }, // revoke sessions on deactivate
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, message: 'User removed' });
});

// ── Content moderation ────────────────────────────────────────────────────
export const flagMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findByIdAndUpdate(
    req.params.id,
    { isFlagged: Boolean(req.body.isFlagged) },
    { new: true }
  );
  if (!material) throw ApiError.notFound('Material not found');
  res.json({ success: true, material });
});

export const removeMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw ApiError.notFound('Material not found');
  await destroyAsset(material.filePublicId, material.resourceType);
  await material.deleteOne();
  res.json({ success: true, message: 'Material removed' });
});

export const listFlagged = asyncHandler(async (req, res) => {
  const materials = await StudyMaterial.find({ isFlagged: true })
    .populate('uploadedBy', 'name email')
    .lean();
  res.json({ success: true, materials });
});

export const removeCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  res.json({ success: true, message: 'Course removed' });
});
