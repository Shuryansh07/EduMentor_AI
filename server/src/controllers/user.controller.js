import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { uploadBuffer, destroyAsset } from '../config/cloudinary.js';
import env from '../config/env.js';

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'subjects'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  user.tokenVersion += 1; // revoke other sessions
  await user.save();
  res.json({ success: true, message: 'Password changed' });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');

  const result = await uploadBuffer(req.file.buffer, {
    folder: `${env.cloudinary.folder}/avatars`,
    resourceType: 'image',
    filename: `avatar-${req.user._id}`,
  });

  // Remove the previous avatar if any.
  if (req.user.avatar?.publicId) await destroyAsset(req.user.avatar.publicId, 'image');

  req.user.avatar = { url: result.secure_url, publicId: result.public_id };
  await req.user.save({ validateBeforeSave: false });

  res.json({ success: true, user: req.user });
});
