import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { Card, Button, Loading, Badge } from '../components/ui.jsx';
import { quizApi, attemptApi } from '../api/endpoints.js';
import { errMsg } from '../api/axios.js';
import { cn } from '../lib/cn.js';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> selectedIndex
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const { data } = await quizApi.get(id); // answer key stripped server-side
        setQuiz(data.quiz);
        startRef.current = Date.now();
      } catch (e) {
        toast.error(errMsg(e));
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <Loading label="Loading quiz…" />;
  if (!quiz) return null;

  // ── Result view ──────────────────────────────────────────────────────────
  if (result) return <ResultView quiz={quiz} result={result} onRetry={() => { setResult(null); setAnswers({}); setCurrent(0); startRef.current = Date.now(); }} />;

  const questions = quiz.questions;
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  const select = (idx) => setAnswers({ ...answers, [q._id]: idx });

  const submit = async () => {
    if (answered < questions.length && !confirm(`You answered ${answered}/${questions.length}. Submit anyway?`)) return;
    setSubmitting(true);
    try {
      const responses = questions.map((qq) => ({
        questionId: qq._id,
        selectedIndex: answers[qq._id] ?? -1,
      }));
      const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
      const { data } = await attemptApi.submit({ quizId: quiz._id, responses, durationSeconds });
      setResult(data.result);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-500">{quiz.subject} · {quiz.topic}</p>
        </div>
        <Badge color="brand" className="capitalize">{quiz.difficulty}</Badge>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{progress}% answered</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
        <div className="mt-5 space-y-3">
          {q.options.map((opt, idx) => {
            const selected = answers[q._id] === idx;
            return (
              <button key={idx} onClick={() => select(idx)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition',
                  selected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/15'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                )}>
                <span className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                  selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
        ) : (
          <Button loading={submitting} onClick={submit}>Submit quiz</Button>
        )}
      </div>
    </div>
  );
}

function ResultView({ quiz, result, onRetry }) {
  const passed = result.score >= 70;
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="text-center">
        <div className={cn('mx-auto grid h-16 w-16 place-items-center rounded-full', passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{result.score}%</h2>
        <p className="mt-1 text-slate-500">
          You got <b>{result.correctCount}</b> of <b>{result.totalQuestions}</b> correct
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="outline" onClick={onRetry}><RotateCcw className="h-4 w-4" /> Retry</Button>
          <Link to="/quizzes" className="btn-primary">Back to quizzes</Link>
        </div>
      </Card>

      <h3 className="mb-3 mt-8 font-semibold text-slate-900 dark:text-white">Review &amp; explanations</h3>
      <div className="space-y-4">
        {result.review.map((r, i) => (
          <Card key={r.questionId}>
            <div className="flex items-start gap-3">
              {r.isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
              <div className="w-full">
                <p className="font-medium text-slate-900 dark:text-white">{i + 1}. {r.question}</p>
                <div className="mt-3 space-y-2">
                  {r.options.map((opt, idx) => {
                    const isCorrect = idx === r.correctIndex;
                    const isChosen = idx === r.selectedIndex;
                    return (
                      <div key={idx} className={cn(
                        'rounded-lg border px-3 py-2 text-sm',
                        isCorrect && 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
                        isChosen && !isCorrect && 'border-red-300 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300',
                        !isCorrect && !isChosen && 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      )}>
                        {String.fromCharCode(65 + idx)}. {opt}
                        {isCorrect && <span className="ml-2 text-xs font-semibold">✓ correct</span>}
                        {isChosen && !isCorrect && <span className="ml-2 text-xs font-semibold">your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {r.explanation && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    💡 {r.explanation}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
