import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Score a submitted attempt against the quiz's answer key.
 * `responses` is [{ questionId, selectedIndex }].
 */
export async function gradeAttempt({ quiz, user, responses = [], durationSeconds = 0 }) {
  const keyById = new Map(quiz.questions.map((q) => [q._id.toString(), q.correctIndex]));

  const answers = quiz.questions.map((q) => {
    const submitted = responses.find((r) => String(r.questionId) === q._id.toString());
    const selectedIndex = submitted ? Number(submitted.selectedIndex) : -1;
    const correctIndex = keyById.get(q._id.toString());
    return {
      questionId: q._id,
      selectedIndex: Number.isInteger(selectedIndex) ? selectedIndex : -1,
      correctIndex,
      isCorrect: selectedIndex === correctIndex,
    };
  });

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const attempt = await QuizAttempt.create({
    user: user._id,
    quiz: quiz._id,
    subject: quiz.subject,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    answers,
    correctCount,
    totalQuestions,
    score,
    durationSeconds,
  });

  // Maintain rollups.
  await Quiz.findByIdAndUpdate(quiz._id, { $inc: { attemptsCount: 1 } });
  await bumpStudyActivity(user._id, Math.ceil(durationSeconds / 60));

  return attempt;
}

/** Increment study minutes and maintain a simple daily streak. */
export async function bumpStudyActivity(userId, minutes = 0) {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const last = user.stats.lastActiveOn ? new Date(user.stats.lastActiveOn) : null;
  const sameDay = last && last.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const wasYesterday = last && last.toDateString() === yesterday.toDateString();

  if (!sameDay) {
    user.stats.streak = wasYesterday ? user.stats.streak + 1 : 1;
  }
  user.stats.studyMinutes += Math.max(0, minutes);
  user.stats.lastActiveOn = now;
  await user.save({ validateBeforeSave: false });
}

export function assertCanModifyQuiz(quiz, user) {
  if (!quiz) throw ApiError.notFound('Quiz not found');
  const owner = quiz.createdBy.toString() === user._id.toString();
  if (!owner && user.role !== 'admin') throw ApiError.forbidden('Not allowed to modify this quiz');
}
