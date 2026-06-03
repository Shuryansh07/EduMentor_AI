import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Users } from 'lucide-react';
import AuthShell from '../../components/AuthShell.jsx';
import { Button, Field, Input } from '../../components/ui.jsx';
import { GoogleButton } from '../../components/GoogleAuth.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../api/axios.js';
import { cn } from '../../lib/cn.js';

const rules = [
  { test: (p) => p.length >= 8, label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /\d/.test(p), label: 'A number' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const allValid = rules.every((r) => r.test(form.password)) && form.name && form.email;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return toast.error('Please meet all password requirements');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created — welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning with your AI mentor in seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="I am a…">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'student', label: 'Student', icon: GraduationCap },
              { value: 'teacher', label: 'Teacher', icon: Users },
            ].map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm({ ...form, role: value })}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
                  form.role === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Full name">
          <Input name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required />
        </Field>
        <Field label="Email">
          <Input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
        </Field>

        <ul className="grid grid-cols-2 gap-1.5 text-xs">
          {rules.map((r) => {
            const ok = r.test(form.password);
            return (
              <li key={r.label} className={cn('flex items-center gap-1.5', ok ? 'text-emerald-600' : 'text-slate-400')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-slate-300')} />
                {r.label}
              </li>
            );
          })}
        </ul>

        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>

      <div className="mt-5">
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
