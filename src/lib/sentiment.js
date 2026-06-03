/**
 * Lightweight keyword sentiment → tutor emotion.
 * Returns one of: 'happy' | 'sad' | 'angry' | 'surprised' | 'greeting' | 'neutral'.
 * Used to drive the 3D robot's facial expression + emote reaction.
 */
const GREETING = ['hello', 'hi', 'hey', 'yo', 'good morning', 'good evening', 'namaste'];
const HURT = ['i hate you', 'hate you', 'hate u', 'stupid', 'dumb', 'useless', 'shut up', 'idiot', 'boring', 'worst', 'hurt'];
const ANGRY = ['angry', 'furious', 'annoyed', 'mad at', 'frustrated', 'irritated', 'rage', 'damn', 'wtf'];
const SAD = ['sad', 'depressed', 'unhappy', 'crying', 'cry', 'lonely', 'fail', 'failed', 'failing', 'hopeless', 'disappointed', 'tired'];
const HAPPY = ['love', 'thank', 'thanks', 'awesome', 'great', 'amazing', 'good job', 'well done', 'nice', 'happy', 'excited', 'cool', 'best', 'perfect', 'brilliant', 'wonderful', 'yay'];
const SURPRISED = ['wow', 'whoa', 'really', 'no way', 'surprised', 'unbelievable', 'omg'];

const has = (text, list) => list.some((w) => text.includes(w));

export function detectEmotion(rawText = '') {
  const text = ` ${rawText.toLowerCase().trim()} `;
  if (!text.trim()) return 'neutral';

  // Order matters: hurtful remarks make the tutor sad (as requested),
  // explicit anger words make it angry, etc.
  if (has(text, HURT)) return 'sad';
  if (has(text, ANGRY)) return 'angry';
  if (has(text, SAD)) return 'sad';
  if (has(text, HAPPY)) return 'happy';
  if (has(text, SURPRISED)) return 'surprised';
  if (has(text, GREETING)) return 'greeting';
  return 'neutral';
}

/** Map an emotion to the robot's facial expression morph + a one-shot emote. */
export function emotionToRobot(emotion) {
  switch (emotion) {
    case 'happy':
      return { expression: 'neutral', emote: 'ThumbsUp' };
    case 'sad':
      return { expression: 'Sad', emote: 'No' };
    case 'angry':
      return { expression: 'Angry', emote: 'Punch' };
    case 'surprised':
      return { expression: 'Surprised', emote: 'Jump' };
    case 'greeting':
      return { expression: 'neutral', emote: 'Wave' };
    default:
      return { expression: 'neutral', emote: null };
  }
}

/** Friendly label + emoji for the UI badge. */
export function emotionLabel(emotion) {
  return (
    {
      happy: '😄 Happy',
      sad: '😢 Sad',
      angry: '😠 Angry',
      surprised: '😲 Surprised',
      greeting: '👋 Greeting',
      neutral: '🙂 Listening',
    }[emotion] || '🙂 Listening'
  );
}
