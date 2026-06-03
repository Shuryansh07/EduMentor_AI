/* Seeds demo accounts and a sample course. Run with: npm run seed */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import logger from '../config/logger.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';

const PASSWORD = 'Password123!';

const demoUsers = [
  { name: 'Ada Admin', email: 'admin@edumentor.ai', role: 'admin', subjects: [] },
  { name: 'Tina Teacher', email: 'teacher@edumentor.ai', role: 'teacher', subjects: ['Mathematics', 'Physics'] },
  { name: 'Sam Student', email: 'student@edumentor.ai', role: 'student', subjects: ['Mathematics'] },
];

async function run() {
  await connectDB();
  logger.info('Seeding database…');

  // Upsert users (create with hashed password via the model hook).
  const users = {};
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({ ...u, password: PASSWORD });
      logger.info(`  + created ${u.role}: ${u.email}`);
    } else {
      logger.info(`  = ${u.role} already exists: ${u.email}`);
    }
    users[u.role] = user;
  }

  // Sample course owned by the teacher, with the student enrolled.
  const exists = await Course.findOne({ title: 'Algebra Foundations' });
  if (!exists) {
    await Course.create({
      title: 'Algebra Foundations',
      description: 'Build a rock-solid base in algebra: equations, functions, and graphs.',
      subject: 'Mathematics',
      level: 'beginner',
      teacher: users.teacher._id,
      students: [users.student._id],
      resources: [
        { title: 'Khan Academy — Algebra Basics', type: 'link', url: 'https://www.khanacademy.org/math/algebra-basics' },
      ],
    });
    logger.info('  + created sample course: Algebra Foundations');
  }

  // A sample manual quiz.
  const quizExists = await Quiz.findOne({ title: 'Algebra Warm-up' });
  if (!quizExists) {
    await Quiz.create({
      title: 'Algebra Warm-up',
      subject: 'Mathematics',
      topic: 'Linear equations',
      difficulty: 'beginner',
      source: 'manual',
      createdBy: users.teacher._id,
      questions: [
        {
          question: 'Solve for x: 2x + 4 = 10',
          options: ['1', '2', '3', '4'],
          correctIndex: 2,
          explanation: '2x = 6, so x = 3.',
        },
        {
          question: 'What is the slope of y = 3x + 1?',
          options: ['1', '3', '-3', '0'],
          correctIndex: 1,
          explanation: 'In y = mx + b, m (the slope) is 3.',
        },
      ],
    });
    logger.info('  + created sample quiz: Algebra Warm-up');
  }

  logger.info(`✅ Seed complete. Demo password for all accounts: ${PASSWORD}`);
  await disconnectDB();
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
