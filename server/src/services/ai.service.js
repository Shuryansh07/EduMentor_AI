import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

let client = null;
function getClient() {
  if (!env.gemini.apiKey) {
    throw ApiError.badRequest('AI is not configured on the server (missing GEMINI_API_KEY)');
  }
  if (!client) client = new GoogleGenerativeAI(env.gemini.apiKey);
  return client;
}

export const isAiConfigured = () => Boolean(env.gemini.apiKey);

/**
 * Models tried in order. The configured model is preferred; the rest are
 * fallbacks for when a model is overloaded (503) or rate-limited (429).
 */
const MODEL_CHAIN = [...new Set([env.gemini.model, 'gemini-2.0-flash', 'gemini-flash-latest'])];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient errors worth retrying / falling back on (overload, rate limit). */
function isTransient(err) {
  const m = (err?.message || '').toLowerCase();
  return (
    m.includes('503') ||
    m.includes('overloaded') ||
    m.includes('high demand') ||
    m.includes('unavailable') ||
    m.includes('429') ||
    m.includes('rate limit') ||
    m.includes('timeout')
  );
}

/**
 * Run an AI request with retries + model fallback.
 * `makeRequest(modelName)` should perform one call and return the response text.
 */
async function withResilience(makeRequest, label) {
  let lastErr;
  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await makeRequest(modelName);
      } catch (err) {
        lastErr = err;
        if (!isTransient(err)) throw err; // real error → surface immediately
        logger.warn(`${label}: ${modelName} transient failure (attempt ${attempt + 1}) — ${err.message?.slice(0, 80)}`);
        await sleep(500 * (attempt + 1));
      }
    }
    logger.warn(`${label}: model ${modelName} unavailable, trying next…`);
  }
  // All models/attempts exhausted with transient errors.
  logger.error(`${label}: all models exhausted — ${lastErr?.message}`);
  throw ApiError.badRequest('The AI service is busy right now. Please try again in a few seconds.');
}

/** Pull the first JSON object/array out of a model response (handles ```json fences). */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found in AI response');
  const slice = candidate.slice(start);
  try {
    return JSON.parse(slice);
  } catch {
    const lastBrace = Math.max(slice.lastIndexOf(']'), slice.lastIndexOf('}'));
    return JSON.parse(slice.slice(0, lastBrace + 1));
  }
}

/**
 * Generate a multiple-choice quiz with Gemini.
 * Returns { title, questions: [{ question, options[], correctIndex, explanation }] }
 */
export async function generateQuiz({ subject, topic, difficulty = 'beginner', count = 5 }) {
  const numQuestions = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);

  const prompt = `You are an expert ${subject} teacher creating a ${difficulty}-level quiz on "${topic}".
Generate exactly ${numQuestions} multiple-choice questions.

Return ONLY valid JSON matching this schema (no prose, no markdown):
{
  "title": "string — a concise quiz title",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string — why the correct option is right"
    }
  ]
}

Rules:
- Exactly 4 options per question.
- "correctIndex" is the 0-based index of the correct option.
- Difficulty "${difficulty}": ${difficultyHint(difficulty)}
- Keep questions unambiguous and factually correct.`;

  const text = await withResilience(async (modelName) => {
    const model = getClient().getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }, 'quiz-generation');

  let parsed;
  try {
    parsed = extractJson(text);
  } catch (err) {
    logger.error('Gemini quiz parse failed:', err.message);
    throw ApiError.badRequest('AI returned an unexpected format. Please retry.');
  }

  const questions = (parsed.questions || [])
    .filter((q) => q && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      question: String(q.question || '').trim(),
      options: q.options.map((o) => String(o)),
      correctIndex: clampIndex(q.correctIndex, q.options.length),
      explanation: String(q.explanation || '').trim(),
    }))
    .filter((q) => q.question);

  if (!questions.length) throw ApiError.badRequest('AI returned no valid questions, please retry.');

  return {
    title: parsed.title?.trim() || `${topic} — ${capitalize(difficulty)} Quiz`,
    questions,
  };
}

/**
 * Context-aware tutor reply. `history` is an array of { role, content }.
 * Returns the assistant's markdown answer string.
 */
export async function tutorReply({ history = [], subject = '' }) {
  // Gemini expects roles 'user' | 'model'. Map our 'assistant' → 'model'.
  const contents = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  return withResilience(async (modelName) => {
    const model = getClient().getGenerativeModel({
      model: modelName,
      systemInstruction: tutorSystemPrompt(subject),
      generationConfig: { temperature: 0.6 },
    });
    const result = await model.generateContent({ contents });
    return result.response.text().trim();
  }, 'tutor-reply');
}

// ── helpers ────────────────────────────────────────────────────────────────
function tutorSystemPrompt(subject) {
  return `You are EduMentor, a patient, encouraging AI tutor.
${subject ? `The student is focused on: ${subject}.` : ''}
Teach using clear explanations, step-by-step reasoning, and small examples.
Use Markdown (headings, bullet lists, code blocks, and KaTeX-style $...$ for math).
When a student is wrong, gently correct them and explain why.
Keep answers focused and concise; ask a guiding question when it helps learning.`;
}

function difficultyHint(d) {
  return (
    {
      beginner: 'foundational recall and basic understanding.',
      intermediate: 'application and multi-step reasoning.',
      advanced: 'analysis, edge cases, and synthesis of multiple concepts.',
    }[d] || 'foundational understanding.'
  );
}

const clampIndex = (i, len) => {
  const n = parseInt(i, 10);
  return Number.isFinite(n) && n >= 0 && n < len ? n : 0;
};
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
