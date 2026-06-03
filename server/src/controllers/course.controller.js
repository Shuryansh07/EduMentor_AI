import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Course from '../models/Course.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { subject, mine } = req.query;
  const filter = { isPublished: true };
  if (subject) filter.subject = subject;
  if (mine === 'true') {
    filter.$or = [{ teacher: req.user._id }, { students: req.user._id }];
    delete filter.isPublished;
  }
  const courses = await Course.find(filter)
    .sort({ createdAt: -1 })
    .populate('teacher', 'name avatar')
    .lean();
  res.json({ success: true, courses });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('teacher', 'name avatar bio')
    .populate('students', 'name avatar');
  if (!course) throw ApiError.notFound('Course not found');
  res.json({ success: true, course });
});

export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, subject, level, coverImage } = req.body;
  const course = await Course.create({
    title,
    description,
    subject,
    level,
    coverImage,
    teacher: req.user._id,
  });
  res.status(201).json({ success: true, course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  assertTeacherOrAdmin(course, req.user);

  const allowed = ['title', 'description', 'subject', 'level', 'coverImage', 'isPublished'];
  for (const key of allowed) if (req.body[key] !== undefined) course[key] = req.body[key];
  await course.save();
  res.json({ success: true, course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  assertTeacherOrAdmin(course, req.user);
  await course.deleteOne();
  res.json({ success: true, message: 'Course deleted' });
});

export const enroll = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  const id = req.user._id.toString();
  if (course.students.some((s) => s.toString() === id)) {
    throw ApiError.conflict('Already enrolled');
  }
  course.students.push(req.user._id);
  await course.save();
  res.json({ success: true, message: 'Enrolled', studentCount: course.students.length });
});

export const unenroll = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  course.students = course.students.filter((s) => s.toString() !== req.user._id.toString());
  await course.save();
  res.json({ success: true, message: 'Unenrolled' });
});

export const addResource = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  assertTeacherOrAdmin(course, req.user);

  const { title, type, url } = req.body;
  course.resources.push({ title, type, url });
  await course.save();
  res.status(201).json({ success: true, course });
});

export const removeResource = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  assertTeacherOrAdmin(course, req.user);
  course.resources.id(req.params.resourceId)?.deleteOne();
  await course.save();
  res.json({ success: true, course });
});

function assertTeacherOrAdmin(course, user) {
  const owner = course.teacher.toString() === user._id.toString();
  if (!owner && user.role !== 'admin') throw ApiError.forbidden('Not the course owner');
}
