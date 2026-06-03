import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Quiz from '../models/Quiz.js';
import { generateQuiz } from '../services/ai.service.js';
import { assertCanModifyQuiz } from '../services/quiz.service.js';

/** AI-generate a quiz with Gemini and persist it. */
export const generate = asyncHandler(async (req, res) => {
  const { subject, topic, difficulty, count, save = true, course } = req.body;

  const generated = await generateQuiz({ subject, topic, difficulty, count });

  if (!save) {
    // Preview without persisting (e.g. "regenerate" before saving).
    return res.json({ success: true, preview: { ...generated, subject, topic, difficulty } });
  }

  const quiz = await Quiz.create({
    title: generated.title,
    subject,
    topic,
    difficulty: difficulty || 'beginner',
    questions: generated.questions,
    source: 'ai',
    createdBy: req.user._id,
    course: course || null,
  });

  res.status(201).json({ success: true, quiz });
});

/** Teacher/manual quiz creation. */
export const create = asyncHandler(async (req, res) => {
  const { title, subject, topic, difficulty, questions, course } = req.body;
  const quiz = await Quiz.create({
    title,
    subject,
    topic,
    difficulty,
    questions,
    source: 'manual',
    createdBy: req.user._id,
    course: course || null,
  });
  res.status(201).json({ success: true, quiz });
});

export const list = asyncHandler(async (req, res) => {
  const { subject, difficulty, mine } = req.query;
  const filter = { isPublished: true };
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  if (mine === 'true') filter.createdBy = req.user._id;

  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .limit(60)
    .select('-questions.correctIndex -questions.explanation') // hide the key in lists
    .populate('createdBy', 'name role')
    .lean();

  res.json({ success: true, quizzes });
});

/**
 * Get a quiz for attempting. By default the answer key is stripped so students
 * can't cheat; owners/admins get the full document.
 */
export const getOne = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name role');
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const isOwner = quiz.createdBy._id.toString() === req.user._id.toString();
  const reveal = isOwner || req.user.role === 'admin' || req.query.reveal === 'true';

  const data = quiz.toObject();
  if (!reveal) {
    data.questions = data.questions.map(({ correctIndex, explanation, ...rest }) => rest);
  }
  res.json({ success: true, quiz: data });
});

export const remove = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  assertCanModifyQuiz(quiz, req.user);
  await quiz.deleteOne();
  res.json({ success: true, message: 'Quiz deleted' });
});
