import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** One document per chat session, so a user can have many parallel conversations. */
const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation', maxlength: 160 },
    subject: { type: String, default: '' }, // optional subject focus for context
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, lastMessageAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
