import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Wand2, BrainCircuit } from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, Field } from '../components/ui.jsx';
import { quizApi } from '../api/endpoints.js';
import { errMsg } from '../api/axios.js';
import { cn } from '../lib/cn.js';

const difficulties = [
  { key: 'beginner', label: 'Beginner', desc: 'Foundational recall' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Applied reasoning' },
  { key: 'advanced', label: 'Advanced', desc: 'Analysis & synthesis' },
];

export default function QuizGenerator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', topic: '', difficulty: 'beginner', count: 5 });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await quizApi.generate({ ...form, count: Number(form.count), save: true });
      toast.success('Quiz generated! 🎉');
      navigate(`/quiz/${data.quiz._id}`);
    } catch (err) {
      toast.error(errMsg(err, 'Generation failed — try a different topic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI Quiz Generator" subtitle="Describe a topic and let Gemini craft a quiz with explanations." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject">
                <Input name="subject" value={form.subject} onChange={onChange} placeholder="e.g. Biology" required />
              </Field>
              <Field label="Topic">
                <Input name="topic" value={form.topic} onChange={onChange} placeholder="e.g. Photosynthesis" required />
              </Field>
            </div>

            <Field label="Difficulty">
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button type="button" key={d.key} onClick={() => setForm({ ...form, difficulty: d.key })}
                    className={cn(
                      'rounded-xl border p-3 text-left transition',
                      form.difficulty === d.key
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/15'
                        : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    )}>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.label}</p>
                    <p className="text-xs text-slate-400">{d.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Number of questions: ${form.count}`}>
              <input type="range" name="count" min="3" max="15" value={form.count} onChange={onChange}
                className="w-full accent-brand-600" />
            </Field>

            <Button type="submit" loading={loading} className="w-full py-3">
              <Wand2 className="h-4 w-4" /> {loading ? 'Generating…' : 'Generate quiz'}
            </Button>
          </form>
        </Card>

        <Card className="bg-gradient-to-br from-brand-600 to-brand-900 text-white">
          <BrainCircuit className="h-8 w-8" />
          <h3 className="mt-4 text-lg font-semibold">How it works</h3>
          <ol className="mt-3 space-y-3 text-sm text-white/85">
            {[
              'Enter a subject and a focused topic.',
              'Pick a difficulty that matches your level.',
              'Gemini writes questions, options & explanations.',
              'Attempt it instantly — graded automatically.',
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 p-3 text-xs">
            <Sparkles className="h-4 w-4" /> Tip: the more specific the topic, the better the questions.
          </div>
        </Card>
      </div>
    </div>
  );
}
