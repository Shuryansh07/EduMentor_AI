import mongoose from 'mongoose';

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: [(v) => v.length >= 2 && v.length <= 6, 'A question needs 2–6 options'],
    },
    // Index into `options` of the correct choice.
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, index: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'beginner', index: true },

    questions: { type: [questionSchema], default: [] },

    source: { type: String, enum: ['ai', 'manual'], default: 'ai' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },

    isPublished: { type: Boolean, default: true },
    attemptsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizSchema.virtual('questionCount').get(function get() {
  return this.questions.length;
});

quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
