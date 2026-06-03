import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 2000 },
    subject: { type: String, required: true, trim: true, index: true },
    tags: { type: [String], default: [], index: true },

    // Cloudinary asset
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    fileType: { type: String, default: '' }, // pdf | docx | image | note
    fileSize: { type: Number, default: 0 }, // bytes
    resourceType: { type: String, default: 'raw' }, // cloudinary resource_type

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },

    // Admin moderation
    isFlagged: { type: Boolean, default: false },
    visibility: { type: String, enum: ['private', 'course', 'public'], default: 'private' },
  },
  { timestamps: true }
);

// Full-text-ish search across title/description/tags.
studyMaterialSchema.index({ title: 'text', description: 'text', tags: 'text' });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;
