import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['link', 'file', 'video', 'note'], default: 'link' },
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }, // if stored in Cloudinary
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 4000 },
    subject: { type: String, required: true, trim: true, index: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    coverImage: { type: String, default: '' },

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    resources: { type: [resourceSchema], default: [] },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.virtual('studentCount').get(function get() {
  return this.students.length;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;
