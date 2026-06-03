import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: { type: Number, default: -1 }, // -1 = skipped
    correctIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },

    // Denormalised for fast analytics without populating the quiz.
    subject: { type: String, index: true },
    topic: { type: String },
    difficulty: { type: String },

    answers: { type: [answerSchema], default: [] },
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    score: { type: Number, required: true }, // percentage 0–100

    durationSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, submittedAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
