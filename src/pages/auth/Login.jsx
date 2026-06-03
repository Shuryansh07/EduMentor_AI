import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Button, Field, Input } from '../../components/ui.jsx';
import { GoogleButton } from '../../components/GoogleAuth.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../api/axios.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to EduMentor AI"
      subtitle="Continue your learning journey."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create one</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required autoComplete="current-password" />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>

      <div className="mt-5">
        <GoogleButton />
      </div>

      <p className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-slate-800/60">
        Demo: <b>student@edumentor.ai</b> · <b>Password123!</b>
      </p>
    </AuthShell>
  );
}
