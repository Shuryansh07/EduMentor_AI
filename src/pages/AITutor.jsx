import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Plus, Trash2, MessageSquare, Mic, Square, Volume2, VolumeX, Bot, Sparkles,
} from 'lucide-react';
import { Spinner, Badge } from '../components/ui.jsx';
import RobotTutor from '../components/RobotTutor.jsx';
import { chatApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg as apiErr } from '../api/axios.js';
import { cn } from '../lib/cn.js';
import { detectEmotion, emotionToRobot, emotionLabel } from '../lib/sentiment.js';
import { createRecognizer, sttSupported, ttsSupported, speak, stopSpeaking } from '../lib/speech.js';

const GREETING = "Hello! I'm your EduMentor tutor. Ask me anything and I'll help you learn!";

export default function AITutor() {
  const { user } = useAuth();
  const robotRef = useRef(null);
  const recognizerRef = useRef(null);
  const scrollRef = useRef(null);
  const greetedRef = useRef(false);

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [emotion, setEmotion] = useState('neutral');

  const loadSessions = async () => {
    try {
      const { data } = await chatApi.sessions();
      setSessions(data.sessions);
    } catch (e) {
      apiErr(e);
    }
  };

  useEffect(() => {
    loadSessions();
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // ── Robot + voice helpers ──────────────────────────────────────────────
  const react = (text) => {
    const e = detectEmotion(text);
    setEmotion(e);
    // The 3D robot is a nice-to-have — never let it block the conversation.
    try {
      robotRef.current?.react(emotionToRobot(e));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Robot reaction skipped:', err);
    }
    return e;
  };

  const greet = () => {
    greetedRef.current = true;
    setEmotion('greeting');
    robotRef.current?.react({ expression: 'neutral', emote: 'Wave' });
    if (voiceOn) {
      speak(GREETING, {
        emotion: 'greeting',
        onStart: () => robotRef.current?.setSpeaking(true),
        onEnd: () => robotRef.current?.setSpeaking(false),
      });
    }
  };

  const speakReply = (text, withEmotion) => {
    if (!voiceOn) return;
    speak(text, {
      emotion: withEmotion,
      onStart: () => robotRef.current?.setSpeaking(true),
      onEnd: () => {
        robotRef.current?.setSpeaking(false);
        robotRef.current?.setExpression('neutral');
        setEmotion('neutral');
      },
    });
  };

  // ── Conversation ────────────────────────────────────────────────────────
  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');

    const userEmotion = react(message); // robot reacts to YOUR sentiment
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setSending(true);
    try {
      const { data } = await chatApi.send({ sessionId: activeId, message });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      if (!activeId) {
        setActiveId(data.sessionId);
        loadSessions();
      }
      speakReply(data.reply, userEmotion);
    } catch (err) {
      toast.error(apiErr(err, 'The tutor is unavailable'));
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // ── Live voice (push to talk) ─────────────────────────────────────────────
  const toggleListening = () => {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    if (!sttSupported()) {
      toast.error('Voice input needs Chrome or Edge.');
      return;
    }
    if (!greetedRef.current) greet(); // robot says hello the first time

    if (!recognizerRef.current) {
      recognizerRef.current = createRecognizer({
        onResult: (text, isFinal) => {
          setInput(text);
          if (isFinal) {
            setListening(false);
            send(text);
          }
        },
        onError: (err) => {
          setListening(false);
          if (err !== 'no-speech' && err !== 'aborted') toast.error(`Mic: ${err}`);
        },
        onEnd: () => setListening(false),
      });
    }
    setListening(true);
    recognizerRef.current.start();
  };

  const toggleVoice = () => {
    setVoiceOn((v) => {
      if (v) stopSpeaking();
      return !v;
    });
  };

  // ── Sessions ──────────────────────────────────────────────────────────────
  const openSession = async (id) => {
    try {
      const { data } = await chatApi.session(id);
      setActiveId(id);
      setMessages(data.session.messages);
      stopSpeaking();
    } catch (e) {
      toast.error(apiErr(e));
    }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setEmotion('neutral');
    robotRef.current?.setExpression('neutral');
    stopSpeaking();
  };

  const removeSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatApi.remove(id);
      setSessions((p) => p.filter((s) => s._id !== id));
      if (id === activeId) newChat();
    } catch (err) {
      toast.error(apiErr(err));
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sessions sidebar */}
      <aside className="hidden w-60 flex-col rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <button onClick={newChat} className="btn-primary mb-3 w-full"><Plus className="h-4 w-4" /> New chat</button>
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">History</p>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {sessions.length === 0 && <p className="px-2 py-4 text-sm text-slate-400">No conversations yet.</p>}
          {sessions.map((s) => (
            <button key={s._id} onClick={() => openSession(s._id)}
              className={cn('group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                activeId === s._id ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="flex-1 truncate">{s.title}</span>
              <Trash2 onClick={(e) => removeSession(s._id, e)} className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </aside>

      {/* Main tutor panel */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">EduMentor 3D Tutor</p>
              <p className="text-xs text-slate-400">Talk to me — I react to how you feel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={{ happy: 'green', sad: 'brand', angry: 'red', surprised: 'amber', greeting: 'brand' }[emotion] || 'slate'}>
              {emotionLabel(emotion)}
            </Badge>
            <button onClick={toggleVoice} className="btn-ghost !p-2" title={voiceOn ? 'Mute voice' : 'Unmute voice'}>
              {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Robot stage */}
        <div className="relative flex-1 bg-gradient-to-b from-slate-50 to-brand-50/40 dark:from-slate-900 dark:to-brand-950/20">
          <RobotTutor ref={robotRef} className="h-full w-full" />
          {messages.length === 0 && !sending && (
            <div className="pointer-events-none absolute inset-x-0 top-4 text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                <Sparkles className="mr-1 inline h-4 w-4" /> Tap the mic and say hello — or type below
              </p>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="max-h-44 space-y-3 overflow-y-auto border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm',
                m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200')}>
                {m.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                  <div className="prose-chat"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner className="h-4 w-4" /> Thinking…</div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleListening}
              title={listening ? 'Stop' : 'Talk live'}
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl transition',
                listening
                  ? 'animate-pulse bg-red-600 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              )}
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={listening ? 'Listening…' : 'Type or tap the mic to talk…'}
              className="input max-h-28 flex-1 resize-none"
            />
            <button type="submit" disabled={!input.trim() || sending} className="btn-primary !px-3.5 !py-3">
              <Send className="h-4 w-4" />
            </button>
          </form>
          {!ttsSupported() && (
            <p className="mt-2 text-center text-xs text-slate-400">Voice replies need Chrome or Edge.</p>
          )}
        </div>
      </div>
    </div>
  );
}
