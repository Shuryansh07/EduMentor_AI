/* Thin wrappers around the Web Speech API (speech-to-text + text-to-speech). */

export const sttSupported = () =>
  typeof window !== 'undefined' &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Create a speech recognizer. Returns { start, stop } or null if unsupported.
 * onResult(finalText) fires once a final transcript is ready.
 */
export function createRecognizer({ onResult, onError, onEnd, lang = 'en-US' } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const recognition = new SR();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    if (finalTranscript) onResult?.(finalTranscript.trim(), true);
    else onResult?.(interim, false);
  };
  recognition.onerror = (e) => onError?.(e.error || 'speech-error');
  recognition.onend = () => onEnd?.(finalTranscript.trim());

  return {
    start: () => {
      finalTranscript = '';
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* noop */
      }
    },
  };
}

/** Strip Markdown so the TTS voice reads clean prose. */
function stripMarkdown(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_~-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedVoice = null;
function pickVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => /Google US English/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null;
  return cachedVoice;
}

/**
 * Speak text aloud. `pitch`/`rate` can be tuned by emotion for expressiveness.
 * Returns the utterance (so callers can await onend via the callbacks).
 */
export function speak(text, { onStart, onEnd, pitch = 1, rate = 1, emotion = 'neutral' } = {}) {
  if (!ttsSupported()) {
    onEnd?.();
    return null;
  }
  window.speechSynthesis.cancel(); // stop anything currently speaking

  const utter = new SpeechSynthesisUtterance(stripMarkdown(text).slice(0, 600));
  const v = pickVoice();
  if (v) utter.voice = v;

  // Emotion-tinted delivery.
  const tone = {
    happy: { pitch: 1.25, rate: 1.06 },
    sad: { pitch: 0.8, rate: 0.92 },
    angry: { pitch: 0.85, rate: 1.12 },
    surprised: { pitch: 1.35, rate: 1.1 },
    greeting: { pitch: 1.2, rate: 1.0 },
    neutral: { pitch: 1, rate: 1 },
  }[emotion] || {};
  utter.pitch = tone.pitch ?? pitch;
  utter.rate = tone.rate ?? rate;

  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utter);
  return utter;
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

// Some browsers load voices asynchronously — warm the cache.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}
