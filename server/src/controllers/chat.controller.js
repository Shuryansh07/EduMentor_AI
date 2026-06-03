import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ChatHistory from '../models/ChatHistory.js';
import { tutorReply } from '../services/ai.service.js';
import { bumpStudyActivity } from '../services/quiz.service.js';

const MAX_CONTEXT = 20; // messages of history sent to the model

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatHistory.find({ user: req.user._id })
    .sort({ lastMessageAt: -1 })
    .select('title subject lastMessageAt createdAt')
    .lean();
  res.json({ success: true, sessions });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await ChatHistory.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) throw ApiError.notFound('Conversation not found');
  res.json({ success: true, session });
});

/**
 * Send a message. Creates a new session when `sessionId` is omitted.
 * Persists both the user message and the assistant reply.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { sessionId, message, subject } = req.body;

  let session = sessionId
    ? await ChatHistory.findOne({ _id: sessionId, user: req.user._id })
    : null;

  if (!session) {
    session = new ChatHistory({
      user: req.user._id,
      subject: subject || '',
      title: message.slice(0, 60),
      messages: [],
    });
  }

  session.messages.push({ role: 'user', content: message });

  const context = session.messages.slice(-MAX_CONTEXT).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const answer = await tutorReply({ history: context, subject: session.subject });

  session.messages.push({ role: 'assistant', content: answer });
  session.lastMessageAt = new Date();
  await session.save();

  await bumpStudyActivity(req.user._id, 1);

  res.json({
    success: true,
    sessionId: session._id,
    title: session.title,
    reply: answer,
  });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const deleted = await ChatHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) throw ApiError.notFound('Conversation not found');
  res.json({ success: true, message: 'Conversation deleted' });
});
