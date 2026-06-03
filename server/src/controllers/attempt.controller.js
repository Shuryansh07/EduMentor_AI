import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { gradeAttempt } from '../services/quiz.service.js';

/** Submit answers, grade server-side, store the attempt and return the result. */
export const submit = asyncHandler(async (req, res) => {
  const { quizId, responses, durationSeconds } = req.body;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const attempt = await gradeAttempt({
    quiz,
    user: req.user,
    responses,
    durationSeconds: Number(durationSeconds) || 0,
  });

  // Return graded answers WITH explanations so the student can review.
  const reviewed = quiz.questions.map((q) => {
    const a = attempt.answers.find((x) => x.questionId.toString() === q._id.toString());
    return {
      questionId: q._id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: a?.selectedIndex ?? -1,
      isCorrect: a?.isCorrect ?? false,
      explanation: q.explanation,
    };
  });

  res.status(201).json({
    success: true,
    result: {
      attemptId: attempt._id,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      review: reviewed,
    },
  });
});

export const myHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .populate('quiz', 'title subject topic difficulty')
    .lean();
  res.json({ success: true, attempts });
});

export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.id).populate('quiz', 'title questions');
  if (!attempt) throw ApiError.notFound('Attempt not found');
  if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not allowed');
  }
  res.json({ success: true, attempt });
});
