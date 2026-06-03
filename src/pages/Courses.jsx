import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Users, GraduationCap } from 'lucide-react';
import {
  PageHeader, Card, Button, Input, Select, Field, Textarea, Modal, Loading, EmptyState, Badge,
} from '../components/ui.jsx';
import { courseApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/axios.js';

export default function Courses() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);

  const load = async (mine) => {
    setLoading(true);
    try {
      const { data } = await courseApi.list(mine ? { mine: 'true' } : {});
      setCourses(data.courses);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab === 'mine');
  }, [tab]);

  const enroll = async (id) => {
    try {
      await courseApi.enroll(id);
      toast.success('Enrolled!');
      load(tab === 'mine');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div>
      <PageHeader title="Courses" subtitle="Structured learning paths from your teachers.">
        {isTeacher && <Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> New course</Button>}
      </PageHeader>

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[['all', 'All courses'], ['mine', isTeacher ? 'My courses' : 'Enrolled']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" subtitle={isTeacher ? 'Create your first course.' : 'No courses available right now.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const enrolled = c.students?.some?.((s) => (s._id || s) === user?._id);
            return (
              <Card key={c._id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <Badge color="brand">{c.subject}</Badge>
                  <Badge color="slate" className="capitalize">{c.level}</Badge>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{c.description || 'No description'}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {c.teacher?.name}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.studentCount ?? c.students?.length ?? 0}</span>
                </div>
                {!isTeacher && (
                  <Button variant={enrolled ? 'outline' : 'primary'} className="mt-4 w-full" disabled={enrolled} onClick={() => enroll(c._id)}>
                    {enrolled ? 'Enrolled' : 'Enroll'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CreateCourseModal open={modal} onClose={() => setModal(false)} onCreated={() => { setModal(false); setTab('mine'); }} />
    </div>
  );
}

function CreateCourseModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', subject: '', description: '', level: 'beginner' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await courseApi.create(form);
      toast.success('Course created');
      onCreated();
      setForm({ title: '', subject: '', description: '', level: 'beginner' });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a course">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></Field>
          <Field label="Level">
            <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>
        </div>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
