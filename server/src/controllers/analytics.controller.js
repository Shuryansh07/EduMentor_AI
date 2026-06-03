import asyncHandler from '../utils/asyncHandler.js';
import * as analytics from '../services/analytics.service.js';

export const studentDashboard = asyncHandler(async (req, res) => {
  const data = await analytics.studentAnalytics(req.user._id);
  res.json({ success: true, data });
});

export const teacherDashboard = asyncHandler(async (req, res) => {
  const data = await analytics.teacherAnalytics(req.user._id);
  res.json({ success: true, data });
});

export const adminDashboard = asyncHandler(async (req, res) => {
  const data = await analytics.adminAnalytics();
  res.json({ success: true, data });
});
