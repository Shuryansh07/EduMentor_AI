import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ListChecks, Sparkles, Trash2, Play, History } from 'lucide-react';
import { PageHeader, Card, Button, Select, Loading, EmptyState, Badge } from '../components/ui.jsx';
import { quizApi, attemptApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/axios.js';
import { formatRelative } from '../lib/cn.js';

const diffColor = { beginner: 'green', intermediate: 'amber', advanced: 'red' };

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ difficulty: '', mine: 'false' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.difficulty) params.difficulty = filter.difficulty;
      if (filter.mine === 'true') params.mine = 'true';
      const [q, h] = await Promise.all([
        quizApi.list(params),
        attemptApi.history({ limit: 10 }).catch(() => ({ data: { attempts: [] } })),
      ]);
      setQuizzes(q.data.quizzes);
      setHistory(h.data.attempts);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const remove = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await quizApi.remove(id);
      setQuizzes((p) => p.filter((q) => q._id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div>
      <PageHeader title="Quizzes" subtitle="Attempt AI-generated or teacher-made quizzes.">
        <Link to="/quiz/generate" className="btn-primary"><Sparkles className="h-4 w-4" /> Generate</Link>
      </PageHeader>

      <div className="mb-5 flex gap-3">
        <Select className="w-44" value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}>
          <option value="">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
        <Select className="w-40" value={filter.mine} onChange={(e) => setFilter({ ...filter, mine: e.target.value })}>
          <option value="false">All quizzes</option>
          <option value="true">Created by me</option>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <Loading />
          ) : quizzes.length === 0 ? (
            <EmptyState icon={ListChecks} title="No quizzes found" subtitle="Generate your first AI quiz.">
              <Link to="/quiz/generate" className="btn-primary">Generate a quiz</Link>
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {quizzes.map((q) => (
                <Card key={q._id} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <Badge color="brand">{q.subject}</Badge>
                    <Badge color={diffColor[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold text-slate-900 dark:text-white">{q.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{q.topic}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{q.questionCount ?? q.questions?.length ?? 0} questions</span>
                    <span>· {q.source === 'ai' ? 'AI' : 'Manual'}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/quiz/${q._id}`} className="btn-primary flex-1"><Play className="h-4 w-4" /> Attempt</Link>
                    {(q.createdBy?._id === user?._id || user?.role === 'admin') && (
                      <button onClick={() => remove(q._id)} className="btn-outline !px-3 text-red-500"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <Card className="h-fit">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <History className="h-4 w-4" /> Quiz history
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No attempts yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((a) => (
                <li key={a._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{a.quiz?.title || a.topic}</p>
                    <p className="text-xs text-slate-400">{formatRelative(a.submittedAt)}</p>
                  </div>
                  <Badge color={a.score >= 70 ? 'green' : a.score >= 40 ? 'amber' : 'red'}>{a.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
