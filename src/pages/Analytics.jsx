import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Target, Trophy, Flame, BookOpen, Users, Activity, FileText, MessageSquare } from 'lucide-react';
import { PageHeader, Card, StatCard, Loading, EmptyState } from '../components/ui.jsx';
import { analyticsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const COLORS = ['#3b66ff', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

export default function Analytics() {
  const { user } = useAuth();
  const [view, setView] = useState(user?.role === 'student' ? 'student' : user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher =
      view === 'admin' ? analyticsApi.admin : view === 'teacher' ? analyticsApi.teacher : analyticsApi.student;
    fetcher()
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [view]);

  const tabs = [
    user?.role === 'student' && ['student', 'My progress'],
    (user?.role === 'teacher' || user?.role === 'admin') && ['teacher', 'Teaching'],
    user?.role === 'admin' && ['admin', 'Platform'],
  ].filter(Boolean);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Insights into learning and engagement." />

      {tabs.length > 1 && (
        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setView(k)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${view === k ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {loading ? <Loading /> : !data ? <EmptyState icon={Activity} title="No analytics yet" subtitle="Activity will appear here as you use the platform." /> : (
        view === 'student' ? <StudentView data={data} /> : view === 'teacher' ? <TeacherView data={data} /> : <AdminView data={data} />
      )}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card>
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

function useGrid() {
  const { isDark } = useTheme();
  return { grid: isDark ? '#1e293b' : '#e2e8f0', text: isDark ? '#94a3b8' : '#64748b' };
}

function StudentView({ data }) {
  const s = data.summary;
  const { grid, text } = useGrid();
  const trend = (data.trend || []).map((t, i) => ({ name: `#${i + 1}`, score: t.score }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Avg score" value={`${s.avgScore}%`} accent="brand" />
        <StatCard icon={Trophy} label="Best score" value={`${s.bestScore}%`} accent="green" />
        <StatCard icon={Activity} label="Accuracy" value={`${s.accuracy}%`} accent="violet" />
        <StatCard icon={Flame} label="Streak" value={s.streak} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Score trend (recent attempts)">
          {trend.length ? (
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="name" stroke={text} fontSize={12} />
              <YAxis domain={[0, 100]} stroke={text} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b66ff" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Average score by subject">
          {data.bySubject?.length ? (
            <BarChart data={data.bySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="subject" stroke={text} fontSize={12} />
              <YAxis domain={[0, 100]} stroke={text} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#3b66ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : <Empty />}
        </ChartCard>
      </div>
    </div>
  );
}

function TeacherView({ data }) {
  const s = data.summary;
  const { grid, text } = useGrid();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={BookOpen} label="Courses" value={s.courses} accent="brand" />
        <StatCard icon={Users} label="Students" value={s.students} accent="green" />
        <StatCard icon={Target} label="Avg score" value={`${s.avgScore}%`} accent="violet" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Average score per course">
          {data.perCourse?.length ? (
            <BarChart data={data.perCourse}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="title" stroke={text} fontSize={11} />
              <YAxis domain={[0, 100]} stroke={text} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : <Empty />}
        </ChartCard>
        <ChartCard title="Engagement by subject (attempts)">
          {data.engagement?.length ? (
            <BarChart data={data.engagement}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="subject" stroke={text} fontSize={12} />
              <YAxis stroke={text} fontSize={12} />
              <Tooltip />
              <Bar dataKey="attempts" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : <Empty />}
        </ChartCard>
      </div>
    </div>
  );
}

function AdminView({ data }) {
  const s = data.summary;
  const { grid, text } = useGrid();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={Users} label="Users" value={s.users} accent="brand" />
        <StatCard icon={BookOpen} label="Courses" value={s.courses} accent="green" />
        <StatCard icon={FileText} label="Materials" value={s.materials} accent="violet" />
        <StatCard icon={Activity} label="Attempts" value={s.attempts} accent="amber" />
        <StatCard icon={MessageSquare} label="Chats" value={s.chats} accent="brand" />
        <StatCard icon={FileText} label="Flagged" value={s.flagged} accent="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Daily activity (14 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {data.dailyActivity?.length ? (
                <LineChart data={data.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="date" stroke={text} fontSize={11} />
                  <YAxis stroke={text} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="attempts" stroke="#3b66ff" strokeWidth={2.5} />
                </LineChart>
              ) : <Empty />}
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Users by role</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.usersByRole} dataKey="count" nameKey="role" outerRadius={80} label>
                  {data.usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Not enough data yet.
    </div>
  );
}
