import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, MessageSquare, FileText, Flame, Target, Trophy, Clock,
  ListChecks, ArrowRight, BookOpen,
} from 'lucide-react';
import { StatCard, Card, Loading, Badge, EmptyState } from '../components/ui.jsx';
import { analyticsApi, attemptApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRelative } from '../lib/cn.js';

const quickActions = [
  { to: '/quiz/generate', label: 'Generate a quiz', icon: Sparkles, color: 'from-brand-500 to-brand-700' },
  { to: '/tutor', label: 'Ask the AI tutor', icon: MessageSquare, color: 'from-violet-500 to-violet-700' },
  { to: '/materials', label: 'Upload material', icon: FileText, color: 'from-emerald-500 to-emerald-700' },
  { to: '/courses', label: 'Browse courses', icon: BookOpen, color: 'from-amber-500 to-amber-700' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, h] = await Promise.all([
          analyticsApi.student().catch(() => null),
          attemptApi.history({ limit: 5 }).catch(() => ({ data: { attempts: [] } })),
        ]);
        setData(a?.data?.data || null);
        setRecent(h.data.attempts || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Hi {user?.name?.split(' ')[0]}, ready to learn? 🚀
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s a snapshot of your progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Avg score" value={`${s.avgScore ?? 0}%`} accent="brand" />
        <StatCard icon={Flame} label="Day streak" value={s.streak ?? 0} accent="amber" />
        <StatCard icon={Trophy} label="Best score" value={`${s.bestScore ?? 0}%`} accent="green" />
        <StatCard icon={Clock} label="Study mins" value={s.studyMinutes ?? 0} accent="violet" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick actions</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to} className={`group rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-soft transition hover:scale-[1.02]`}>
              <Icon className="h-6 w-6" />
              <p className="mt-6 text-sm font-semibold">{label}</p>
              <ArrowRight className="mt-1 h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent attempts */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent quiz attempts</h3>
            <Link to="/analytics" className="text-sm font-medium text-brand-600 hover:underline">View analytics</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={ListChecks} title="No attempts yet" subtitle="Generate a quiz to get started.">
              <Link to="/quiz/generate" className="btn-primary">Generate a quiz</Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((a) => (
                <li key={a._id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-200">{a.quiz?.title || a.topic}</p>
                    <p className="text-xs text-slate-400">{a.subject} · {formatRelative(a.submittedAt)}</p>
                  </div>
                  <Badge color={a.score >= 70 ? 'green' : a.score >= 40 ? 'amber' : 'red'}>{a.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Subjects */}
        <Card>
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Subjects</h3>
          {(data?.bySubject || []).length === 0 ? (
            <p className="text-sm text-slate-400">Take quizzes to see subject mastery.</p>
          ) : (
            <ul className="space-y-3">
              {data.bySubject.slice(0, 6).map((sub) => (
                <li key={sub.subject}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sub.subject}</span>
                    <span className="text-slate-400">{sub.avgScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${sub.avgScore}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
