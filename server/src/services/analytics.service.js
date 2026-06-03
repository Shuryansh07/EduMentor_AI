import mongoose from 'mongoose';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyMaterial from '../models/StudyMaterial.js';
import ChatHistory from '../models/ChatHistory.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

/** Per-student learning analytics for the dashboard. */
export async function studentAnalytics(userId) {
  const uid = oid(userId);

  const [overall, bySubject, recent, trend, materialsCount, chatCount, user] = await Promise.all([
    QuizAttempt.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctCount' },
        },
      },
    ]),
    QuizAttempt.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: '$subject',
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { attempts: -1 } },
    ]),
    QuizAttempt.find({ user: uid })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate('quiz', 'title subject topic difficulty')
      .lean(),
    // Score trend over the last 10 attempts (chronological).
    QuizAttempt.aggregate([
      { $match: { user: uid } },
      { $sort: { submittedAt: -1 } },
      { $limit: 10 },
      { $sort: { submittedAt: 1 } },
      { $project: { _id: 0, score: 1, subject: 1, submittedAt: 1 } },
    ]),
    StudyMaterial.countDocuments({ uploadedBy: uid }),
    ChatHistory.countDocuments({ user: uid }),
    User.findById(uid).lean(),
  ]);

  const o = overall[0] || {};
  return {
    summary: {
      attempts: o.attempts || 0,
      avgScore: Math.round(o.avgScore || 0),
      bestScore: o.bestScore || 0,
      accuracy: o.totalQuestions ? Math.round((o.totalCorrect / o.totalQuestions) * 100) : 0,
      studyMinutes: user?.stats?.studyMinutes || 0,
      streak: user?.stats?.streak || 0,
      materials: materialsCount,
      tutorSessions: chatCount,
    },
    bySubject: bySubject.map((s) => ({
      subject: s._id || 'General',
      attempts: s.attempts,
      avgScore: Math.round(s.avgScore),
    })),
    trend,
    recent,
  };
}

/** Teacher dashboard: performance across their courses' students + their quizzes. */
export async function teacherAnalytics(teacherId) {
  const tid = oid(teacherId);

  const courses = await Course.find({ teacher: tid }).select('title students subject').lean();
  const studentIds = [...new Set(courses.flatMap((c) => c.students.map((s) => s.toString())))];

  const [perCourse, engagement] = await Promise.all([
    Promise.all(
      courses.map(async (c) => {
        const stats = await QuizAttempt.aggregate([
          { $match: { user: { $in: c.students.map(oid) } } },
          { $group: { _id: null, avgScore: { $avg: '$score' }, attempts: { $sum: 1 } } },
        ]);
        return {
          courseId: c._id,
          title: c.title,
          subject: c.subject,
          students: c.students.length,
          avgScore: Math.round(stats[0]?.avgScore || 0),
          attempts: stats[0]?.attempts || 0,
        };
      })
    ),
    QuizAttempt.aggregate([
      { $match: { user: { $in: studentIds.map(oid) } } },
      { $group: { _id: '$subject', attempts: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $sort: { attempts: -1 } },
    ]),
  ]);

  return {
    summary: {
      courses: courses.length,
      students: studentIds.length,
      avgScore: Math.round(
        perCourse.reduce((a, c) => a + c.avgScore, 0) / (perCourse.length || 1)
      ),
    },
    perCourse,
    engagement: engagement.map((e) => ({
      subject: e._id || 'General',
      attempts: e.attempts,
      avgScore: Math.round(e.avgScore),
    })),
  };
}

/** Platform-wide analytics for admins. */
export async function adminAnalytics() {
  const since = new Date();
  since.setDate(since.getDate() - 13); // last 14 days

  const [usersByRole, totals, dailyActivity, topSubjects] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      StudyMaterial.countDocuments(),
      QuizAttempt.countDocuments(),
      ChatHistory.countDocuments(),
      StudyMaterial.countDocuments({ isFlagged: true }),
    ]),
    QuizAttempt.aggregate([
      { $match: { submittedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    QuizAttempt.aggregate([
      { $group: { _id: '$subject', attempts: { $sum: 1 } } },
      { $sort: { attempts: -1 } },
      { $limit: 6 },
    ]),
  ]);

  const [users, courses, materials, attempts, chats, flagged] = totals;
  return {
    summary: { users, courses, materials, attempts, chats, flagged },
    usersByRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
    dailyActivity: dailyActivity.map((d) => ({ date: d._id, attempts: d.attempts })),
    topSubjects: topSubjects.map((s) => ({ subject: s._id || 'General', attempts: s.attempts })),
  };
}
