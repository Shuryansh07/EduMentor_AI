import { body, param } from 'express-validator';

// ── Materials ───────────────────────────────────────────────────────────
export const materialCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 160 }),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('description').optional().isLength({ max: 2000 }),
  body('visibility').optional().isIn(['private', 'course', 'public']),
];

// ── Quizzes ─────────────────────────────────────────────────────────────
export const quizGenerateRules = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be 1–20'),
];

export const quizCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 2, max: 6 }).withMessage('2–6 options per question'),
  body('questions.*.correctIndex').isInt({ min: 0 }).withMessage('correctIndex is required'),
];

// ── Attempts ────────────────────────────────────────────────────────────
export const attemptRules = [
  body('quizId').isMongoId().withMessage('Valid quizId is required'),
  body('responses').isArray().withMessage('responses must be an array'),
  body('responses.*.questionId').isMongoId().withMessage('Valid questionId is required'),
  body('responses.*.selectedIndex').isInt({ min: -1 }),
];

// ── Chat ────────────────────────────────────────────────────────────────
export const chatRules = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 4000 }),
  // New conversations send sessionId: null — treat null/empty as "omitted".
  body('sessionId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid sessionId'),
];

// ── Courses ─────────────────────────────────────────────────────────────
export const courseCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
];

export const resourceRules = [
  body('title').trim().notEmpty().withMessage('Resource title is required'),
  body('type').optional().isIn(['link', 'file', 'video', 'note']),
  body('url').optional().isString(),
];

// ── Shared ──────────────────────────────────────────────────────────────
export const idParam = [param('id').isMongoId().withMessage('Invalid id')];
